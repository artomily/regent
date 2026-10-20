import {
  contracts,
  getSmartAccountsEnvironment,
  type Delegation,
} from "@metamask/smart-accounts-kit"
import {
  createPublicClient,
  createWalletClient,
  custom,
  decodeEventLog,
  http,
  type Abi,
  type Hex,
} from "viem"
import { baseSepolia } from "viem/chains"
import artifact from "../../../contract/abi/RegentMandate.json"
import {
  AGENT_ADDRESS,
  BASE_SEPOLIA_CHAIN_ID,
  CHAIN,
  MANDATE_CONTRACT,
  TOKEN_ADDRESSES,
} from "./constants"
import type { Mandate } from "./types"

export const regentMandateAbi = artifact.abi as Abi

export function isOnChainEnabled(): boolean {
  return Boolean(MANDATE_CONTRACT && MANDATE_CONTRACT.trim().length > 0)
}

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(CHAIN.rpcUrl),
})

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Hex

export interface RegisterMandateResult {
  txHash: Hex
  onChainId: Hex
}

/**
 * Register the mandate boundaries on-chain so the contract — not the agent —
 * enforces budget, slippage, and expiry. Returns the transaction hash and on-chain mandate id.
 */
export async function registerMandateOnChain(
  mandate: Mandate,
  owner: Hex,
): Promise<RegisterMandateResult> {
  if (!isOnChainEnabled()) throw new Error("NEXT_PUBLIC_MANDATE_CONTRACT is not set")
  if (!window.ethereum) throw new Error("No injected wallet found")

  const wallet = createWalletClient({ chain: baseSepolia, transport: custom(window.ethereum) })

  const sourceToken =
    TOKEN_ADDRESSES[mandate.sourceAsset.toUpperCase()] ?? TOKEN_ADDRESSES.USDC
  const targetToken =
    TOKEN_ADDRESSES[mandate.targetAsset.toUpperCase()] ?? ZERO_ADDRESS

  const agent = AGENT_ADDRESS || owner
  const budgetUnits = BigInt(Math.round(mandate.budget * 1e6))
  const slippageBps = Math.round(mandate.maxSlippage * 100)
  const expiryTimestamp = BigInt(Math.floor(new Date(mandate.expiry).getTime() / 1000))

  const hash = await wallet.writeContract({
    account: owner,
    address: MANDATE_CONTRACT as Hex,
    abi: regentMandateAbi,
    functionName: "createMandate",
    args: [
      agent,
      sourceToken,
      targetToken,
      budgetUnits,
      slippageBps,
      expiryTimestamp,
      mandate.goal,
    ],
  })

  // Wait for receipt and decode the MandateCreated event
  const receipt = await publicClient.waitForTransactionReceipt({ hash })

  let onChainId: Hex | null = null
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: regentMandateAbi,
        data: log.data,
        topics: log.topics,
      })
      if (decoded.eventName === "MandateCreated") {
        onChainId = ((decoded.args as unknown) as { id: Hex }).id
        break
      }
    } catch {
      // Ignore logs that don't match MandateCreated
    }
  }

  // Fallback: if topic[1] is present in the first matching log
  if (!onChainId && receipt.logs.length > 0) {
    onChainId = (receipt.logs[0].topics[1] as Hex) || null
  }

  if (!onChainId) {
    throw new Error("Mandate created on-chain but could not parse onChainId from receipt")
  }

  return { txHash: hash, onChainId }
}

/**
 * Revoke mandate on-chain via RegentMandate.
 */
export async function revokeMandateOnChain(onChainId: Hex, owner: Hex): Promise<Hex> {
  if (!isOnChainEnabled()) throw new Error("NEXT_PUBLIC_MANDATE_CONTRACT is not set")
  if (!window.ethereum) throw new Error("No injected wallet found")

  const wallet = createWalletClient({ chain: baseSepolia, transport: custom(window.ethereum) })
  const hash = await wallet.writeContract({
    account: owner,
    address: MANDATE_CONTRACT as Hex,
    abi: regentMandateAbi,
    functionName: "revokeMandate",
    args: [onChainId],
  })

  await publicClient.waitForTransactionReceipt({ hash })
  return hash
}

/**
 * Disables the ERC-7710 delegation on-chain via DelegationManager.
 */
export async function disableDelegationOnChain(
  delegation: Delegation,
  owner: Hex,
): Promise<Hex> {
  if (!window.ethereum) throw new Error("No injected wallet found")
  const env = getSmartAccountsEnvironment(BASE_SEPOLIA_CHAIN_ID)
  const wallet = createWalletClient({ chain: baseSepolia, transport: custom(window.ethereum) })

  const callData = contracts.DelegationManager.encode.disableDelegation({ delegation })
  const hash = await wallet.sendTransaction({
    account: owner,
    to: env.DelegationManager,
    data: callData,
    chain: baseSepolia,
  })

  await publicClient.waitForTransactionReceipt({ hash })
  return hash
}

export async function readRemainingBudget(onChainId: Hex): Promise<bigint> {
  if (!isOnChainEnabled()) throw new Error("NEXT_PUBLIC_MANDATE_CONTRACT is not set")
  return (await publicClient.readContract({
    address: MANDATE_CONTRACT as Hex,
    abi: regentMandateAbi,
    functionName: "remainingBudget",
    args: [onChainId],
  })) as bigint
}

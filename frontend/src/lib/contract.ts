import {
  contracts,
  getSmartAccountsEnvironment,
  type Delegation,
  type MetaMaskSmartAccount,
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
import { deserializeDelegation } from "./delegation"
import type { Mandate } from "./types"
import {
  createMetaMaskSmartAccount,
  deploySmartAccountIfNeeded,
  getBundlerClient,
} from "./wallet"

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

export interface DisableDelegationResult {
  txHash?: Hex
  userOpHash?: Hex
  disabledOnChain: boolean
  message: string
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

  // Wait for receipt and decode the MandateCreated event strictly from MANDATE_CONTRACT
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  const expectedContract = (MANDATE_CONTRACT as Hex).toLowerCase()

  let onChainId: Hex | null = null
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== expectedContract) {
      continue
    }
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
      // Ignore non-matching logs from this address
    }
  }

  if (!onChainId) {
    throw new Error(
      `MandateCreated event from ${MANDATE_CONTRACT} was not found in transaction receipt ${hash}`,
    )
  }

  return { txHash: hash, onChainId }
}

/**
 * Revoke mandate on-chain via RegentMandate.
 * This represents an on-chain mandate registry state change (MandateStatus.Revoked),
 * preventing any future execution from being recorded against this mandate ID.
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
 * Disables the ERC-7710 delegation on-chain in DelegationManager via an ERC-4337 Smart Account UserOperation.
 *
 * NOTE ON REVOCATION ARCHITECTURE:
 * - RegentMandate.revokeMandate(): Revokes the mandate record in RegentMandate's registry (called by owner EOA).
 * - DelegationManager.disableDelegation(): Disables the ERC-7710 delegation key on-chain so delegate redemption reverts.
 *   Because DelegationManager checks msg.sender == delegation.delegator (the Smart Account), this must be executed
 *   as a UserOperation by the Smart Account via an ERC-4337 bundler.
 */
export async function disableDelegationOnChain(
  delegationOrPair: Delegation | { approve?: unknown; swap?: unknown } | Delegation[],
  owner: Hex,
  smartAccount?: MetaMaskSmartAccount,
): Promise<DisableDelegationResult> {
  const env = getSmartAccountsEnvironment(BASE_SEPOLIA_CHAIN_ID)
  const sa = smartAccount ?? (await createMetaMaskSmartAccount(owner))
  await deploySmartAccountIfNeeded(sa, owner)

  const delegationsToDisable: Delegation[] = []
  if (Array.isArray(delegationOrPair)) {
    delegationsToDisable.push(...delegationOrPair)
  } else if (delegationOrPair && typeof delegationOrPair === "object") {
    if ("delegate" in delegationOrPair && "delegator" in delegationOrPair && "caveats" in delegationOrPair) {
      delegationsToDisable.push(delegationOrPair as Delegation)
    } else {
      const pair = delegationOrPair as { approve?: unknown; swap?: unknown }
      if (pair.approve) {
        try {
          delegationsToDisable.push(deserializeDelegation(pair.approve))
        } catch {}
      }
      if (pair.swap) {
        try {
          delegationsToDisable.push(deserializeDelegation(pair.swap))
        } catch {}
      }
    }
  }

  if (delegationsToDisable.length === 0) {
    return {
      disabledOnChain: false,
      message: "No delegations found to disable",
    }
  }

  const bundler = getBundlerClient(sa)
  if (!bundler) {
    const message =
      "NEXT_PUBLIC_BUNDLER_URL not configured: DelegationManager disable requires an ERC-4337 UserOp from the smart account. Skipping DelegationManager disable; mandate was revoked on RegentMandate registry."
    console.warn(message)
    return {
      disabledOnChain: false,
      message,
    }
  }

  const calls = delegationsToDisable.map((delegation) => ({
    to: env.DelegationManager as Hex,
    data: contracts.DelegationManager.encode.disableDelegation({ delegation }),
    value: BigInt(0),
  }))

  const userOpHash = await bundler.sendUserOperation({
    account: sa,
    calls,
  })

  const receipt = await bundler.waitForUserOperationReceipt({ hash: userOpHash })
  return {
    txHash: receipt.receipt.transactionHash,
    userOpHash,
    disabledOnChain: true,
    message: `${delegationsToDisable.length} delegation(s) disabled on DelegationManager via Smart Account UserOp.`,
  }
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

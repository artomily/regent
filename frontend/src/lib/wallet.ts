import { createWalletClient, custom, type Hex } from "viem"
import { base } from "viem/chains"
import { MANDATE_CONTRACT } from "./constants"
import type { Mandate } from "./types"

export function hasInjectedWallet(): boolean {
  return typeof window !== "undefined" && Boolean(window.ethereum)
}

function walletClient() {
  if (!window.ethereum) throw new Error("No injected wallet found")
  return createWalletClient({ chain: base, transport: custom(window.ethereum) })
}

export async function connectWallet(): Promise<Hex | null> {
  if (!hasInjectedWallet()) return null
  const [address] = await walletClient().requestAddresses()
  return address ?? null
}

export async function ensureBaseMainnet(): Promise<void> {
  if (!hasInjectedWallet()) return
  const client = walletClient()
  try {
    await client.switchChain({ id: base.id })
  } catch {
    // Chain unknown to the wallet — register it, then switch.
    await client.addChain({ chain: base })
    await client.switchChain({ id: base.id })
  }
}

/**
 * The authorization moment: the owner signs the mandate boundaries as EIP-712
 * typed data. The signature is stored as the delegation reference; in the full
 * Smart Accounts flow this is where the ERC-7710 delegation gets granted.
 */
export async function signMandateAuthorization(mandate: Mandate, account: Hex): Promise<Hex> {
  return walletClient().signTypedData({
    account,
    domain: {
      name: "RegentMandate",
      version: "1",
      chainId: base.id,
      ...(MANDATE_CONTRACT ? { verifyingContract: MANDATE_CONTRACT as Hex } : {}),
    },
    types: {
      MandateAuthorization: [
        { name: "mandateId", type: "string" },
        { name: "goal", type: "string" },
        { name: "sourceAsset", type: "string" },
        { name: "targetAsset", type: "string" },
        { name: "budget", type: "uint256" },
        { name: "maxSlippageBps", type: "uint16" },
        { name: "expiry", type: "uint64" },
      ],
    },
    primaryType: "MandateAuthorization",
    message: {
      mandateId: mandate.id,
      goal: mandate.goal,
      sourceAsset: mandate.sourceAsset,
      targetAsset: mandate.targetAsset,
      budget: BigInt(Math.round(mandate.budget * 1e6)),
      maxSlippageBps: Math.round(mandate.maxSlippage * 100),
      expiry: BigInt(Math.floor(new Date(mandate.expiry).getTime() / 1000)),
    },
  })
}

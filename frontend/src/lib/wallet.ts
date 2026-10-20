import {
  Implementation,
  toMetaMaskSmartAccount,
  type MetaMaskSmartAccount,
} from "@metamask/smart-accounts-kit"
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Hex,
} from "viem"
import { createBundlerClient } from "viem/account-abstraction"
import { baseSepolia } from "viem/chains"
import {
  BASE_SEPOLIA_CHAIN_ID,
  BUNDLER_URL,
  CHAIN,
  MANDATE_CONTRACT,
  TOKEN_ADDRESSES,
} from "./constants"
import type { Mandate } from "./types"

const WALLET_STORAGE_KEY = "regent_connected_address"

export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const

export function hasInjectedWallet(): boolean {
  return typeof window !== "undefined" && Boolean(window.ethereum)
}

export function getPublicClient() {
  return createPublicClient({
    chain: baseSepolia,
    transport: http(CHAIN.rpcUrl),
  })
}

export function getWalletClient(account?: Hex) {
  if (!window.ethereum) throw new Error("No injected wallet found")
  return createWalletClient({
    account,
    chain: baseSepolia,
    transport: custom(window.ethereum),
  })
}

export function getBundlerClient(smartAccount?: MetaMaskSmartAccount) {
  if (!BUNDLER_URL) return null
  const publicClient = getPublicClient()
  return createBundlerClient({
    account: smartAccount,
    chain: baseSepolia,
    client: publicClient,
    transport: http(BUNDLER_URL),
  })
}

export async function connectWallet(): Promise<Hex | null> {
  if (!hasInjectedWallet()) return null
  const client = getWalletClient()
  const [address] = await client.requestAddresses()
  if (address) {
    if (typeof window !== "undefined") {
      localStorage.setItem(WALLET_STORAGE_KEY, address)
    }
    await ensureBaseSepolia().catch(() => {})
  }
  return (address as Hex) ?? null
}

export function disconnectWallet(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(WALLET_STORAGE_KEY)
  }
}

export function getPersistedWalletAddress(): Hex | null {
  if (typeof window === "undefined") return null
  const saved = localStorage.getItem(WALLET_STORAGE_KEY)
  return (saved as Hex) ?? null
}

export async function ensureBaseSepolia(): Promise<void> {
  if (!hasInjectedWallet()) return
  const client = getWalletClient()
  try {
    await client.switchChain({ id: baseSepolia.id })
  } catch {
    await client.addChain({
      chain: {
        id: BASE_SEPOLIA_CHAIN_ID,
        name: CHAIN.name,
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: { default: { http: [CHAIN.rpcUrl] } },
        blockExplorers: { default: { name: "Basescan", url: CHAIN.explorerUrl } },
      },
    })
    await client.switchChain({ id: baseSepolia.id })
  }
}

/** Backwards-compatible alias */
export const ensureBaseMainnet = ensureBaseSepolia

export function setupWalletListeners(
  onAccountsChange: (account: Hex | null) => void,
  onChainChange: (chainId: number) => void,
): () => void {
  if (typeof window === "undefined" || !window.ethereum) {
    return () => {}
  }

  const handleAccounts = (accounts: unknown) => {
    const list = Array.isArray(accounts) ? (accounts as string[]) : []
    const next = list[0] ? (list[0] as Hex) : null
    if (next) {
      localStorage.setItem(WALLET_STORAGE_KEY, next)
    } else {
      localStorage.removeItem(WALLET_STORAGE_KEY)
    }
    onAccountsChange(next)
  }

  const handleChain = (chainIdHex: unknown) => {
    const parsed = typeof chainIdHex === "string" ? parseInt(chainIdHex, 16) : Number(chainIdHex)
    onChainChange(parsed)
  }

  const eth = window.ethereum as {
    on?: (event: string, handler: (...args: unknown[]) => void) => void
    removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
  }

  eth.on?.("accountsChanged", handleAccounts)
  eth.on?.("chainChanged", handleChain)

  return () => {
    eth.removeListener?.("accountsChanged", handleAccounts)
    eth.removeListener?.("chainChanged", handleChain)
  }
}

/**
 * Creates the user's MetaMask Smart Account (Hybrid implementation, owner = connected EOA).
 */
export async function createMetaMaskSmartAccount(owner: Hex): Promise<MetaMaskSmartAccount> {
  const publicClient = getPublicClient()
  const walletClientInstance = getWalletClient(owner)

  type ToMetaMaskSmartAccountParams = Parameters<typeof toMetaMaskSmartAccount>[0]

  return toMetaMaskSmartAccount({
    client: publicClient as unknown as ToMetaMaskSmartAccountParams["client"],
    implementation: Implementation.Hybrid,
    deployParams: [owner, [], [], []],
    deploySalt: "0x0000000000000000000000000000000000000000000000000000000000000000",
    signer: { walletClient: walletClientInstance as unknown as NonNullable<ToMetaMaskSmartAccountParams["signer"]> extends { walletClient: infer W } ? W : never },
  })
}

/**
 * Deploys the smart account if it has no on-chain bytecode.
 * Uses bundler client UserOp if NEXT_PUBLIC_BUNDLER_URL is set, otherwise deploys via EOA factory transaction.
 */
export async function deploySmartAccountIfNeeded(
  smartAccount: MetaMaskSmartAccount,
  owner: Hex,
): Promise<Hex | null> {
  const publicClient = getPublicClient()
  const bytecode = await publicClient.getBytecode({ address: smartAccount.address })
  if (bytecode && bytecode !== "0x") {
    return null
  }

  const bundler = getBundlerClient(smartAccount)
  if (bundler) {
    try {
      const userOpHash = await bundler.sendUserOperation({
        account: smartAccount,
        calls: [
          {
            to: smartAccount.address,
            value: BigInt(0),
            data: "0x",
          },
        ],
      })
      const receipt = await bundler.waitForUserOperationReceipt({ hash: userOpHash })
      return receipt.receipt.transactionHash
    } catch (err) {
      console.warn("Bundler UserOp deployment failed, falling back to EOA factory deployment:", err)
    }
  }

  const factoryArgs = await smartAccount.getFactoryArgs()
  if (!factoryArgs) return null

  const client = getWalletClient(owner)
  const txHash = await client.sendTransaction({
    account: owner,
    to: factoryArgs.factory,
    data: factoryArgs.factoryData,
    chain: baseSepolia,
  })

  await publicClient.waitForTransactionReceipt({ hash: txHash })
  return txHash
}

/**
 * Query smart account's USDC balance on Base Sepolia.
 */
export async function getUSDCBalance(address: Hex): Promise<{ raw: bigint; formatted: number }> {
  const publicClient = getPublicClient()
  try {
    const raw = (await publicClient.readContract({
      address: TOKEN_ADDRESSES.USDC,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [address],
    })) as bigint
    const formatted = Number(raw) / 1e6
    return { raw, formatted }
  } catch (err) {
    console.warn("Failed to read USDC balance:", err)
    return { raw: BigInt(0), formatted: 0 }
  }
}

/**
 * Transfers USDC from the user's connected EOA to their smart account.
 */
export async function transferUSDCToSmartAccount(
  owner: Hex,
  smartAccountAddress: Hex,
  amountUSDC: number,
): Promise<Hex> {
  const wallet = getWalletClient(owner)
  const publicClient = getPublicClient()
  const amountUnits = BigInt(Math.ceil(amountUSDC * 1e6))

  const hash = await wallet.writeContract({
    account: owner,
    address: TOKEN_ADDRESSES.USDC,
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [smartAccountAddress, amountUnits],
  })

  await publicClient.waitForTransactionReceipt({ hash })
  return hash
}

/**
 * Fallback EIP-712 signature for mandate boundaries.
 */
export async function signMandateAuthorization(mandate: Mandate, account: Hex): Promise<Hex> {
  return getWalletClient(account).signTypedData({
    account,
    domain: {
      name: "RegentMandate",
      version: "1",
      chainId: baseSepolia.id,
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

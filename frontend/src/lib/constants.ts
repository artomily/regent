export const BASE_SEPOLIA_CHAIN_ID = 84532

export const CHAIN = {
  id: BASE_SEPOLIA_CHAIN_ID,
  name: "Base Sepolia",
  rpcUrl: "https://sepolia.base.org",
  explorerUrl: "https://sepolia.basescan.org",
} as const

export const DEFAULT_SOURCE_ASSET = "USDC"
export const TARGET_ASSET_PRESETS = ["ETH", "WETH", "CBBTC", "AERO", "DEGEN"]

/** Deployed RegentMandate registry (see contract/). Empty = demo mode, no chain writes. */
export const MANDATE_CONTRACT = process.env.NEXT_PUBLIC_MANDATE_CONTRACT ?? ""

/** Agent signer address authorized to execute mandates. */
export const AGENT_ADDRESS = (process.env.NEXT_PUBLIC_AGENT_ADDRESS ?? "") as `0x${string}`

/** ERC-4337 bundler RPC endpoint for smart account execution. */
export const BUNDLER_URL = process.env.NEXT_PUBLIC_BUNDLER_URL ?? process.env.BUNDLER_URL ?? ""

/** Known token addresses on Base Sepolia. */
export const TOKEN_ADDRESSES: Record<string, `0x${string}`> = {
  USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  WETH: "0x4200000000000000000000000000000000000006",
  ETH: "0x0000000000000000000000000000000000000000",
}

/** DEX swap router addresses on Base Sepolia allowed by default in delegations. */
export const SWAP_ROUTERS: `0x${string}`[] = [
  "0x94cC0AaC535CCDB3C01d6787d6413C739ae12bc4", // Uniswap SwapRouter02
  "0x0b88d30e1fae32a688bca87da3dc3eec4b29bb3e", // Aerodrome Router
]

export const GOAL_PRESETS = [
  { label: "Acquire", goal: "Acquire tokens at the best available price" },
  { label: "Swap", goal: "Exchange tokens when conditions are favorable" },
  { label: "Pay", goal: "Send a payment within the budget" },
] as const

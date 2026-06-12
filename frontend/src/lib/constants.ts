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

export const GOAL_PRESETS = [
  { label: "Acquire", goal: "Acquire tokens at the best available price" },
  { label: "Swap", goal: "Exchange tokens when conditions are favorable" },
  { label: "Pay", goal: "Send a payment within the budget" },
] as const

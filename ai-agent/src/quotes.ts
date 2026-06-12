import type { Mandate, Route } from "./types.ts"

// DEXes live on Base — the chain Regent executes on.
const DEXES = [
  { name: "Aerodrome", feePct: 0.05, edge: 1.0 },
  { name: "Uniswap V3", feePct: 0.3, edge: 0.997 },
  { name: "SushiSwap", feePct: 0.3, edge: 0.989 },
  { name: "BaseSwap", feePct: 0.25, edge: 0.984 },
]

// Reference prices in source-asset units per 1 target-asset unit. Demo data;
// a production deployment would pull live quotes from each DEX router.
const REFERENCE_PRICES: Record<string, number> = {
  "USDC/ETH": 2450,
  "USDC/WETH": 2450,
  "USDC/CBBTC": 67000,
  "USDC/AERO": 0.85,
  "USDC/DEGEN": 0.012,
}

function referencePrice(source: string, target: string): number {
  return REFERENCE_PRICES[`${source.toUpperCase()}/${target.toUpperCase()}`] ?? 7.2
}

function jitter(spread: number): number {
  return 1 + (Math.random() * 2 - 1) * spread
}

/** Quote each DEX for spending ~the mandate budget on the target asset. */
export function fetchQuotes(mandate: Mandate): Route[] {
  const price = referencePrice(mandate.sourceAsset, mandate.targetAsset)

  return DEXES.map((dex) => {
    // Each venue fills a slightly different size near the budget ceiling.
    const inputAmount = round(mandate.budget * (0.86 + Math.random() * 0.12), 2)
    const effectivePrice = (price / dex.edge) * jitter(0.004)
    const slippage = round(0.3 + Math.random() * 2.0, 2)
    const outputAmount = round((inputAmount / effectivePrice) * (1 - slippage / 100), 6)

    return {
      dex: dex.name,
      inputAmount,
      outputAmount,
      slippage,
      fee: dex.feePct,
      executionPrice: round(inputAmount / outputAmount, 4),
    }
  }).sort((a, b) => b.outputAmount - a.outputAmount)
}

function round(n: number, dp: number): number {
  const f = 10 ** dp
  return Math.round(n * f) / f
}

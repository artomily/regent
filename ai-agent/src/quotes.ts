import { logger } from "./logger.ts"
import type { Mandate, Route } from "./types.ts"

// DEXes live on Base — the chain Regent executes on.
const DEXES = [
  { name: "Aerodrome", feePct: 0.05, edge: 1.0 },
  { name: "Uniswap V3", feePct: 0.3, edge: 0.997 },
  { name: "SushiSwap", feePct: 0.3, edge: 0.989 },
  { name: "BaseSwap", feePct: 0.25, edge: 0.984 },
]

// Reference prices in source-asset units per 1 target-asset unit. Fallback
// for pairs fetchOnChainPrice doesn't cover, or if the RPC call fails.
const REFERENCE_PRICES: Record<string, number> = {
  "USDC/ETH": 2450,
  "USDC/WETH": 2450,
  "USDC/CBBTC": 67000,
  "USDC/AERO": 0.85,
  "USDC/DEGEN": 0.012,
}

// Base mainnet — Uniswap V3 QuoterV2, used as a live price anchor.
// https://developers.uniswap.org/contracts/v3/reference/deployments/base-deployments
const BASE_MAINNET_RPC_URL = "https://mainnet.base.org"
const QUOTER_V2_ADDRESS = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a"
const QUOTE_EXACT_INPUT_SINGLE_SELECTOR = "c6a5026a"

// Base mainnet token addresses, for pairs we can price on-chain.
const TOKENS: Record<string, { address: string; decimals: number }> = {
  USDC: { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
  ETH: { address: "0x4200000000000000000000000000000000000006", decimals: 18 },
  WETH: { address: "0x4200000000000000000000000000000000000006", decimals: 18 },
}

function encodeUint(value: bigint): string {
  return value.toString(16).padStart(64, "0")
}

function encodeAddress(address: string): string {
  return address.toLowerCase().replace(/^0x/, "").padStart(64, "0")
}

/**
 * Live spot price from Uniswap V3 QuoterV2 on Base mainnet (source-asset
 * units per 1 target-asset unit, matching REFERENCE_PRICES). Read-only
 * eth_call, no key or gas required. Returns null for unwired pairs or if
 * the RPC call fails, so callers can fall back to REFERENCE_PRICES.
 */
async function fetchOnChainPrice(sourceAsset: string, targetAsset: string): Promise<number | null> {
  const tokenIn = TOKENS[sourceAsset.toUpperCase()]
  const tokenOut = TOKENS[targetAsset.toUpperCase()]
  if (!tokenIn || !tokenOut) return null

  const probeAmount = 10n ** BigInt(tokenIn.decimals) // 1 unit of the source token
  const calldata =
    "0x" +
    QUOTE_EXACT_INPUT_SINGLE_SELECTOR +
    encodeAddress(tokenIn.address) +
    encodeAddress(tokenOut.address) +
    encodeUint(probeAmount) +
    encodeUint(3000n) + // 0.3% fee tier — the deepest USDC/WETH pool on Base
    encodeUint(0n) // sqrtPriceLimitX96: no limit

  try {
    const response = await fetch(BASE_MAINNET_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5_000),
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to: QUOTER_V2_ADDRESS, data: calldata }, "latest"],
      }),
    })
    const data = (await response.json()) as { result?: string; error?: { message?: string } }
    if (data.error || !data.result || data.result === "0x") {
      logger.warn("quotes.onchain.empty", { sourceAsset, targetAsset, error: data.error?.message })
      return null
    }

    const amountOut = BigInt("0x" + data.result.slice(2, 66))
    const outputPerInput = Number(amountOut) / 10 ** tokenOut.decimals
    if (!(outputPerInput > 0)) return null

    logger.info("quotes.onchain.fetched", { sourceAsset, targetAsset })
    return 1 / outputPerInput
  } catch (error) {
    logger.warn("quotes.onchain.failed", {
      sourceAsset,
      targetAsset,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

function referencePrice(source: string, target: string): number {
  return REFERENCE_PRICES[`${source.toUpperCase()}/${target.toUpperCase()}`] ?? 7.2
}

function jitter(spread: number): number {
  return 1 + (Math.random() * 2 - 1) * spread
}

/** Quote each DEX for spending ~the mandate budget on the target asset. */
export async function fetchQuotes(mandate: Mandate): Promise<Route[]> {
  const onChainPrice = await fetchOnChainPrice(mandate.sourceAsset, mandate.targetAsset)
  const price = onChainPrice ?? referencePrice(mandate.sourceAsset, mandate.targetAsset)

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

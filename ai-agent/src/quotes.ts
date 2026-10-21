import { createPublicClient, formatUnits, http, parseAbi, parseUnits } from "viem"
import { baseSepolia } from "viem/chains"
import { RPC_URL } from "./config.ts"
import { logger } from "./logger.ts"
import type { Mandate, Route } from "./types.ts"

// Official Uniswap V3 deployments on Base Sepolia (chainId 84532)
export const UNISWAP_V3_QUOTER_V2_BASE_SEPOLIA = "0xC5290058841028F1614F3A6F0F5816cAd0df5E27" as const
export const BASE_SEPOLIA_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const
export const BASE_SEPOLIA_WETH = "0x4200000000000000000000000000000000000006" as const

const QUOTER_V2_ABI = parseAbi([
  "struct QuoteExactInputSingleParams { address tokenIn; address tokenOut; uint256 amountIn; uint24 fee; uint160 sqrtPriceLimitX96; }",
  "function quoteExactInputSingle(QuoteExactInputSingleParams params) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
])

const REFERENCE_PRICES: Record<string, number> = {
  "USDC/ETH": 4150,
  "USDC/WETH": 4150,
  "USDC/CBBTC": 67000,
  "USDC/AERO": 0.85,
  "USDC/DEGEN": 0.012,
}

// Fallback venues configuration with fixed relative edges (no random jitter on live quotes)
const FALLBACK_DEXES = [
  { name: "Aerodrome", feePct: 0.05, edge: 1.002, slippage: 0.4 },
  { name: "SushiSwap", feePct: 0.3, edge: 0.995, slippage: 0.6 },
  { name: "BaseSwap", feePct: 0.25, edge: 0.99, slippage: 0.7 },
]

export function isUsdcWethPair(source: string, target: string): boolean {
  const s = source.toUpperCase()
  const t = target.toUpperCase()
  return s === "USDC" && (t === "WETH" || t === "ETH")
}

/**
 * Fetch a real live quote from Uniswap V3 QuoterV2 on Base Sepolia.
 * Returns null if RPC call fails or unsupported pair.
 */
export async function fetchLiveUniswapV3Quote(
  sourceAsset: string,
  targetAsset: string,
  inputAmount: number,
  rpcUrl = RPC_URL,
): Promise<Route | null> {
  if (!isUsdcWethPair(sourceAsset, targetAsset)) return null
  if (inputAmount <= 0) return null

  try {
    const client = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl, { timeout: 6_000 }),
    })

    const amountIn = parseUnits(String(inputAmount), 6) // USDC has 6 decimals
    const { result } = await client.simulateContract({
      address: UNISWAP_V3_QUOTER_V2_BASE_SEPOLIA,
      abi: QUOTER_V2_ABI,
      functionName: "quoteExactInputSingle",
      args: [
        {
          tokenIn: BASE_SEPOLIA_USDC,
          tokenOut: BASE_SEPOLIA_WETH,
          amountIn,
          fee: 3000, // 0.3% pool tier
          sqrtPriceLimitX96: 0n,
        },
      ],
    })

    const amountOutRaw = result[0]
    const outputAmount = round(Number(formatUnits(amountOutRaw, 18)), 6)
    if (outputAmount <= 0) return null

    const executionPrice = round(inputAmount / outputAmount, 4)

    logger.info("quotes.uniswap_v3.live_quote_fetched", {
      inputAmount,
      outputAmount,
      executionPrice,
    })

    return {
      dex: "Uniswap V3",
      inputAmount,
      outputAmount,
      slippage: 0.3,
      fee: 0.3,
      executionPrice,
      simulated: false,
    }
  } catch (error) {
    logger.warn("quotes.uniswap_v3.live_quote_failed", {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

function referencePrice(source: string, target: string): number {
  return REFERENCE_PRICES[`${source.toUpperCase()}/${target.toUpperCase()}`] ?? 4150
}

/**
 * Quote available DEXes for the mandate.
 * Uses real live Uniswap V3 QuoterV2 on Base Sepolia for USDC->WETH,
 * and marks any fallback/simulated venue with simulated = true.
 * No random jitter on live quotes.
 */
export async function fetchQuotes(mandate: Mandate, rpcUrl = RPC_URL): Promise<Route[]> {
  const remainingBudget = Math.max(0, mandate.budget - (mandate.spent ?? 0))
  const targetSpend = remainingBudget > 0 ? remainingBudget : mandate.budget
  // Spend ~90% of target budget for the swap
  const inputAmount = round(targetSpend * 0.9, 2)

  const liveUniswap = await fetchLiveUniswapV3Quote(mandate.sourceAsset, mandate.targetAsset, inputAmount, rpcUrl)

  const basePrice = liveUniswap ? liveUniswap.executionPrice : referencePrice(mandate.sourceAsset, mandate.targetAsset)

  const routes: Route[] = []

  if (liveUniswap) {
    routes.push(liveUniswap)
  } else {
    // Fallback simulated Uniswap V3 quote
    const uniOutput = round((inputAmount / basePrice) * (1 - 0.003), 6)
    routes.push({
      dex: "Uniswap V3",
      inputAmount,
      outputAmount: uniOutput,
      slippage: 0.5,
      fee: 0.3,
      executionPrice: round(inputAmount / uniOutput, 4),
      simulated: true,
    })
  }

  // Simulated fallback DEX venues (Aerodrome, SushiSwap, BaseSwap)
  for (const dex of FALLBACK_DEXES) {
    const effectivePrice = basePrice / dex.edge
    const outputAmount = round((inputAmount / effectivePrice) * (1 - dex.slippage / 100), 6)
    routes.push({
      dex: dex.name,
      inputAmount,
      outputAmount,
      slippage: dex.slippage,
      fee: dex.feePct,
      executionPrice: round(inputAmount / outputAmount, 4),
      simulated: true,
    })
  }

  return routes.sort((a, b) => b.outputAmount - a.outputAmount)
}

function round(n: number, dp: number): number {
  const f = 10 ** dp
  return Math.round(n * f) / f
}

// In-process fallback used by the /api/agent/* routes when the ai-agent
// service is unreachable. Mirrors ai-agent/src/{quotes,venice,executor}.ts
// (heuristic policy only) so the product flow never hard-fails in a demo.

import type { AgentDecision, ExecutionResult, Mandate, Route } from "./types"

const DEXES = [
  { name: "Aerodrome", feePct: 0.05, edge: 1.0 },
  { name: "Uniswap V3", feePct: 0.3, edge: 0.997 },
  { name: "SushiSwap", feePct: 0.3, edge: 0.989 },
  { name: "BaseSwap", feePct: 0.25, edge: 0.984 },
]

const REFERENCE_PRICES: Record<string, number> = {
  "USDC/ETH": 2450,
  "USDC/WETH": 2450,
  "USDC/CBBTC": 67000,
  "USDC/AERO": 0.85,
  "USDC/DEGEN": 0.012,
}

function round(n: number, dp: number): number {
  const f = 10 ** dp
  return Math.round(n * f) / f
}

export function simulateQuotes(mandate: Pick<Mandate, "budget" | "sourceAsset" | "targetAsset">): Route[] {
  const price =
    REFERENCE_PRICES[`${mandate.sourceAsset.toUpperCase()}/${mandate.targetAsset.toUpperCase()}`] ?? 7.2

  return DEXES.map((dex) => {
    const inputAmount = round(mandate.budget * (0.86 + Math.random() * 0.12), 2)
    const effectivePrice = (price / dex.edge) * (1 + (Math.random() * 2 - 1) * 0.004)
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

export function simulateDecision(mandate: Mandate, routes: Route[]): AgentDecision {
  const eligible = routes.filter((r) => r.inputAmount <= mandate.budget && r.slippage <= mandate.maxSlippage)
  const selected = [...eligible].sort((a, b) => b.outputAmount - a.outputAmount)[0] ?? null

  return {
    selectedRoute: selected,
    reasoning: selected
      ? `Selected ${selected.dex}: best output (${selected.outputAmount} ${mandate.targetAsset}) for ${selected.inputAmount} ${mandate.sourceAsset} at ${selected.slippage}% slippage. Within the ${mandate.budget} ${mandate.sourceAsset} budget and under the ${mandate.maxSlippage}% slippage ceiling. ${routes.length - eligible.length} of ${routes.length} routes rejected for breaching the mandate.`
      : `No route satisfies the mandate: budget ${mandate.budget} ${mandate.sourceAsset}, max slippage ${mandate.maxSlippage}%. Declining to execute.`,
    withinBudget: selected !== null,
    withinSlippage: selected !== null,
    allRoutes: routes,
    source: "simulated",
  }
}

export function simulateExecution(mandate: Mandate, route: Route): ExecutionResult {
  if (route.inputAmount > mandate.budget) {
    return refusal("Refused: spend would exceed the mandate budget")
  }
  if (route.slippage > mandate.maxSlippage) {
    return refusal("Refused: slippage exceeds the mandate ceiling")
  }
  if (mandate.expiry && new Date(mandate.expiry).getTime() <= Date.now()) {
    return refusal("Refused: mandate has expired")
  }

  return {
    success: true,
    transactionHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}` as `0x${string}`,
    taskId: crypto.randomUUID(),
    spentAmount: route.inputAmount,
    receivedAmount: route.outputAmount,
    feeAmount: route.fee,
    source: "simulated",
  }
}

function refusal(error: string): ExecutionResult {
  return { success: false, spentAmount: 0, receivedAmount: 0, feeAmount: 0, error, source: "simulated" }
}

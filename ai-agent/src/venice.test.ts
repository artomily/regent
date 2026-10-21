import assert from "node:assert/strict"
import { test } from "node:test"
import { evaluateRoutes, heuristicDecision, parseAndValidateVerdict, VeniceKeyRequiredError } from "./venice.ts"
import type { Mandate, Route } from "./types.ts"

const mandate: Mandate = {
  id: "m1",
  goal: "Acquire ETH",
  sourceAsset: "USDC",
  targetAsset: "ETH",
  budget: 100,
  maxSlippage: 2,
  expiry: new Date(Date.now() + 3_600_000).toISOString(),
}

function route(overrides: Partial<Route>): Route {
  return {
    dex: "aerodrome",
    inputAmount: 50,
    outputAmount: 1,
    slippage: 1,
    fee: 0.1,
    executionPrice: 50,
    ...overrides,
  }
}

test("heuristicDecision picks the best-output route among those within budget and slippage", () => {
  const routes = [
    route({ dex: "a", outputAmount: 1 }),
    route({ dex: "b", outputAmount: 1.2 }),
    route({ dex: "c", inputAmount: 200, outputAmount: 5 }), // exceeds the 100 budget
  ]

  const decision = heuristicDecision(mandate, routes)

  assert.equal(decision.selectedRoute?.dex, "b")
  assert.equal(decision.withinBudget, true)
  assert.equal(decision.withinSlippage, true)
  assert.equal(decision.source, "heuristic")
})

test("heuristicDecision is spent-aware and calculates remaining budget", () => {
  const partialMandate: Mandate = { ...mandate, budget: 100, spent: 65 } // remaining is 35
  const routes = [
    route({ dex: "a", inputAmount: 50, outputAmount: 1 }), // breaches 35 remaining
    route({ dex: "b", inputAmount: 30, outputAmount: 0.6 }), // fits 35 remaining
  ]

  const decision = heuristicDecision(partialMandate, routes)

  assert.equal(decision.selectedRoute?.dex, "b")
  assert.equal(decision.withinBudget, true)
  assert.match(decision.reasoning, /remaining 35 USDC budget/)
})

test("heuristicDecision declines execution if mandate has expired", () => {
  const expiredMandate: Mandate = {
    ...mandate,
    expiry: new Date(Date.now() - 5000).toISOString(),
  }
  const decision = heuristicDecision(expiredMandate, [route({ inputAmount: 10 })])

  assert.equal(decision.selectedRoute, null)
  assert.equal(decision.withinBudget, false)
  assert.match(decision.reasoning, /expired/i)
})

test("heuristicDecision excludes routes that breach the slippage ceiling even with better output", () => {
  const routes = [route({ dex: "a", outputAmount: 1, slippage: 1 }), route({ dex: "b", outputAmount: 10, slippage: 5 })]

  const decision = heuristicDecision(mandate, routes)

  assert.equal(decision.selectedRoute?.dex, "a")
})

test("heuristicDecision declines when no route satisfies the mandate", () => {
  const routes = [route({ dex: "a", inputAmount: 500 })]

  const decision = heuristicDecision(mandate, routes)

  assert.equal(decision.selectedRoute, null)
  assert.equal(decision.withinBudget, false)
  assert.equal(decision.withinSlippage, false)
  assert.match(decision.reasoning, /Declining to execute/)
})

test("parseAndValidateVerdict validates correct schema and rejects invalid shapes", () => {
  assert.equal(parseAndValidateVerdict(null), null)
  assert.equal(parseAndValidateVerdict({}), null)
  assert.equal(parseAndValidateVerdict({ selectedDex: 123, reasoning: "ok", withinBudget: true, withinSlippage: true }), null)
  assert.deepEqual(
    parseAndValidateVerdict({ selectedDex: "uniswap", reasoning: "best price", withinBudget: true, withinSlippage: true }),
    { selectedDex: "uniswap", reasoning: "best price", withinBudget: true, withinSlippage: true },
  )
  assert.deepEqual(
    parseAndValidateVerdict({ selectedDex: null, reasoning: "no route fits", withinBudget: false, withinSlippage: false }),
    { selectedDex: null, reasoning: "no route fits", withinBudget: false, withinSlippage: false },
  )
})

test("evaluateRoutes requires a Venice key — no silent heuristic fallback for a missing key", async () => {
  // No VENICE_API_KEY in this process's env and no apiKey argument supplied.
  await assert.rejects(() => evaluateRoutes(mandate, [route({})]), VeniceKeyRequiredError)
})

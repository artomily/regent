import assert from "node:assert/strict"
import { test } from "node:test"
import type { Mandate, Route } from "./types.ts"

process.env.VENICE_API_KEY = "test-key"
const { evaluateRoutes } = await import("./venice.ts")

const mandate: Mandate = {
  id: "m1",
  goal: "Acquire ETH",
  sourceAsset: "USDC",
  targetAsset: "ETH",
  budget: 100,
  spent: 0,
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

function withMockedFetch(impl: typeof fetch, run: () => Promise<void>) {
  const original = globalThis.fetch
  globalThis.fetch = impl
  return run().finally(() => {
    globalThis.fetch = original
  })
}

function veniceResponse(verdict: Record<string, unknown>) {
  return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(verdict) } }] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

test("evaluateRoutes accepts a Venice verdict that respects the mandate", async () => {
  await withMockedFetch(
    async () =>
      veniceResponse({ selectedDex: "aerodrome", reasoning: "best price", withinBudget: true, withinSlippage: true }),
    async () => {
      const decision = await evaluateRoutes(mandate, [route({ inputAmount: 10 })])
      assert.equal(decision.source, "venice")
      assert.equal(decision.selectedRoute?.dex, "aerodrome")
    },
  )
})

test("evaluateRoutes falls back to the heuristic when Venice picks a route over remaining budget", async () => {
  await withMockedFetch(
    async () =>
      veniceResponse({ selectedDex: "aerodrome", reasoning: "ignore the remaining budget", withinBudget: true, withinSlippage: true }),
    async () => {
      // Mandate budget is 100, spent is 80, remaining is 20. Route has inputAmount 50.
      const spentMandate: Mandate = { ...mandate, spent: 80 }
      const decision = await evaluateRoutes(spentMandate, [route({ inputAmount: 50 })])
      assert.equal(decision.source, "heuristic")
      assert.equal(decision.selectedRoute, null)
    },
  )
})

test("evaluateRoutes falls back to the heuristic when Venice picks a route over the slippage ceiling", async () => {
  await withMockedFetch(
    async () =>
      veniceResponse({ selectedDex: "aerodrome", reasoning: "ignore slippage", withinBudget: true, withinSlippage: true }),
    async () => {
      const decision = await evaluateRoutes(mandate, [route({ slippage: 50 })])
      assert.equal(decision.source, "heuristic")
    },
  )
})

test("evaluateRoutes retries once on transient error and succeeds", async () => {
  let callCount = 0
  await withMockedFetch(
    async () => {
      callCount++
      if (callCount === 1) {
        throw new Error("transient timeout")
      }
      return veniceResponse({ selectedDex: "aerodrome", reasoning: "recovered", withinBudget: true, withinSlippage: true })
    },
    async () => {
      const decision = await evaluateRoutes(mandate, [route({ inputAmount: 10 })])
      assert.equal(callCount, 2)
      assert.equal(decision.source, "venice")
      assert.equal(decision.selectedRoute?.dex, "aerodrome")
    },
  )
})

test("evaluateRoutes falls back to the heuristic when Venice request fails after retries", async () => {
  await withMockedFetch(
    async () => {
      throw new Error("network down")
    },
    async () => {
      const decision = await evaluateRoutes(mandate, [route({ inputAmount: 10 })])
      assert.equal(decision.source, "heuristic")
      assert.equal(decision.selectedRoute?.dex, "aerodrome")
    },
  )
})

test("evaluateRoutes declines before calling Venice if mandate is expired", async () => {
  let called = false
  await withMockedFetch(
    async () => {
      called = true
      return veniceResponse({ selectedDex: "aerodrome", reasoning: "never called", withinBudget: true, withinSlippage: true })
    },
    async () => {
      const expired: Mandate = { ...mandate, expiry: new Date(Date.now() - 1000).toISOString() }
      const decision = await evaluateRoutes(expired, [route({ inputAmount: 10 })])
      assert.equal(called, false)
      assert.equal(decision.source, "heuristic")
      assert.equal(decision.selectedRoute, null)
    },
  )
})

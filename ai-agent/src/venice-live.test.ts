import assert from "node:assert/strict"
import { test } from "node:test"
import type { Mandate, Route } from "./types.ts"

// config.ts reads VENICE_API_KEY into a module-level const on first import, so
// it must be set before venice.ts (which imports config.ts) is ever loaded —
// hence the dynamic import below instead of a static one.
process.env.VENICE_API_KEY = "test-key"
const { evaluateRoutes } = await import("./venice.ts")

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

test("evaluateRoutes falls back to the heuristic when Venice picks a route over budget", async () => {
  await withMockedFetch(
    async () =>
      veniceResponse({ selectedDex: "aerodrome", reasoning: "ignore the budget", withinBudget: true, withinSlippage: true }),
    async () => {
      // The route itself breaches the mandate's 100-unit budget — the model's
      // "withinBudget: true" claim must not be trusted.
      const decision = await evaluateRoutes(mandate, [route({ inputAmount: 9999 })])
      assert.equal(decision.source, "heuristic")
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

test("evaluateRoutes falls back to the heuristic when the Venice request fails", async () => {
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

test("evaluateRoutes falls back to the heuristic when Venice returns a non-OK status", async () => {
  await withMockedFetch(
    async () => new Response("server error", { status: 500 }),
    async () => {
      const decision = await evaluateRoutes(mandate, [route({ inputAmount: 10 })])
      assert.equal(decision.source, "heuristic")
    },
  )
})

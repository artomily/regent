import assert from "node:assert/strict"
import { test } from "node:test"
import { executeRoute } from "./executor.ts"
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

test("executeRoute refuses a spend that exceeds the mandate budget", async () => {
  const result = await executeRoute(mandate, route({ inputAmount: 9999 }))
  assert.equal(result.success, false)
  assert.match(result.error ?? "", /budget/)
})

test("executeRoute refuses a route over the slippage ceiling", async () => {
  const result = await executeRoute(mandate, route({ slippage: 50 }))
  assert.equal(result.success, false)
  assert.match(result.error ?? "", /slippage/)
})

test("executeRoute refuses execution against an expired mandate", async () => {
  const expired: Mandate = { ...mandate, expiry: new Date(Date.now() - 1000).toISOString() }
  const result = await executeRoute(expired, route({}))
  assert.equal(result.success, false)
  assert.match(result.error ?? "", /expired/)
})

test("executeRoute simulates a successful execution for a route within the mandate", async () => {
  const chosen = route({ inputAmount: 10, outputAmount: 0.5, slippage: 1 })
  const result = await executeRoute(mandate, chosen)
  assert.equal(result.success, true)
  assert.equal(result.source, "simulated")
  assert.equal(result.spentAmount, chosen.inputAmount)
  assert.equal(result.receivedAmount, chosen.outputAmount)
  assert.match(result.transactionHash ?? "", /^0x[0-9a-f]{64}$/)
})

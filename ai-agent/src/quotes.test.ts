import assert from "node:assert/strict"
import { test } from "node:test"
import { fetchQuotes, isUsdcWethPair } from "./quotes.ts"
import type { Mandate } from "./types.ts"

const mandate: Mandate = {
  id: "test-quotes-1",
  goal: "Swap USDC for WETH",
  sourceAsset: "USDC",
  targetAsset: "WETH",
  budget: 50,
  spent: 10,
  maxSlippage: 2,
  expiry: new Date(Date.now() + 3_600_000).toISOString(),
}

test("isUsdcWethPair detects USDC to WETH or ETH pairs", () => {
  assert.equal(isUsdcWethPair("USDC", "WETH"), true)
  assert.equal(isUsdcWethPair("usdc", "eth"), true)
  assert.equal(isUsdcWethPair("USDC", "AERO"), false)
})

test("fetchQuotes returns sorted routes and marks fallback quotes simulated = true", async () => {
  // Use invalid rpcUrl to test fallback path
  const routes = await fetchQuotes(mandate, "http://127.0.0.1:9999")

  assert.equal(routes.length, 4)
  assert.equal(routes.every((r) => r.simulated === true), true)

  // Verify sorted by outputAmount descending
  for (let i = 0; i < routes.length - 1; i++) {
    assert.ok(routes[i].outputAmount >= routes[i + 1].outputAmount)
  }
})

test("fetchQuotes spends based on remaining budget (budget - spent)", async () => {
  const partialMandate: Mandate = { ...mandate, budget: 100, spent: 60 } // remaining 40, 90% is 36
  const routes = await fetchQuotes(partialMandate, "http://127.0.0.1:9999")

  assert.equal(routes[0].inputAmount, 36)
})

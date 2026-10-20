import assert from "node:assert/strict"
import { test } from "node:test"
import { saveDecision, saveExecution } from "./db.ts"
import type { AgentDecision, ExecutionResult, Mandate, Route } from "./types.ts"

const mandate: Mandate = {
  id: "mandate-db-1",
  goal: "Test Neon DB persistence",
  sourceAsset: "USDC",
  targetAsset: "ETH",
  budget: 50,
  spent: 0,
  maxSlippage: 2,
  expiry: new Date(Date.now() + 3_600_000).toISOString(),
}

const testRoute: Route = {
  dex: "Uniswap V3",
  inputAmount: 20,
  outputAmount: 0.005,
  slippage: 0.3,
  fee: 0.3,
  executionPrice: 4000,
  simulated: false,
}

const decision: AgentDecision = {
  selectedRoute: testRoute,
  reasoning: "Best rate on Uniswap V3",
  withinBudget: true,
  withinSlippage: true,
  allRoutes: [testRoute],
  source: "venice",
}

const executionResult: ExecutionResult = {
  success: true,
  transactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  spentAmount: 20,
  receivedAmount: 0.005,
  feeAmount: 0.3,
  source: "direct",
}

test("saveDecision returns null when client is null (DATABASE_URL unset)", async () => {
  const res = await saveDecision(mandate, decision, null)
  assert.equal(res, null)
})

test("saveExecution returns null when client is null (DATABASE_URL unset)", async () => {
  const res = await saveExecution(mandate, testRoute, executionResult, null)
  assert.equal(res, null)
})

test("saveDecision executes query against client", async () => {
  const calls: { sql: string; params: unknown[] }[] = []
  const mockClient = {
    query: async (sql: string, params?: unknown[]) => {
      calls.push({ sql, params: params ?? [] })
      return []
    },
  } as unknown as ReturnType<typeof import("./db.ts").getDbClient>

  const id = await saveDecision(mandate, decision, mockClient)
  assert.ok(id)
  assert.equal(calls.length, 1)
  assert.match(calls[0].sql, /INSERT INTO decisions/)
  assert.equal(calls[0].params[1], mandate.id)
  assert.equal(calls[0].params[2], "venice")
  assert.equal(calls[0].params[3], "Uniswap V3")
})

test("saveExecution executes query against client", async () => {
  const calls: { sql: string; params: unknown[] }[] = []
  const mockClient = {
    query: async (sql: string, params?: unknown[]) => {
      calls.push({ sql, params: params ?? [] })
      return []
    },
  } as unknown as ReturnType<typeof import("./db.ts").getDbClient>

  const id = await saveExecution(mandate, testRoute, executionResult, mockClient)
  assert.ok(id)
  assert.equal(calls.length, 1)
  assert.match(calls[0].sql, /INSERT INTO executions/)
  assert.equal(calls[0].params[1], mandate.id)
  assert.equal(calls[0].params[2], executionResult.transactionHash)
  assert.equal(calls[0].params[3], "success")
  assert.equal(calls[0].params[4], 20)
  assert.equal(calls[0].params[6], 30) // 0.3% * 100 = 30 bps
})

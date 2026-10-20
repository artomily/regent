import assert from "node:assert/strict"
import { test } from "node:test"
import type { Delegation } from "@metamask/smart-accounts-kit"
import type { Hex } from "viem"
import {
  buildExecutionCalldata,
  executeRoute,
  mapRevertError,
  parseDelegation,
  UNISWAP_SWAP_ROUTER_02_BASE_SEPOLIA,
} from "./executor.ts"
import { BASE_SEPOLIA_USDC, BASE_SEPOLIA_WETH } from "./quotes.ts"
import type { Mandate, Route } from "./types.ts"

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

const dummyDelegation: Delegation = {
  delegate: "0x1111111111111111111111111111111111111111",
  delegator: "0x2222222222222222222222222222222222222222",
  authority: "0x0000000000000000000000000000000000000000000000000000000000000000",
  caveats: [],
  salt: "0x0",
  signature: "0x1234",
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

test("executeRoute is spent-aware and refuses a spend exceeding remaining budget", async () => {
  const partialMandate: Mandate = { ...mandate, budget: 100, spent: 75 } // remaining is 25
  const result = await executeRoute(partialMandate, route({ inputAmount: 30 }))
  assert.equal(result.success, false)
  assert.match(result.error ?? "", /remaining mandate budget/)
})

test("executeRoute accepts a spend within remaining budget", async () => {
  const partialMandate: Mandate = { ...mandate, budget: 100, spent: 75 } // remaining is 25
  const result = await executeRoute(partialMandate, route({ inputAmount: 20 }), { mode: "simulated" })
  assert.equal(result.success, true)
  assert.equal(result.spentAmount, 20)
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
  const result = await executeRoute(mandate, chosen, { mode: "simulated" })
  assert.equal(result.success, true)
  assert.equal(result.source, "simulated")
  assert.equal(result.spentAmount, chosen.inputAmount)
  assert.equal(result.receivedAmount, chosen.outputAmount)
  assert.match(result.transactionHash ?? "", /^0x[0-9a-f]{64}$/)
  assert.equal(result.txHash, result.transactionHash)
})

test("parseDelegation parses valid delegation object or JSON string", () => {
  assert.equal(parseDelegation(null), null)
  assert.equal(parseDelegation("not-json"), null)
  assert.equal(parseDelegation({}), null)

  const parsed = parseDelegation(dummyDelegation)
  assert.ok(parsed)
  assert.equal(parsed.delegate, dummyDelegation.delegate)
  assert.equal(parsed.delegator, dummyDelegation.delegator)

  const serialized = JSON.stringify({
    ...dummyDelegation,
    salt: "100",
  })
  const parsedFromJson = parseDelegation(serialized)
  assert.ok(parsedFromJson)
  assert.equal(parsedFromJson.salt, "0x64")
})

test("buildExecutionCalldata constructs approve, swap, and recordExecution calldatas", () => {
  const mandateWithContract: Mandate = {
    ...mandate,
    onChainId: "0x1111111111111111111111111111111111111111111111111111111111111111",
  }
  const testRoute = route({ inputAmount: 20, outputAmount: 0.005, slippage: 0.5 })

  const bundle = buildExecutionCalldata(mandateWithContract, testRoute, dummyDelegation, {
    mandateContract: "0x3333333333333333333333333333333333333333",
  })

  // Approve selector: 0x095ea7b3
  assert.equal(bundle.approveCalldata.startsWith("0x095ea7b3"), true)
  // exactInputSingle selector: 0x04e45aaf
  assert.equal(bundle.swapCalldata.startsWith("0x04e45aaf"), true)
  // recordExecution selector: 0x6e36bfa7 or similar for recordExecution
  assert.equal(bundle.recordCalldata.startsWith("0x"), true)

  // 3 executions: approve, swap, record
  assert.equal(bundle.executions.length, 3)
  assert.equal(bundle.executions[0].target, BASE_SEPOLIA_USDC)
  assert.equal(bundle.executions[1].target, UNISWAP_SWAP_ROUTER_02_BASE_SEPOLIA)
  assert.equal(bundle.executions[2].target, "0x3333333333333333333333333333333333333333")

  // redeemDelegations selector: 0xcef6d209
  assert.equal(bundle.redeemCalldata.startsWith("0xcef6d209"), true)
})

test("mapRevertError maps contract reverts and caveat errors to friendly messages", () => {
  assert.match(
    mapRevertError(new Error("execution reverted: BudgetExceeded(100, 200)")),
    /requested spend exceeds remaining budget/,
  )
  assert.match(
    mapRevertError(new Error("execution reverted: SlippageExceeded(100, 250)")),
    /slippage exceeds mandate ceiling/,
  )
  assert.match(
    mapRevertError(new Error("execution reverted: Expired()")),
    /mandate has expired/,
  )
  assert.match(
    mapRevertError(new Error("execution reverted: AlreadyRevoked()")),
    /mandate was revoked/,
  )
  assert.match(
    mapRevertError(new Error("CaveatEnforcer failed")),
    /Execution reverted by caveat check/,
  )
})

test("executeRoute handles direct mode with injected clients without network", async () => {
  const mandateWithDelegation: Mandate = {
    ...mandate,
    delegation: dummyDelegation,
  }

  let sentTransaction = false
  let waitedForReceipt = false

  const mockWalletClient = {
    sendTransaction: async () => {
      sentTransaction = true
      return "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" as Hex
    },
  }

  const mockPublicClient = {
    waitForTransactionReceipt: async () => {
      waitedForReceipt = true
      return {
        status: "success",
        transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" as Hex,
      }
    },
  }

  const result = await executeRoute(mandateWithDelegation, route({ inputAmount: 10 }), {
    mode: "direct",
    walletClient: mockWalletClient,
    publicClient: mockPublicClient,
  })

  assert.equal(result.success, true)
  assert.equal(result.source, "direct")
  assert.equal(sentTransaction, true)
  assert.equal(waitedForReceipt, true)
  assert.equal(result.transactionHash, "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890")
})

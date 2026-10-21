import assert from "node:assert/strict"
import { test } from "node:test"
import type { Delegation } from "@metamask/smart-accounts-kit"
import { decodeFunctionData, type Address, type Hex } from "viem"
import {
  buildExecutionCalldata,
  executeRoute,
  mapRevertError,
  parseDelegation,
  REGENT_MANDATE_ABI,
  resolveFeeTier,
  SWAP_ROUTER_ABI,
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
  assert.equal(result.recordTxHash, undefined)
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

test("resolveFeeTier extracts route.feeTier or scales route.fee, falling back to 3000", () => {
  assert.equal(resolveFeeTier(route({ feeTier: 500 })), 500)
  assert.equal(resolveFeeTier(route({ feeTier: 10000 })), 10000)
  assert.equal(resolveFeeTier(route({ fee: 0.05 })), 500)
  assert.equal(resolveFeeTier(route({ fee: 0.3 })), 3000)
  assert.equal(resolveFeeTier(route({ fee: 1.0 })), 10000)
  assert.equal(resolveFeeTier(route({ fee: 0.123 })), 3000) // unsupported tier falls back to 3000
})

test("buildExecutionCalldata constructs exactly 2 executions in redeem batch and extracts feeTier", () => {
  const mandateWithContract: Mandate = {
    ...mandate,
    onChainId: "0x1111111111111111111111111111111111111111111111111111111111111111",
  }
  const testRoute = route({ inputAmount: 20, outputAmount: 0.005, slippage: 0.5, feeTier: 500 })

  const bundle = buildExecutionCalldata(mandateWithContract, testRoute, dummyDelegation, {
    mandateContract: "0x3333333333333333333333333333333333333333",
  })

  // Approve selector: 0x095ea7b3
  assert.equal(bundle.approveCalldata.startsWith("0x095ea7b3"), true)
  // exactInputSingle selector: 0x04e45aaf
  assert.equal(bundle.swapCalldata.startsWith("0x04e45aaf"), true)

  // Verify decoded feeTier from exactInputSingle
  const decoded = decodeFunctionData({
    abi: SWAP_ROUTER_ABI,
    data: bundle.swapCalldata,
  })
  assert.equal(decoded.args[0].fee, 500)

  // Verify recordExecution calldata
  assert.equal(bundle.recordCalldata.startsWith("0x"), true)
  const decodedRecord = decodeFunctionData({
    abi: REGENT_MANDATE_ABI,
    data: bundle.recordCalldata,
  })
  assert.equal(decodedRecord.args[0], mandateWithContract.onChainId)

  // The redeem batch MUST have exactly 2 executions: [approve, exactInputSingle]
  assert.equal(bundle.executions.length, 2)
  assert.equal(bundle.executions[0].target, BASE_SEPOLIA_USDC)
  assert.equal(bundle.executions[1].target, UNISWAP_SWAP_ROUTER_02_BASE_SEPOLIA)

  // redeemDelegations selector: 0xcef6d209
  assert.equal(bundle.redeemCalldata.startsWith("0xcef6d209"), true)
})

test("executeRoute refuses live execution when MANDATE_CONTRACT is set but onChainId is missing or invalid", async () => {
  const mandateWithMissingOnChainId: Mandate = {
    ...mandate,
    delegation: dummyDelegation,
    onChainId: undefined,
  }

  const result = await executeRoute(mandateWithMissingOnChainId, route({ inputAmount: 10 }), {
    mode: "direct",
    mandateContract: "0x3333333333333333333333333333333333333333",
  })

  assert.equal(result.success, false)
  assert.match(result.error ?? "", /mandate\.onChainId is missing or invalid/)

  const mandateWithInvalidOnChainId: Mandate = {
    ...mandate,
    delegation: dummyDelegation,
    onChainId: "0x1234", // not 32 bytes
  }

  const result2 = await executeRoute(mandateWithInvalidOnChainId, route({ inputAmount: 10 }), {
    mode: "direct",
    mandateContract: "0x3333333333333333333333333333333333333333",
  })

  assert.equal(result2.success, false)
  assert.match(result2.error ?? "", /mandate\.onChainId is missing or invalid/)
})

test("executeRoute in direct mode records execution BEFORE redeeming delegations", async () => {
  const mandateWithContract: Mandate = {
    ...mandate,
    delegation: dummyDelegation,
    onChainId: "0x2222222222222222222222222222222222222222222222222222222222222222",
  }

  const mandateContractAddr = "0x3333333333333333333333333333333333333333" as Address
  const callLog: { call: string; to: Address }[] = []
  const receiptLog: Hex[] = []

  const mockRecordHash = "0x1111111111111111111111111111111111111111111111111111111111111111" as Hex
  const mockRedeemHash = "0x2222222222222222222222222222222222222222222222222222222222222222" as Hex

  const mockWalletClient = {
    sendTransaction: async ({ to }: { to: Address; data: Hex; value?: bigint }) => {
      if (to.toLowerCase() === mandateContractAddr.toLowerCase()) {
        callLog.push({ call: "recordExecution", to })
        return mockRecordHash
      }
      callLog.push({ call: "redeemDelegations", to })
      return mockRedeemHash
    },
  }

  const mockPublicClient = {
    waitForTransactionReceipt: async ({ hash }: { hash: Hex }) => {
      receiptLog.push(hash)
      return {
        status: "success",
        transactionHash: hash,
      }
    },
  }

  const result = await executeRoute(mandateWithContract, route({ inputAmount: 10 }), {
    mode: "direct",
    mandateContract: mandateContractAddr,
    walletClient: mockWalletClient,
    publicClient: mockPublicClient,
  })

  assert.equal(result.success, true)
  assert.equal(result.source, "direct")
  assert.equal(result.txHash, mockRedeemHash)
  assert.equal(result.transactionHash, mockRedeemHash)
  assert.equal(result.recordTxHash, mockRecordHash)

  // Verify call order: recordExecution happened FIRST, then redeemDelegations
  assert.equal(callLog.length, 2)
  assert.equal(callLog[0].call, "recordExecution")
  assert.equal(callLog[0].to.toLowerCase(), mandateContractAddr.toLowerCase())
  assert.equal(callLog[1].call, "redeemDelegations")
  assert.equal(callLog[1].to.toLowerCase(), "0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3".toLowerCase())

  // Verify receipt wait order: waited for record receipt before waiting for redeem receipt
  assert.deepEqual(receiptLog, [mockRecordHash, mockRedeemHash])
})

test("executeRoute in direct mode halts and does not send redeemDelegations if recordExecution reverts", async () => {
  const mandateWithContract: Mandate = {
    ...mandate,
    delegation: dummyDelegation,
    onChainId: "0x2222222222222222222222222222222222222222222222222222222222222222",
  }

  const mandateContractAddr = "0x3333333333333333333333333333333333333333" as Address
  let redeemSent = false

  const mockWalletClient = {
    sendTransaction: async ({ to }: { to: Address; data: Hex }) => {
      if (to.toLowerCase() === mandateContractAddr.toLowerCase()) {
        throw new Error("execution reverted: BudgetExceeded(100, 200)")
      }
      redeemSent = true
      return "0x9999999999999999999999999999999999999999999999999999999999999999" as Hex
    },
  }

  const result = await executeRoute(mandateWithContract, route({ inputAmount: 10 }), {
    mode: "direct",
    mandateContract: mandateContractAddr,
    walletClient: mockWalletClient,
  })

  assert.equal(result.success, false)
  assert.equal(redeemSent, false)
  assert.match(result.error ?? "", /requested spend exceeds remaining budget/)
})

test("executeRoute in relayer mode sends recordExecution first then redeemDelegations and returns both hashes", async () => {
  const mandateWithContract: Mandate = {
    ...mandate,
    delegation: dummyDelegation,
    onChainId: "0x2222222222222222222222222222222222222222222222222222222222222222",
  }

  const mandateContractAddr = "0x3333333333333333333333333333333333333333" as Address
  const requestedTxs: { to: string }[] = []

  const originalFetch = globalThis.fetch
  globalThis.fetch = async (_url: unknown, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body))
    const to = body.params.transactions[0].to as string
    requestedTxs.push({ to })

    const isRecord = to.toLowerCase() === mandateContractAddr.toLowerCase()
    return {
      json: async () => ({
        result: {
          transactionHash: isRecord
            ? "0x1111111111111111111111111111111111111111111111111111111111111111"
            : "0x2222222222222222222222222222222222222222222222222222222222222222",
          taskId: isRecord ? "task-record" : "task-redeem",
        },
      }),
    } as unknown as Response
  }

  try {
    const result = await executeRoute(mandateWithContract, route({ inputAmount: 10 }), {
      mode: "relayer",
      mandateContract: mandateContractAddr,
    })

    assert.equal(result.success, true)
    assert.equal(result.source, "relayer")
    assert.equal(result.recordTxHash, "0x1111111111111111111111111111111111111111111111111111111111111111")
    assert.equal(result.txHash, "0x2222222222222222222222222222222222222222222222222222222222222222")
    assert.equal(result.transactionHash, "0x2222222222222222222222222222222222222222222222222222222222222222")
    assert.equal(result.taskId, "task-redeem")
    assert.equal(requestedTxs.length, 2)
    assert.equal(requestedTxs[0].to.toLowerCase(), mandateContractAddr.toLowerCase())
  } finally {
    globalThis.fetch = originalFetch
  }
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
    mapRevertError(new Error("execution reverted: NotAgent()")),
    /caller is not the authorized agent/,
  )
  assert.match(
    mapRevertError(new Error("execution reverted: NotOwner()")),
    /caller is not the mandate owner/,
  )
  assert.match(
    mapRevertError(new Error("CaveatEnforcer failed")),
    /Execution reverted by caveat check/,
  )
})

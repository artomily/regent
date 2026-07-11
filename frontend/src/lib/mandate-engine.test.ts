import { beforeEach, describe, expect, test } from "vitest"
import {
  checkBudget,
  checkSlippage,
  createMandate,
  getAllMandates,
  getMandate,
  isMandateExpired,
  recordSpend,
  validateMandate,
} from "./mandate-engine"
import type { Mandate } from "./types"

function baseMandate(overrides: Partial<Mandate> = {}): Mandate {
  return {
    id: "m1",
    goal: "Acquire ETH",
    budget: 100,
    maxSlippage: 2,
    targetAsset: "ETH",
    sourceAsset: "USDC",
    expiry: new Date(Date.now() + 3_600_000).toISOString(),
    status: "active",
    createdAt: Date.now(),
    spent: 0,
    ...overrides,
  }
}

describe("checkBudget", () => {
  test("allows a spend that fits within the remaining budget", () => {
    expect(checkBudget(baseMandate({ budget: 100, spent: 20 }), 50)).toBe(true)
  })

  test("allows a spend that exactly exhausts the remaining budget", () => {
    expect(checkBudget(baseMandate({ budget: 100, spent: 20 }), 80)).toBe(true)
  })

  test("rejects a spend that would exceed the remaining budget", () => {
    expect(checkBudget(baseMandate({ budget: 100, spent: 20 }), 81)).toBe(false)
  })

  test("accounts for spend already recorded against the mandate", () => {
    expect(checkBudget(baseMandate({ budget: 100, spent: 99 }), 2)).toBe(false)
  })
})

describe("checkSlippage", () => {
  test("allows slippage at or under the ceiling", () => {
    expect(checkSlippage(baseMandate({ maxSlippage: 2 }), 2)).toBe(true)
    expect(checkSlippage(baseMandate({ maxSlippage: 2 }), 1)).toBe(true)
  })

  test("rejects slippage over the ceiling", () => {
    expect(checkSlippage(baseMandate({ maxSlippage: 2 }), 2.01)).toBe(false)
  })
})

describe("isMandateExpired", () => {
  test("is false while the expiry is in the future", () => {
    expect(isMandateExpired(baseMandate({ expiry: new Date(Date.now() + 60_000).toISOString() }))).toBe(false)
  })

  test("is true once the expiry has passed", () => {
    expect(isMandateExpired(baseMandate({ expiry: new Date(Date.now() - 1000).toISOString() }))).toBe(true)
  })
})

describe("validateMandate", () => {
  test("accepts a well-formed mandate", () => {
    expect(validateMandate(baseMandate()).valid).toBe(true)
  })

  test("rejects a blank goal", () => {
    const result = validateMandate(baseMandate({ goal: "   " }))
    expect(result.valid).toBe(false)
    expect(result.reason).toMatch(/goal/i)
  })

  test("rejects a non-positive budget", () => {
    expect(validateMandate(baseMandate({ budget: 0 })).valid).toBe(false)
  })

  test("rejects slippage outside 0-100", () => {
    expect(validateMandate(baseMandate({ maxSlippage: -1 })).valid).toBe(false)
    expect(validateMandate(baseMandate({ maxSlippage: 101 })).valid).toBe(false)
  })

  test("rejects a target asset equal to the source asset", () => {
    expect(validateMandate(baseMandate({ targetAsset: "USDC", sourceAsset: "USDC" })).valid).toBe(false)
  })

  test("rejects an expiry already in the past", () => {
    expect(validateMandate(baseMandate({ expiry: new Date(Date.now() - 1000).toISOString() })).valid).toBe(false)
  })
})

describe("mandate persistence (localStorage-backed)", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test("createMandate persists a retrievable mandate with zero initial spend", () => {
    const created = createMandate({
      goal: "Acquire ETH",
      budget: 50,
      maxSlippage: 1,
      targetAsset: "ETH",
      sourceAsset: "USDC",
      expiry: new Date(Date.now() + 3_600_000).toISOString(),
    })

    expect(created.spent).toBe(0)
    expect(getMandate(created.id)?.goal).toBe("Acquire ETH")
    expect(getAllMandates()).toHaveLength(1)
  })

  test("recordSpend accumulates against the existing spent total", () => {
    const created = createMandate({
      goal: "Acquire ETH",
      budget: 50,
      maxSlippage: 1,
      targetAsset: "ETH",
      sourceAsset: "USDC",
      expiry: new Date(Date.now() + 3_600_000).toISOString(),
    })

    recordSpend(created.id, 10)
    recordSpend(created.id, 5)

    expect(getMandate(created.id)?.spent).toBe(15)
  })
})

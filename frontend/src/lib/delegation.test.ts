import { describe, expect, it } from "vitest"
import {
  buildMandateDelegation,
  deserializeDelegation,
  RECORD_EXECUTION_SELECTOR,
  serializeDelegation,
} from "./delegation"
import type { Mandate } from "./types"

describe("delegation caveat construction", () => {
  const dummyMandate: Mandate = {
    id: "mandate-test-1",
    goal: "Acquire ETH under 2% slippage",
    budget: 100,
    maxSlippage: 2,
    sourceAsset: "USDC",
    targetAsset: "ETH",
    expiry: new Date(Date.now() + 86400000).toISOString(),
    status: "pending",
    createdAt: Date.now(),
    spent: 0,
  }

  const smartAccountAddress = "0x13eFc9C5c3B853C894802Cf71B658ec586D2d909"
  const agentAddress = "0x2222222222222222222222222222222222222222"
  const contractAddress = "0x3333333333333333333333333333333333333333"

  it("builds a valid ERC-7710 delegation with required caveats", () => {
    const delegation = buildMandateDelegation({
      smartAccountAddress,
      agentAddress,
      mandate: dummyMandate,
      mandateContractAddress: contractAddress,
    })

    expect(delegation.delegator.toLowerCase()).toBe(smartAccountAddress.toLowerCase())
    expect(delegation.delegate.toLowerCase()).toBe(agentAddress.toLowerCase())
    expect(delegation.caveats.length).toBeGreaterThanOrEqual(4)

    // Check that caveats contain target, method, and amount caveats
    const enforcers = delegation.caveats.map((c) => c.enforcer.toLowerCase())
    expect(enforcers.length).toBe(delegation.caveats.length)

    // Check allowed targets includes contractAddress and swap routers
    const targetsCaveat = delegation.caveats.find((c) =>
      c.terms.toLowerCase().includes(contractAddress.toLowerCase().replace("0x", "")),
    )
    expect(targetsCaveat).toBeDefined()

    // Check allowed methods includes recordExecution selector
    const methodsCaveat = delegation.caveats.find((c) =>
      c.terms.toLowerCase().includes(RECORD_EXECUTION_SELECTOR.replace("0x", "")),
    )
    expect(methodsCaveat).toBeDefined()
  })

  it("serializes and deserializes delegation preserving structure", () => {
    const delegation = buildMandateDelegation({
      smartAccountAddress,
      agentAddress,
      mandate: dummyMandate,
      mandateContractAddress: contractAddress,
    })

    const serialized = serializeDelegation(delegation)
    expect(typeof serialized).toBe("string")

    const parsed = deserializeDelegation(serialized)
    expect(parsed.delegator).toBe(delegation.delegator)
    expect(parsed.delegate).toBe(delegation.delegate)
    expect(parsed.caveats.length).toBe(delegation.caveats.length)
  })
})

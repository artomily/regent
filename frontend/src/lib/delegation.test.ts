import { describe, expect, it } from "vitest"
import {
  APPROVE_SELECTOR,
  buildMandateDelegation,
  deserializeDelegation,
  EXACT_INPUT_SINGLE_SELECTOR,
  serializeDelegation,
} from "./delegation"
import { SWAP_ROUTERS, TOKEN_ADDRESSES } from "./constants"
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

  it("builds a valid ERC-7710 delegation with required functionCall scope and caveats", () => {
    const delegation = buildMandateDelegation({
      smartAccountAddress,
      agentAddress,
      mandate: dummyMandate,
      mandateContractAddress: contractAddress,
    })

    expect(delegation.delegator.toLowerCase()).toBe(smartAccountAddress.toLowerCase())
    expect(delegation.delegate.toLowerCase()).toBe(agentAddress.toLowerCase())
    expect(delegation.caveats.length).toBeGreaterThanOrEqual(6)

    // Check allowed targets includes USDC and SwapRouter02
    const usdcHex = TOKEN_ADDRESSES.USDC.toLowerCase().replace("0x", "")
    const swapRouterHex = SWAP_ROUTERS[0].toLowerCase().replace("0x", "")

    const targetsCaveat = delegation.caveats.find(
      (c) =>
        c.terms.toLowerCase().includes(usdcHex) &&
        c.terms.toLowerCase().includes(swapRouterHex),
    )
    expect(targetsCaveat).toBeDefined()

    // Check allowed methods includes approve and exactInputSingle selectors
    const approveHex = APPROVE_SELECTOR.replace("0x", "")
    const exactInputHex = EXACT_INPUT_SINGLE_SELECTOR.replace("0x", "")

    const methodsCaveat = delegation.caveats.find(
      (c) =>
        c.terms.toLowerCase().includes(approveHex) &&
        c.terms.toLowerCase().includes(exactInputHex),
    )
    expect(methodsCaveat).toBeDefined()

    // Check allowedCalldata caveats pin SwapRouter02, USDC, and smartAccount
    const calldataSpender = delegation.caveats.find((c) =>
      c.terms.toLowerCase().includes(swapRouterHex),
    )
    expect(calldataSpender).toBeDefined()

    const smartAccountHex = smartAccountAddress.toLowerCase().replace("0x", "")
    const calldataRecipient = delegation.caveats.find((c) =>
      c.terms.toLowerCase().includes(smartAccountHex),
    )
    expect(calldataRecipient).toBeDefined()

    // Check erc20BalanceChange caveat pins USDC decrease <= budget
    const balanceChangeCaveat = delegation.caveats.find(
      (c) =>
        c.terms.toLowerCase().includes(usdcHex) &&
        c.terms.toLowerCase().includes(smartAccountHex),
    )
    expect(balanceChangeCaveat).toBeDefined()
  })

  it("generates differing random 32-byte salts per delegation by default", () => {
    const d1 = buildMandateDelegation({
      smartAccountAddress,
      agentAddress,
      mandate: dummyMandate,
    })
    const d2 = buildMandateDelegation({
      smartAccountAddress,
      agentAddress,
      mandate: dummyMandate,
    })

    expect(d1.salt).not.toBe(d2.salt)
    expect(d1.salt).toMatch(/^0x[0-9a-fA-F]{64}$/)
    expect(d2.salt).toMatch(/^0x[0-9a-fA-F]{64}$/)
  })

  it("refuses in live mode if NEXT_PUBLIC_AGENT_ADDRESS is unset or placeholder", () => {
    expect(() =>
      buildMandateDelegation({
        smartAccountAddress,
        agentAddress: undefined,
        mandate: dummyMandate,
        mandateContractAddress: contractAddress,
      }),
    ).toThrow(/NEXT_PUBLIC_AGENT_ADDRESS is unset or placeholder/)

    expect(() =>
      buildMandateDelegation({
        smartAccountAddress,
        agentAddress: "0x0000000000000000000000000000000000000000",
        mandate: dummyMandate,
        mandateContractAddress: contractAddress,
      }),
    ).toThrow(/NEXT_PUBLIC_AGENT_ADDRESS is unset or placeholder/)
  })

  it("serializes and deserializes delegation preserving structure", () => {
    const delegation = buildMandateDelegation({
      smartAccountAddress,
      agentAddress,
      mandate: dummyMandate,
    })

    const serialized = serializeDelegation(delegation)
    expect(typeof serialized).toBe("string")

    const parsed = deserializeDelegation(serialized)
    expect(parsed.delegator).toBe(delegation.delegator)
    expect(parsed.delegate).toBe(delegation.delegate)
    expect(parsed.salt).toBe(delegation.salt)
    expect(parsed.caveats.length).toBe(delegation.caveats.length)
  })
})

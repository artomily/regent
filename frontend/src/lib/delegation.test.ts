import { describe, expect, it } from "vitest"
import {
  APPROVE_SELECTOR,
  buildMandateDelegations,
  buildSwapDelegation,
  deserializeDelegation,
  deserializeDelegations,
  EXACT_INPUT_SINGLE_SELECTOR,
  serializeDelegation,
  serializeDelegations,
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

  it("builds two narrow delegations (approve and swap) with distinct targets and scopes", () => {
    const { approve, swap } = buildMandateDelegations({
      smartAccountAddress,
      agentAddress,
      mandate: dummyMandate,
      mandateContractAddress: contractAddress,
    })

    expect(approve.delegator.toLowerCase()).toBe(smartAccountAddress.toLowerCase())
    expect(approve.delegate.toLowerCase()).toBe(agentAddress.toLowerCase())
    expect(swap.delegator.toLowerCase()).toBe(smartAccountAddress.toLowerCase())
    expect(swap.delegate.toLowerCase()).toBe(agentAddress.toLowerCase())

    // 1. Approve delegation tests
    const usdcHex = TOKEN_ADDRESSES.USDC.toLowerCase().replace("0x", "")
    const swapRouterHex = SWAP_ROUTERS[0].toLowerCase().replace("0x", "")
    const wethHex = TOKEN_ADDRESSES.WETH.toLowerCase().replace("0x", "")
    const smartAccountHex = smartAccountAddress.toLowerCase().replace("0x", "")

    const approveTargetsCaveat = approve.caveats.find((c) =>
      c.terms.toLowerCase().includes(usdcHex),
    )
    expect(approveTargetsCaveat).toBeDefined()

    const approveHex = APPROVE_SELECTOR.replace("0x", "")
    const approveMethodsCaveat = approve.caveats.find((c) =>
      c.terms.toLowerCase().includes(approveHex),
    )
    expect(approveMethodsCaveat).toBeDefined()

    // AllowedCalldata pins SwapRouter02 at index 4 for approve
    const approveCalldataCaveat = approve.caveats.find((c) =>
      c.terms.toLowerCase().includes(swapRouterHex),
    )
    expect(approveCalldataCaveat).toBeDefined()

    // 2. Swap delegation tests
    const swapTargetsCaveat = swap.caveats.find((c) =>
      c.terms.toLowerCase().includes(swapRouterHex),
    )
    expect(swapTargetsCaveat).toBeDefined()

    const exactInputHex = EXACT_INPUT_SINGLE_SELECTOR.replace("0x", "")
    const swapMethodsCaveat = swap.caveats.find((c) =>
      c.terms.toLowerCase().includes(exactInputHex),
    )
    expect(swapMethodsCaveat).toBeDefined()

    // AllowedCalldata pins tokenIn (USDC) at index 4, tokenOut (WETH) at index 36, recipient (smartAccount) at index 100
    const swapCalldataUsdc = swap.caveats.find((c) =>
      c.terms.toLowerCase().includes(usdcHex),
    )
    expect(swapCalldataUsdc).toBeDefined()

    const swapCalldataWeth = swap.caveats.find((c) =>
      c.terms.toLowerCase().includes(wethHex),
    )
    expect(swapCalldataWeth).toBeDefined()

    const swapCalldataRecipient = swap.caveats.find((c) =>
      c.terms.toLowerCase().includes(smartAccountHex),
    )
    expect(swapCalldataRecipient).toBeDefined()

    // ERC20BalanceChange caveat pins USDC decrease <= budget on swap delegation only
    const balanceChangeCaveat = swap.caveats.find(
      (c) =>
        c.terms.toLowerCase().includes(usdcHex) &&
        c.terms.toLowerCase().includes(smartAccountHex),
    )
    expect(balanceChangeCaveat).toBeDefined()

    // Approve delegation does NOT have ERC20BalanceChange caveat
    const approveBalanceCaveat = approve.caveats.find(
      (c) => c.enforcer.toLowerCase() === balanceChangeCaveat?.enforcer.toLowerCase(),
    )
    expect(approveBalanceCaveat).toBeUndefined()
  })

  it("generates differing random 32-byte salts per delegation and between approve and swap", () => {
    const pair1 = buildMandateDelegations({
      smartAccountAddress,
      agentAddress,
      mandate: dummyMandate,
    })
    const pair2 = buildMandateDelegations({
      smartAccountAddress,
      agentAddress,
      mandate: dummyMandate,
    })

    expect(pair1.approve.salt).not.toBe(pair1.swap.salt)
    expect(pair1.approve.salt).toMatch(/^0x[0-9a-fA-F]{64}$/)
    expect(pair1.swap.salt).toMatch(/^0x[0-9a-fA-F]{64}$/)

    expect(pair1.approve.salt).not.toBe(pair2.approve.salt)
    expect(pair1.swap.salt).not.toBe(pair2.swap.salt)
  })

  it("refuses in live mode if NEXT_PUBLIC_AGENT_ADDRESS is unset or placeholder", () => {
    expect(() =>
      buildMandateDelegations({
        smartAccountAddress,
        agentAddress: undefined,
        mandate: dummyMandate,
        mandateContractAddress: contractAddress,
      }),
    ).toThrow(/NEXT_PUBLIC_AGENT_ADDRESS is unset or placeholder/)

    expect(() =>
      buildMandateDelegations({
        smartAccountAddress,
        agentAddress: "0x0000000000000000000000000000000000000000",
        mandate: dummyMandate,
        mandateContractAddress: contractAddress,
      }),
    ).toThrow(/NEXT_PUBLIC_AGENT_ADDRESS is unset or placeholder/)
  })

  it("serializes and deserializes delegation pair preserving structure", () => {
    const pair = buildMandateDelegations({
      smartAccountAddress,
      agentAddress,
      mandate: dummyMandate,
    })

    const serialized = serializeDelegations(pair)
    expect(typeof serialized).toBe("string")

    const parsed = deserializeDelegations(serialized)
    expect(parsed.approve.delegator).toBe(pair.approve.delegator)
    expect(parsed.approve.delegate).toBe(pair.approve.delegate)
    expect(parsed.approve.salt).toBe(pair.approve.salt)

    expect(parsed.swap.delegator).toBe(pair.swap.delegator)
    expect(parsed.swap.delegate).toBe(pair.swap.delegate)
    expect(parsed.swap.salt).toBe(pair.swap.salt)
  })

  it("serializes and deserializes single delegation preserving structure", () => {
    const delegation = buildSwapDelegation({
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

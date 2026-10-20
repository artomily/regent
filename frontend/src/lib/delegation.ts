import {
  BalanceChangeType,
  createDelegation,
  getSmartAccountsEnvironment,
  ScopeType,
  type Delegation,
  type MetaMaskSmartAccount,
} from "@metamask/smart-accounts-kit"
import {
  createERC20BalanceChangeTerms,
  createLimitedCallsTerms,
  createTimestampTerms,
} from "@metamask/delegation-core"
import { getAddress, isAddress, pad, toFunctionSelector, toHex, type Hex } from "viem"
import {
  AGENT_ADDRESS,
  BASE_SEPOLIA_CHAIN_ID,
  MANDATE_CONTRACT,
  SWAP_ROUTERS,
  TOKEN_ADDRESSES,
} from "./constants"
import type { Mandate } from "./types"

export const APPROVE_SELECTOR = toFunctionSelector("approve(address,uint256)")
export const EXACT_INPUT_SINGLE_SELECTOR = toFunctionSelector(
  "exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
)

export const RECORD_EXECUTION_SELECTOR = toFunctionSelector(
  "recordExecution(bytes32,uint256,uint256,uint16,bytes32)",
)

export const DEX_SWAP_SELECTORS: Hex[] = [
  EXACT_INPUT_SINGLE_SELECTOR, // 0x04e45aaf
  "0xb858183f", // exactInput((bytes,address,uint256,uint256))
  "0x38ed1739", // swapExactTokensForTokens(uint256,uint256,address[],address,uint256)
]

export const PLACEHOLDER_ADDRESSES = new Set([
  "0x0000000000000000000000000000000000000000",
  "0x0000000000000000000000000000000000000001",
  "0x...",
])

export interface BuildDelegationParams {
  smartAccountAddress: Hex
  agentAddress?: Hex
  mandate: Mandate
  mandateContractAddress?: Hex
  salt?: Hex
}

/**
 * ARCHITECTURE & SECURITY BOUNDARIES:
 *
 * 1. ENFORCED ON-CHAIN BY ERC-7710 CAVEATS (DelegationManager):
 *    - AllowedTargetsEnforcer: Limits delegate calls exclusively to USDC and Uniswap SwapRouter02.
 *    - AllowedMethodsEnforcer: Limits delegate invocations exclusively to approve(address,uint256)
 *      and exactInputSingle((address,address,uint24,address,uint256,uint256,uint160)).
 *    - AllowedCalldataEnforcer:
 *        * approve: ensures spender parameter (calldata offset 4..36) strictly matches SwapRouter02.
 *        * exactInputSingle: ensures tokenIn parameter (offset 4..36) strictly matches USDC,
 *          and recipient parameter (offset 100..132) strictly matches the delegator Smart Account,
 *          guaranteeing swapped proceeds flow back to the user's smart account.
 *    - ValueLteEnforcer: Ensures native ETH value sent is 0, preventing native fund draining.
 *    - TimestampEnforcer: Enforces delegation validity window, expiring at mandate.expiry.
 *    - LimitedCallsEnforcer: Caps total redemption count (10 calls) against replay loops.
 *    - ERC20BalanceChangeEnforcer: Enforces an on-chain decrease spend bound ensuring the smart
 *      account's USDC balance decreases by at most the mandate budget amount across the execution.
 *
 * 2. ENFORCED ON-CHAIN BY RegentMandate.sol:
 *    - recordExecution: Audits execution metadata (route, spent amount, received amount,
 *      slippage, proof hash) on-chain for verification and tracking.
 *    - Mandate state lifecycle (Active -> Completed or Revoked).
 *    - Direct revocation via revokeMandate() updating on-chain registry state.
 *
 * 3. OFF-CHAIN / AGENT LEVEL:
 *    - AI model route evaluation, market intelligence, slippage estimation, and Venice AI proof verification.
 */
export function buildMandateDelegation({
  smartAccountAddress,
  agentAddress,
  mandate,
  mandateContractAddress,
  salt,
}: BuildDelegationParams): Delegation {
  const env = getSmartAccountsEnvironment(BASE_SEPOLIA_CHAIN_ID)

  const isLive = Boolean(
    (mandateContractAddress && mandateContractAddress.trim().length > 0) ||
      (MANDATE_CONTRACT && MANDATE_CONTRACT.trim().length > 0),
  )

  const candidateAgent = agentAddress || AGENT_ADDRESS
  const isAgentInvalid =
    !candidateAgent ||
    !isAddress(candidateAgent) ||
    PLACEHOLDER_ADDRESSES.has(candidateAgent.toLowerCase())

  if (isLive && isAgentInvalid) {
    throw new Error(
      "Cannot create delegation in live mode: NEXT_PUBLIC_AGENT_ADDRESS is unset or placeholder",
    )
  }

  const delegate: Hex = candidateAgent && isAddress(candidateAgent) && !PLACEHOLDER_ADDRESSES.has(candidateAgent.toLowerCase())
    ? getAddress(candidateAgent)
    : smartAccountAddress

  const normalizedSmartAccount = getAddress(smartAccountAddress)
  const usdcAddress = getAddress(TOKEN_ADDRESSES.USDC)
  const swapRouterAddress = getAddress(SWAP_ROUTERS[0])

  const budgetUnits = BigInt(Math.round(mandate.budget * 1e6))
  const expiryTimestamp = Math.floor(new Date(mandate.expiry).getTime() / 1000)

  const allowedTargets: Hex[] = [usdcAddress, swapRouterAddress]
  const allowedSelectors: Hex[] = [APPROVE_SELECTOR, EXACT_INPUT_SINGLE_SELECTOR]

  const delegationSalt: Hex =
    salt ?? toHex(crypto.getRandomValues(new Uint8Array(32)))

  const additionalCaveats = [
    {
      enforcer: env.caveatEnforcers.TimestampEnforcer,
      terms: createTimestampTerms({ afterThreshold: 0, beforeThreshold: expiryTimestamp }),
      args: "0x00" as Hex,
    },
    {
      enforcer: env.caveatEnforcers.LimitedCallsEnforcer,
      terms: createLimitedCallsTerms({ limit: 10 }),
      args: "0x00" as Hex,
    },
    {
      enforcer: env.caveatEnforcers.ERC20BalanceChangeEnforcer,
      terms: createERC20BalanceChangeTerms({
        tokenAddress: usdcAddress,
        recipient: normalizedSmartAccount,
        balance: budgetUnits,
        changeType: BalanceChangeType.Decrease,
      }),
      args: "0x00" as Hex,
    },
  ]

  return createDelegation({
    environment: env,
    from: normalizedSmartAccount,
    to: delegate,
    scope: {
      type: ScopeType.FunctionCall,
      targets: allowedTargets,
      selectors: allowedSelectors,
      allowedCalldata: [
        { startIndex: 4, value: pad(swapRouterAddress, { size: 32 }) },
        { startIndex: 4, value: pad(usdcAddress, { size: 32 }) },
        { startIndex: 100, value: pad(normalizedSmartAccount, { size: 32 }) },
      ],
    },
    caveats: additionalCaveats,
    salt: delegationSalt,
  })
}

export async function signMandateDelegation(
  smartAccount: MetaMaskSmartAccount,
  delegation: Delegation,
): Promise<Delegation> {
  const signature = await smartAccount.signDelegation({
    delegation,
    chainId: BASE_SEPOLIA_CHAIN_ID,
  })
  return {
    ...delegation,
    signature,
  }
}

export function serializeDelegation(delegation: Delegation): string {
  return JSON.stringify(delegation, (_, value) =>
    typeof value === "bigint" ? value.toString() : value,
  )
}

export function deserializeDelegation(serialized: unknown): Delegation {
  if (typeof serialized === "object" && serialized !== null) {
    return serialized as Delegation
  }
  if (typeof serialized !== "string") {
    throw new Error("Invalid serialized delegation: expected string or object")
  }
  return JSON.parse(serialized) as Delegation
}

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
  limitedCallsLimit?: number
}

export interface BuildMandateDelegationsParams {
  smartAccountAddress: Hex
  agentAddress?: Hex
  mandate: Mandate
  mandateContractAddress?: Hex
  approveSalt?: Hex
  swapSalt?: Hex
  limitedCallsLimit?: number
}

export interface MandateDelegationPair {
  approve: Delegation
  swap: Delegation
}

function resolveDelegateAddress({
  smartAccountAddress,
  agentAddress,
  mandateContractAddress,
}: {
  smartAccountAddress: Hex
  agentAddress?: Hex
  mandateContractAddress?: Hex
}): Hex {
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

  return candidateAgent && isAddress(candidateAgent) && !PLACEHOLDER_ADDRESSES.has(candidateAgent.toLowerCase())
    ? getAddress(candidateAgent)
    : getAddress(smartAccountAddress)
}

/**
 * Builds a narrow delegation for approving USDC on Uniswap SwapRouter02:
 * - target: USDC (0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - method: approve(address,uint256) (0x095ea7b3)
 * - allowedCalldata: index 4 = pad(SwapRouter02 0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4)
 * - caveats: TimestampEnforcer(expiry), LimitedCallsEnforcer(limit)
 */
export function buildApproveDelegation({
  smartAccountAddress,
  agentAddress,
  mandate,
  mandateContractAddress,
  salt,
  limitedCallsLimit = 10,
}: BuildDelegationParams): Delegation {
  const env = getSmartAccountsEnvironment(BASE_SEPOLIA_CHAIN_ID)
  const delegate = resolveDelegateAddress({
    smartAccountAddress,
    agentAddress,
    mandateContractAddress,
  })

  const normalizedSmartAccount = getAddress(smartAccountAddress)
  const usdcAddress = getAddress(TOKEN_ADDRESSES.USDC)
  const swapRouterAddress = getAddress(SWAP_ROUTERS[0])

  const expiryTimestamp = Math.floor(new Date(mandate.expiry).getTime() / 1000)
  const delegationSalt: Hex =
    salt ?? toHex(crypto.getRandomValues(new Uint8Array(32)))

  const caveats = [
    {
      enforcer: env.caveatEnforcers.TimestampEnforcer,
      terms: createTimestampTerms({ afterThreshold: 0, beforeThreshold: expiryTimestamp }),
      args: "0x00" as Hex,
    },
    {
      enforcer: env.caveatEnforcers.LimitedCallsEnforcer,
      terms: createLimitedCallsTerms({ limit: limitedCallsLimit }),
      args: "0x00" as Hex,
    },
  ]

  return createDelegation({
    environment: env,
    from: normalizedSmartAccount,
    to: delegate,
    scope: {
      type: ScopeType.FunctionCall,
      targets: [usdcAddress],
      selectors: [APPROVE_SELECTOR],
      allowedCalldata: [
        { startIndex: 4, value: pad(swapRouterAddress, { size: 32 }) },
      ],
    },
    caveats,
    salt: delegationSalt,
  })
}

/**
 * Builds a narrow delegation for executing exactInputSingle on Uniswap SwapRouter02:
 * - target: SwapRouter02 (0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4)
 * - method: exactInputSingle((address,address,uint24,address,uint256,uint256,uint160)) (0x04e45aaf)
 * - allowedCalldata:
 *     * index 4 = pad(USDC 0x036CbD53842c5426634e7929541eC2318f3dCF7e) (tokenIn)
 *     * index 36 = pad(WETH 0x4200000000000000000000000000000000000006) (tokenOut)
 *     * index 100 = pad(smartAccount) (recipient)
 * - caveats:
 *     * TimestampEnforcer(expiry)
 *     * LimitedCallsEnforcer(limit)
 *     * ERC20BalanceChangeEnforcer(USDC, smartAccount, decrease <= budget)
 */
export function buildSwapDelegation({
  smartAccountAddress,
  agentAddress,
  mandate,
  mandateContractAddress,
  salt,
  limitedCallsLimit = 10,
}: BuildDelegationParams): Delegation {
  const env = getSmartAccountsEnvironment(BASE_SEPOLIA_CHAIN_ID)
  const delegate = resolveDelegateAddress({
    smartAccountAddress,
    agentAddress,
    mandateContractAddress,
  })

  const normalizedSmartAccount = getAddress(smartAccountAddress)
  const usdcAddress = getAddress(TOKEN_ADDRESSES.USDC)
  const wethAddress = getAddress(TOKEN_ADDRESSES.WETH)
  const swapRouterAddress = getAddress(SWAP_ROUTERS[0])

  const budgetUnits = BigInt(Math.round(mandate.budget * 1e6))
  const expiryTimestamp = Math.floor(new Date(mandate.expiry).getTime() / 1000)
  const delegationSalt: Hex =
    salt ?? toHex(crypto.getRandomValues(new Uint8Array(32)))

  const caveats = [
    {
      enforcer: env.caveatEnforcers.TimestampEnforcer,
      terms: createTimestampTerms({ afterThreshold: 0, beforeThreshold: expiryTimestamp }),
      args: "0x00" as Hex,
    },
    {
      enforcer: env.caveatEnforcers.LimitedCallsEnforcer,
      terms: createLimitedCallsTerms({ limit: limitedCallsLimit }),
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
      targets: [swapRouterAddress],
      selectors: [EXACT_INPUT_SINGLE_SELECTOR],
      allowedCalldata: [
        { startIndex: 4, value: pad(usdcAddress, { size: 32 }) },
        { startIndex: 36, value: pad(wethAddress, { size: 32 }) },
        { startIndex: 100, value: pad(normalizedSmartAccount, { size: 32 }) },
      ],
    },
    caveats,
    salt: delegationSalt,
  })
}

/**
 * Builds the two narrow delegations required for mandate execution:
 * 1. approveDelegation (USDC -> SwapRouter02)
 * 2. swapDelegation (SwapRouter02 -> exactInputSingle)
 * Each delegation gets a distinct random 32-byte salt.
 */
export function buildMandateDelegations({
  smartAccountAddress,
  agentAddress,
  mandate,
  mandateContractAddress,
  approveSalt,
  swapSalt,
  limitedCallsLimit = 10,
}: BuildMandateDelegationsParams): MandateDelegationPair {
  const saltApprove: Hex =
    approveSalt ?? toHex(crypto.getRandomValues(new Uint8Array(32)))

  let saltSwap: Hex =
    swapSalt ?? toHex(crypto.getRandomValues(new Uint8Array(32)))

  while (saltSwap.toLowerCase() === saltApprove.toLowerCase()) {
    saltSwap = toHex(crypto.getRandomValues(new Uint8Array(32)))
  }

  const approve = buildApproveDelegation({
    smartAccountAddress,
    agentAddress,
    mandate,
    mandateContractAddress,
    salt: saltApprove,
    limitedCallsLimit,
  })

  const swap = buildSwapDelegation({
    smartAccountAddress,
    agentAddress,
    mandate,
    mandateContractAddress,
    salt: saltSwap,
    limitedCallsLimit,
  })

  return { approve, swap }
}

/**
 * Backwards-compatible single-delegation constructor.
 * Returns the swap delegation.
 */
export function buildMandateDelegation(params: BuildDelegationParams): Delegation {
  return buildSwapDelegation(params)
}

export async function signMandateDelegations(
  smartAccount: MetaMaskSmartAccount,
  delegations: MandateDelegationPair,
): Promise<MandateDelegationPair> {
  const approveSignature = await smartAccount.signDelegation({
    delegation: delegations.approve,
    chainId: BASE_SEPOLIA_CHAIN_ID,
  })
  const swapSignature = await smartAccount.signDelegation({
    delegation: delegations.swap,
    chainId: BASE_SEPOLIA_CHAIN_ID,
  })
  return {
    approve: {
      ...delegations.approve,
      signature: approveSignature,
    },
    swap: {
      ...delegations.swap,
      signature: swapSignature,
    },
  }
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

export function serializeDelegations(delegations: MandateDelegationPair): string {
  return JSON.stringify(delegations, (_, value) =>
    typeof value === "bigint" ? value.toString() : value,
  )
}

export function deserializeDelegations(serialized: unknown): MandateDelegationPair {
  if (typeof serialized === "object" && serialized !== null && "approve" in serialized && "swap" in serialized) {
    return serialized as MandateDelegationPair
  }
  if (typeof serialized !== "string") {
    throw new Error("Invalid serialized delegations: expected string or object")
  }
  return JSON.parse(serialized) as MandateDelegationPair
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

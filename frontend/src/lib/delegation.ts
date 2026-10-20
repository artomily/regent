import {
  createDelegation,
  getSmartAccountsEnvironment,
  ScopeType,
  type Delegation,
  type MetaMaskSmartAccount,
} from "@metamask/smart-accounts-kit"
import { toFunctionSelector, type Hex } from "viem"
import {
  AGENT_ADDRESS,
  BASE_SEPOLIA_CHAIN_ID,
  MANDATE_CONTRACT,
  SWAP_ROUTERS,
  TOKEN_ADDRESSES,
} from "./constants"
import type { Mandate } from "./types"

export const RECORD_EXECUTION_SELECTOR = toFunctionSelector(
  "recordExecution(bytes32,uint256,uint256,uint16,bytes32)",
)

export const DEX_SWAP_SELECTORS: Hex[] = [
  "0x04e45aaf", // exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))
  "0xb858183f", // exactInput((bytes,address,uint256,uint256))
  "0x38ed1739", // swapExactTokensForTokens(uint256,uint256,address[],address,uint256)
]

export interface BuildDelegationParams {
  smartAccountAddress: Hex
  agentAddress?: Hex
  mandate: Mandate
  mandateContractAddress?: Hex
  salt?: Hex
}

export function buildMandateDelegation({
  smartAccountAddress,
  agentAddress,
  mandate,
  mandateContractAddress,
  salt = "0x0000000000000000000000000000000000000000000000000000000000000001",
}: BuildDelegationParams): Delegation {
  const env = getSmartAccountsEnvironment(BASE_SEPOLIA_CHAIN_ID)
  const delegate = agentAddress || AGENT_ADDRESS || smartAccountAddress

  const tokenAddress =
    TOKEN_ADDRESSES[mandate.sourceAsset.toUpperCase()] ?? TOKEN_ADDRESSES.USDC

  const budgetUnits = BigInt(Math.round(mandate.budget * 1e6))
  const expiryTimestamp = Math.floor(new Date(mandate.expiry).getTime() / 1000)

  const targets: Hex[] = [...SWAP_ROUTERS]
  const contractAddr = mandateContractAddress || (MANDATE_CONTRACT as Hex)
  if (contractAddr && !targets.includes(contractAddr)) {
    targets.push(contractAddr)
  }

  const selectors: Hex[] = [RECORD_EXECUTION_SELECTOR, ...DEX_SWAP_SELECTORS]

  return createDelegation({
    environment: env,
    from: smartAccountAddress,
    to: delegate,
    scope: {
      type: ScopeType.Erc20TransferAmount,
      tokenAddress,
      maxAmount: budgetUnits,
    },
    caveats: [
      {
        type: "timestamp",
        afterThreshold: 0,
        beforeThreshold: expiryTimestamp,
      },
      {
        type: "allowedTargets",
        targets,
      },
      {
        type: "allowedMethods",
        selectors,
      },
      {
        type: "limitedCalls",
        limit: 20,
      },
    ],
    salt,
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

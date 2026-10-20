import { randomUUID } from "node:crypto"
import {
  contracts,
  createExecution,
  ExecutionMode,
  getSmartAccountsEnvironment,
  type Delegation,
  type ExecutionStruct,
} from "@metamask/smart-accounts-kit"
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  keccak256,
  parseAbi,
  parseUnits,
  stringToHex,
  toHex,
  type Address,
  type Hex,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { baseSepolia } from "viem/chains"
import {
  AGENT_PRIVATE_KEY,
  BASE_SEPOLIA_CHAIN_ID,
  EXECUTION_MODE,
  type ExecutionModeConfig,
  LIVE_EXECUTION,
  MANDATE_CONTRACT,
  ONE_SHOT_RELAYER_URL,
  RPC_URL,
} from "./config.ts"
import { logger } from "./logger.ts"
import { BASE_SEPOLIA_USDC, BASE_SEPOLIA_WETH } from "./quotes.ts"
import type { ExecutionResult, ExecutionSource, Mandate, Route } from "./types.ts"

// Uniswap SwapRouter02 deployment on Base Sepolia
export const UNISWAP_SWAP_ROUTER_02_BASE_SEPOLIA = "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4" as const

export const SWAP_ROUTER_ABI = parseAbi([
  "struct ExactInputSingleParams { address tokenIn; address tokenOut; uint24 fee; address recipient; uint256 amountIn; uint256 amountOutMinimum; uint160 sqrtPriceLimitX96; }",
  "function exactInputSingle(ExactInputSingleParams params) external payable returns (uint256 amountOut)",
])

export const ERC20_ABI = parseAbi([
  "function approve(address spender, uint256 amount) external returns (bool)",
])

export const REGENT_MANDATE_ABI = parseAbi([
  "function recordExecution(bytes32 id, uint256 spendAmount, uint256 receivedAmount, uint16 slippageBps, bytes32 routeRef) external",
])

export interface CalldataBundle {
  approveCalldata: Hex
  swapCalldata: Hex
  recordCalldata: Hex
  routeRef: Hex
  executions: ExecutionStruct[]
  redeemCalldata: Hex
  delegationManagerAddress: Address
}

export function parseDelegation(raw: unknown): Delegation | null {
  if (!raw) return null
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw
    if (typeof obj !== "object" || obj === null) return null
    const candidate = obj as Record<string, unknown>
    if (!candidate.delegate || !candidate.delegator || !Array.isArray(candidate.caveats)) return null

    const saltHex = typeof candidate.salt === "string" && candidate.salt.startsWith("0x")
      ? (candidate.salt as Hex)
      : toHex(BigInt((candidate.salt as number | string | bigint) ?? 0))

    return {
      delegate: candidate.delegate as Hex,
      delegator: candidate.delegator as Hex,
      authority: (candidate.authority as Hex) ?? "0x0000000000000000000000000000000000000000000000000000000000000000",
      caveats: candidate.caveats as Delegation["caveats"],
      salt: saltHex,
      signature: (candidate.signature as Hex) ?? "0x",
    }
  } catch {
    return null
  }
}

/**
 * Builds the swap calldata (approve + exactInputSingle on SwapRouter02)
 * plus RegentMandate.recordExecution, and encodes DelegationManager.redeemDelegations.
 */
export function buildExecutionCalldata(
  mandate: Mandate,
  route: Route,
  delegation: Delegation,
  overrides?: {
    mandateContract?: Address
    swapRouter?: Address
    usdcAddress?: Address
    wethAddress?: Address
    delegationManagerAddress?: Address
  },
): CalldataBundle {
  const swapRouter = overrides?.swapRouter ?? UNISWAP_SWAP_ROUTER_02_BASE_SEPOLIA
  const usdc = overrides?.usdcAddress ?? BASE_SEPOLIA_USDC
  const weth = overrides?.wethAddress ?? BASE_SEPOLIA_WETH
  const mandateContract = (overrides?.mandateContract ?? (MANDATE_CONTRACT as Address)) || ("0x0000000000000000000000000000000000000000" as Address)

  const env = getSmartAccountsEnvironment(BASE_SEPOLIA_CHAIN_ID)
  const delegationManagerAddress = (overrides?.delegationManagerAddress ?? env.DelegationManager) as Address

  const spendAmount = parseUnits(String(route.inputAmount), 6)
  const receivedAmount = parseUnits(String(route.outputAmount), 18)
  const slippageBps = Math.min(10_000, Math.max(0, Math.round(route.slippage * 100)))

  // 1. Approve USDC on SwapRouter02
  const approveCalldata = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "approve",
    args: [swapRouter, spendAmount],
  })

  // 2. Exact input swap on SwapRouter02
  const recipient = (mandate.smartAccountAddress || mandate.delegatorAddress || delegation.delegator) as Address
  const minReceivedUnits = Math.max(0, route.outputAmount * (1 - route.slippage / 100))
  const amountOutMinimum = parseUnits(minReceivedUnits.toFixed(18), 18)

  const swapCalldata = encodeFunctionData({
    abi: SWAP_ROUTER_ABI,
    functionName: "exactInputSingle",
    args: [
      {
        tokenIn: usdc,
        tokenOut: weth,
        fee: 3000,
        recipient,
        amountIn: spendAmount,
        amountOutMinimum,
        sqrtPriceLimitX96: 0n,
      },
    ],
  })

  // 3. RegentMandate.recordExecution
  const onChainIdHex: Hex = mandate.onChainId && mandate.onChainId.startsWith("0x") && mandate.onChainId.length === 66
    ? (mandate.onChainId as Hex)
    : keccak256(stringToHex(mandate.id))

  const routeRef = keccak256(stringToHex(`${route.dex}:${mandate.id}:${Date.now()}`))

  const recordCalldata = encodeFunctionData({
    abi: REGENT_MANDATE_ABI,
    functionName: "recordExecution",
    args: [onChainIdHex, spendAmount, receivedAmount, slippageBps, routeRef],
  })

  const executions: ExecutionStruct[] = [
    createExecution({ target: usdc, value: 0n, callData: approveCalldata }),
    createExecution({ target: swapRouter, value: 0n, callData: swapCalldata }),
  ]

  if (mandateContract && mandateContract !== "0x0000000000000000000000000000000000000000") {
    executions.push(createExecution({ target: mandateContract, value: 0n, callData: recordCalldata }))
  }

  const redeemCalldata = contracts.DelegationManager.encode.redeemDelegations({
    delegations: [[delegation]],
    modes: [ExecutionMode.BatchDefault],
    executions: [executions],
  })

  return {
    approveCalldata,
    swapCalldata,
    recordCalldata,
    routeRef,
    executions,
    redeemCalldata,
    delegationManagerAddress,
  }
}

export function mapRevertError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)

  if (/BudgetExceeded/i.test(message)) {
    return "Execution reverted: BudgetExceeded (requested spend exceeds remaining budget)"
  }
  if (/SlippageExceeded/i.test(message)) {
    return "Execution reverted: SlippageExceeded (slippage exceeds mandate ceiling)"
  }
  if (/Expired/i.test(message)) {
    return "Execution reverted: Expired (mandate has expired)"
  }
  if (/AlreadyRevoked/i.test(message)) {
    return "Execution reverted: AlreadyRevoked (mandate was revoked)"
  }
  if (/NotAgent/i.test(message)) {
    return "Execution reverted: NotAgent (caller is not the authorized agent for this mandate)"
  }
  if (/NotOwner/i.test(message)) {
    return "Execution reverted: NotOwner (caller is not the mandate owner)"
  }
  if (/Caveat/i.test(message) || /Enforcer/i.test(message) || /ExecutionFailed/i.test(message)) {
    return `Execution reverted by caveat check: ${message}`
  }
  return message
}

export interface ExecuteRouteOptions {
  mode?: ExecutionModeConfig
  walletClient?: {
    sendTransaction: (args: { to: Address; data: Hex; value?: bigint }) => Promise<Hex>
  }
  publicClient?: {
    waitForTransactionReceipt: (args: { hash: Hex }) => Promise<{ status: string; transactionHash: Hex }>
  }
  relayerUrl?: string
  rpcUrl?: string
}

/**
 * Execute the selected route within mandate boundaries.
 * Supports:
 * - "simulated": generates a deterministic/mock execution result
 * - "direct": agent EOA sends redeem tx directly, pays gas
 * - "relayer": 1Shot relayer submission with the real transactions array
 */
export async function executeRoute(
  mandate: Mandate,
  route: Route,
  options?: ExecuteRouteOptions,
): Promise<ExecutionResult> {
  const mode = options?.mode ?? EXECUTION_MODE

  // Spent-aware boundary checks: defense in depth
  const remainingBudget = Math.max(0, mandate.budget - (mandate.spent ?? 0))
  if (route.inputAmount > remainingBudget) {
    logger.info("executor.boundary.refused", {
      mandateId: mandate.id,
      dex: route.dex,
      reason: "budget",
      remainingBudget,
      inputAmount: route.inputAmount,
    })
    return failure("Refused: spend would exceed the remaining mandate budget", mode)
  }

  if (route.slippage > mandate.maxSlippage) {
    logger.info("executor.boundary.refused", {
      mandateId: mandate.id,
      dex: route.dex,
      reason: "slippage",
      maxSlippage: mandate.maxSlippage,
      slippage: route.slippage,
    })
    return failure("Refused: slippage exceeds the mandate ceiling", mode)
  }

  if (mandate.expiry && new Date(mandate.expiry).getTime() <= Date.now()) {
    logger.info("executor.boundary.refused", {
      mandateId: mandate.id,
      dex: route.dex,
      reason: "expiry",
      expiry: mandate.expiry,
    })
    return failure("Refused: mandate has expired", mode)
  }

  if (mode === "simulated") {
    return simulate(route)
  }

  const delegation = parseDelegation(mandate.delegation)
  if (!delegation) {
    return failure("Missing or invalid signed delegation in mandate for execution", mode)
  }

  const bundle = buildExecutionCalldata(mandate, route, delegation)
  const rpcUrl = options?.rpcUrl ?? RPC_URL

  if (mode === "direct") {
    try {
      let txHash: Hex

      if (options?.walletClient) {
        txHash = await options.walletClient.sendTransaction({
          to: bundle.delegationManagerAddress,
          data: bundle.redeemCalldata,
          value: 0n,
        })
      } else {
        if (!AGENT_PRIVATE_KEY) {
          return failure("AGENT_PRIVATE_KEY is required for direct execution mode", "direct")
        }
        const account = privateKeyToAccount(AGENT_PRIVATE_KEY as Hex)
        const walletClient = createWalletClient({
          account,
          chain: baseSepolia,
          transport: http(rpcUrl),
        })
        txHash = await walletClient.sendTransaction({
          account,
          to: bundle.delegationManagerAddress,
          data: bundle.redeemCalldata,
          value: 0n,
        })
      }

      const publicClient = options?.publicClient ?? createPublicClient({
        chain: baseSepolia,
        transport: http(rpcUrl),
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
      if (receipt.status !== "success") {
        throw new Error(`Transaction reverted on-chain: ${receipt.transactionHash}`)
      }

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        txHash: receipt.transactionHash,
        spentAmount: route.inputAmount,
        receivedAmount: route.outputAmount,
        feeAmount: route.fee,
        source: "direct",
      }
    } catch (error) {
      logger.error("executor.direct.failed", {
        mandateId: mandate.id,
        error: error instanceof Error ? error.message : String(error),
      })
      return failure(mapRevertError(error), "direct")
    }
  }

  // Relayer mode (1Shot)
  try {
    const relayerUrl = options?.relayerUrl ?? ONE_SHOT_RELAYER_URL
    const response = await fetch(relayerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "relayer_send7710Transaction",
        params: {
          chainId: String(BASE_SEPOLIA_CHAIN_ID),
          transactions: [
            {
              to: bundle.delegationManagerAddress,
              data: bundle.redeemCalldata,
              value: "0x0",
            },
          ],
          metadata: {
            mandateId: mandate.id,
            mandateContract: MANDATE_CONTRACT,
            delegationHash: mandate.delegationHash,
            route: route.dex,
          },
        },
      }),
    })

    const data = (await response.json()) as {
      result?: { transactionHash?: string; txHash?: string; taskId?: string }
      error?: { message?: string }
    }

    if (data.error) throw new Error(data.error.message ?? "Relayer error")

    const txHash = data.result?.transactionHash || data.result?.txHash
    const taskId = data.result?.taskId

    if (txHash && options?.publicClient) {
      const receipt = await options.publicClient.waitForTransactionReceipt({ hash: txHash as Hex })
      if (receipt.status !== "success") {
        throw new Error(`Transaction reverted on-chain: ${receipt.transactionHash}`)
      }
    }

    return {
      success: true,
      transactionHash: txHash,
      txHash,
      taskId,
      spentAmount: route.inputAmount,
      receivedAmount: route.outputAmount,
      feeAmount: route.fee,
      source: "relayer",
    }
  } catch (error) {
    logger.error("executor.relayer.failed", {
      mandateId: mandate.id,
      dex: route.dex,
      error: error instanceof Error ? error.message : String(error),
    })
    return failure(mapRevertError(error), "relayer")
  }
}

function simulate(route: Route): ExecutionResult {
  const hash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
  return {
    success: true,
    transactionHash: hash,
    txHash: hash,
    taskId: randomUUID(),
    spentAmount: route.inputAmount,
    receivedAmount: route.outputAmount,
    feeAmount: route.fee,
    source: "simulated",
  }
}

function failure(error: string, source: ExecutionSource = "simulated"): ExecutionResult {
  return {
    success: false,
    spentAmount: 0,
    receivedAmount: 0,
    feeAmount: 0,
    error,
    source,
  }
}

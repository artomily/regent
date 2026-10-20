// Wire types shared with frontend/src/lib/types.ts — keep the two in sync.

export interface Mandate {
  id: string
  goal: string
  budget: number
  maxSlippage: number
  targetAsset: string
  sourceAsset: string
  expiry: string
  spent?: number
  smartAccountAddress?: string
  delegation?: unknown
  delegatorAddress?: string
  delegationHash?: string
  onChainId?: string
}

export interface Route {
  dex: string
  inputAmount: number
  outputAmount: number
  slippage: number
  fee: number
  executionPrice: number
  simulated?: boolean
}

export type DecisionSource = "venice" | "heuristic"

export interface AgentDecision {
  selectedRoute: Route | null
  reasoning: string
  withinBudget: boolean
  withinSlippage: boolean
  allRoutes: Route[]
  source: DecisionSource
}

export type ExecutionSource = "direct" | "relayer" | "simulated"

export interface ExecutionResult {
  success: boolean
  transactionHash?: string
  txHash?: string
  spentAmount: number
  receivedAmount: number
  feeAmount: number
  error?: string
  taskId?: string
  source: ExecutionSource
}

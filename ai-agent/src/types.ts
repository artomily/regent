// Wire types shared with frontend/src/lib/types.ts — keep the two in sync.

export interface Mandate {
  id: string
  goal: string
  budget: number
  maxSlippage: number
  targetAsset: string
  sourceAsset: string
  expiry: string
  delegatorAddress?: string
  delegationHash?: string
}

export interface Route {
  dex: string
  inputAmount: number
  outputAmount: number
  slippage: number
  fee: number
  executionPrice: number
}

export interface AgentDecision {
  selectedRoute: Route | null
  reasoning: string
  withinBudget: boolean
  withinSlippage: boolean
  allRoutes: Route[]
  source: "venice" | "heuristic"
}

export interface ExecutionResult {
  success: boolean
  transactionHash?: string
  spentAmount: number
  receivedAmount: number
  feeAmount: number
  error?: string
  taskId?: string
  source: "relayer" | "simulated"
}

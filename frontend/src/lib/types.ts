import type { Hex } from "viem"

export type MandateStatus =
  | "pending"
  | "authorized"
  | "active"
  | "executing"
  | "completed"
  | "rejected"
  | "revoked"

export interface Mandate {
  id: string
  goal: string
  budget: number
  maxSlippage: number
  targetAsset: string
  sourceAsset: string
  expiry: string
  status: MandateStatus
  createdAt: number
  spent: number
  delegatorAddress?: Hex
  delegationHash?: Hex
}

export type AgentStep =
  | "mandate_created"
  | "awaiting_permission"
  | "permission_granted"
  | "scanning_routes"
  | "comparing_prices"
  | "evaluating_slippage"
  | "making_decision"
  | "executing_swap"
  | "confirming_transaction"
  | "mandate_revoked"

export interface ActivityEvent {
  id: string
  mandateId: string
  step: AgentStep | string
  message: string
  timestamp: number
  metadata?: Record<string, unknown>
}

export interface Route {
  dex: string
  inputAmount: number
  outputAmount: number
  slippage: number
  fee: number
  executionPrice: number
}

export type DecisionSource = "venice" | "heuristic" | "simulated"
export type ExecutionSource = "relayer" | "simulated"

export interface AgentDecision {
  selectedRoute: Route | null
  reasoning: string
  withinBudget: boolean
  withinSlippage: boolean
  allRoutes: Route[]
  source: DecisionSource
}

export interface ExecutionResult {
  success: boolean
  transactionHash?: Hex
  spentAmount: number
  receivedAmount: number
  feeAmount: number
  error?: string
  taskId?: string
  source: ExecutionSource
}

export interface AgentHealth {
  ok: boolean
  service?: string
  uptimeSeconds?: number
  mode: {
    intelligence: "venice" | "heuristic" | "simulated"
    execution: "relayer" | "simulated"
  }
}

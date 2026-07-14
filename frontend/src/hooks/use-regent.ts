"use client"

import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import type { Hex } from "viem"
import { addActivity, getActivityForMandate } from "@/lib/activity"
import { fetchAgentHealth, requestEvaluation, requestExecution } from "@/lib/agent-client"
import { isOnChainEnabled, registerMandateOnChain } from "@/lib/contract"
import {
  checkBudget,
  checkSlippage,
  createMandate,
  getAllMandates,
  getMandate,
  recordSpend,
  updateMandateDelegation,
  updateMandateStatus,
  validateMandate,
} from "@/lib/mandate-engine"
import type { AgentDecision, AgentHealth, ActivityEvent, ExecutionResult, Mandate } from "@/lib/types"
import { connectWallet, ensureBaseMainnet, hasInjectedWallet, signMandateAuthorization } from "@/lib/wallet"

const ACTIVE_KEY = "regent_active_view"
const DECISION_KEY = "regent_last_decision"
const RESULT_KEY = "regent_last_result"

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function readJson<T>(key: string): T | null {
  const raw = localStorage.getItem(key)
  return raw ? (JSON.parse(raw) as T) : null
}

const isServer = () => typeof window === "undefined"
const subscribeNoop = () => () => {}

function initialActive(): Mandate | null {
  if (isServer()) return null
  const activeId = localStorage.getItem(ACTIVE_KEY)
  return activeId ? getMandate(activeId) : null
}

export function useRegent() {
  // False during SSR and the hydration render, true right after — lets pages
  // render a stable skeleton while the lazy initializers below read storage.
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )

  const [walletAddress, setWalletAddress] = useState<Hex | null>(null)
  const [mandates, setMandates] = useState<Mandate[]>(() => (isServer() ? [] : getAllMandates()))
  const [activeMandate, setActiveMandate] = useState<Mandate | null>(initialActive)
  const [activityLog, setActivityLog] = useState<ActivityEvent[]>(() => {
    const active = initialActive()
    return active ? getActivityForMandate(active.id) : []
  })
  const [decision, setDecision] = useState<AgentDecision | null>(() => {
    const active = initialActive()
    if (!active) return null
    const saved = readJson<{ mandateId: string; decision: AgentDecision }>(DECISION_KEY)
    return saved?.mandateId === active.id ? saved.decision : null
  })
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(() => {
    const active = initialActive()
    if (!active) return null
    const saved = readJson<{ mandateId: string; result: ExecutionResult }>(RESULT_KEY)
    return saved?.mandateId === active.id ? saved.result : null
  })
  const [isAgentRunning, setIsAgentRunning] = useState(false)
  const [agentHealth, setAgentHealth] = useState<AgentHealth | null>(null)

  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      const health = await fetchAgentHealth()
      if (!cancelled) setAgentHealth(health)
    }
    poll()
    const interval = setInterval(poll, 15_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const refresh = useCallback((mandateId?: string) => {
    setMandates(getAllMandates())
    if (mandateId) {
      setActiveMandate(getMandate(mandateId))
      setActivityLog(getActivityForMandate(mandateId))
    }
  }, [])

  const connect = useCallback(async () => {
    if (!hasInjectedWallet()) {
      throw new Error("No wallet detected. Install MetaMask, or continue without connecting a wallet.")
    }
    const address = await connectWallet()
    if (!address) return null
    await ensureBaseMainnet().catch(() => {
      // Wrong network is tolerable in demo mode; surfaced via the header pill.
    })
    setWalletAddress(address)
    return address
  }, [])

  const create = useCallback(
    async (params: {
      goal: string
      budget: number
      maxSlippage: number
      targetAsset: string
      sourceAsset: string
      expiry: string
    }) => {
      const draft: Mandate = { id: "draft", status: "pending", createdAt: Date.now(), spent: 0, ...params }
      const validation = validateMandate(draft)
      if (!validation.valid) throw new Error(validation.reason)

      const mandate = createMandate(params)
      localStorage.setItem(ACTIVE_KEY, mandate.id)
      localStorage.removeItem(DECISION_KEY)
      localStorage.removeItem(RESULT_KEY)
      setDecision(null)
      setExecutionResult(null)

      addActivity(mandate.id, "mandate_created", `Mandate created: ${mandate.goal}`)
      addActivity(mandate.id, "awaiting_permission", "Waiting for the owner to authorize Regent…")
      refresh(mandate.id)
      return mandate
    },
    [refresh],
  )

  const authorize = useCallback(
    async (mandateId: string) => {
      const mandate = getMandate(mandateId)
      if (!mandate) throw new Error("Mandate not found")

      if (walletAddress) {
        const signature = await signMandateAuthorization(mandate, walletAddress)
        updateMandateDelegation(mandateId, { delegatorAddress: walletAddress, delegationHash: signature })
        addActivity(mandateId, "permission_granted", "Mandate boundaries signed (EIP-712).", {
          delegationHash: signature,
        })

        if (isOnChainEnabled()) {
          const txHash = await registerMandateOnChain(mandate, walletAddress)
          addActivity(mandateId, "permission_granted", "Mandate registered on RegentMandate (Base).", {
            transactionHash: txHash,
          })
        }
      } else {
        await wait(900)
        addActivity(
          mandateId,
          "permission_granted",
          "Authorization simulated — connect a wallet for a real signature.",
        )
      }

      updateMandateStatus(mandateId, "authorized")
      addActivity(mandateId, "permission_granted", "Regent is authorized to act within the mandate boundaries.")
      refresh(mandateId)
    },
    [refresh, walletAddress],
  )

  // Step 1 of 2: scan routes and get a decision. Stops there — execution is
  // a separate, explicit step (executeAgent) so nothing spends without a
  // second confirmation once the agent has picked a route.
  const evaluateAgent = useCallback(
    async (mandateId: string) => {
      const mandate = getMandate(mandateId)
      if (!mandate || isAgentRunning) return

      setIsAgentRunning(true)
      setExecutionResult(null)
      setDecision(null)
      localStorage.removeItem(RESULT_KEY)

      try {
        updateMandateStatus(mandateId, "active")
        addActivity(mandateId, "scanning_routes", "Scanning DEX routes on Base…")
        refresh(mandateId)
        await wait(700)

        addActivity(mandateId, "comparing_prices", "Comparing execution prices across venues…")
        refresh(mandateId)
        await wait(700)

        addActivity(mandateId, "evaluating_slippage", "Evaluating slippage against the mandate ceiling…")
        refresh(mandateId)
        await wait(500)

        const verdict = await requestEvaluation(mandate)
        setDecision(verdict)
        localStorage.setItem(DECISION_KEY, JSON.stringify({ mandateId, decision: verdict }))

        if (!verdict.selectedRoute) {
          addActivity(mandateId, "making_decision", verdict.reasoning, { source: verdict.source })
          updateMandateStatus(mandateId, "rejected")
          refresh(mandateId)
          return
        }

        addActivity(
          mandateId,
          "making_decision",
          `Route selected — ${verdict.selectedRoute.dex}: ${verdict.selectedRoute.inputAmount} ${mandate.sourceAsset} → ${verdict.selectedRoute.outputAmount} ${mandate.targetAsset}. Awaiting execution.`,
          { source: verdict.source },
        )
        refresh(mandateId)
      } catch (error) {
        addActivity(
          mandateId,
          "making_decision",
          error instanceof Error ? error.message : "Evaluation failed.",
        )
        updateMandateStatus(mandateId, "rejected")
        refresh(mandateId)
      } finally {
        setIsAgentRunning(false)
      }
    },
    [isAgentRunning, refresh],
  )

  // Step 2 of 2: the user has seen the chosen route and explicitly confirms.
  // Boundaries are re-checked here too — the mandate is law regardless of
  // what was decided a moment ago.
  const executeAgent = useCallback(
    async (mandateId: string) => {
      const mandate = getMandate(mandateId)
      if (!mandate || !decision?.selectedRoute || isAgentRunning) return
      const route = decision.selectedRoute

      setIsAgentRunning(true)
      try {
        if (!checkBudget(mandate, route.inputAmount)) {
          addActivity(mandateId, "making_decision", "Rejected: the spend would exceed the remaining budget.")
          updateMandateStatus(mandateId, "rejected")
          refresh(mandateId)
          return
        }
        if (!checkSlippage(mandate, route.slippage)) {
          addActivity(mandateId, "making_decision", "Rejected: slippage exceeds the mandate ceiling.")
          updateMandateStatus(mandateId, "rejected")
          refresh(mandateId)
          return
        }

        updateMandateStatus(mandateId, "executing")
        addActivity(mandateId, "executing_swap", `Executing on ${route.dex} via 1Shot relayer…`)
        refresh(mandateId)

        const result = await requestExecution(mandate, route)
        setExecutionResult(result)
        localStorage.setItem(RESULT_KEY, JSON.stringify({ mandateId, result }))

        if (result.success) {
          recordSpend(mandateId, result.spentAmount)
          updateMandateStatus(mandateId, "completed")
          addActivity(
            mandateId,
            "confirming_transaction",
            `Confirmed. Spent ${result.spentAmount} ${mandate.sourceAsset}, received ${result.receivedAmount} ${mandate.targetAsset}.`,
            { transactionHash: result.transactionHash, source: result.source },
          )
        } else {
          updateMandateStatus(mandateId, "rejected")
          addActivity(mandateId, "confirming_transaction", result.error ?? "Execution failed.")
        }
        refresh(mandateId)
      } finally {
        setIsAgentRunning(false)
      }
    },
    [decision, isAgentRunning, refresh],
  )

  const revoke = useCallback(
    (mandateId: string) => {
      updateMandateStatus(mandateId, "revoked")
      addActivity(mandateId, "mandate_revoked", "Mandate revoked by the owner. Regent's authority has ended.")
      refresh(mandateId)
    },
    [refresh],
  )

  const reset = useCallback(() => {
    localStorage.removeItem(ACTIVE_KEY)
    localStorage.removeItem(DECISION_KEY)
    localStorage.removeItem(RESULT_KEY)
    setActiveMandate(null)
    setActivityLog([])
    setDecision(null)
    setExecutionResult(null)
    setMandates(getAllMandates())
  }, [])

  const viewMandate = useCallback(
    (mandateId: string) => {
      localStorage.setItem(ACTIVE_KEY, mandateId)
      setDecision(null)
      setExecutionResult(null)
      const savedDecision = readJson<{ mandateId: string; decision: AgentDecision }>(DECISION_KEY)
      if (savedDecision?.mandateId === mandateId) setDecision(savedDecision.decision)
      const savedResult = readJson<{ mandateId: string; result: ExecutionResult }>(RESULT_KEY)
      if (savedResult?.mandateId === mandateId) setExecutionResult(savedResult.result)
      refresh(mandateId)
    },
    [refresh],
  )

  return {
    hydrated,
    walletAddress,
    mandates,
    activeMandate,
    activityLog,
    decision,
    executionResult,
    isAgentRunning,
    agentHealth,
    connect,
    createMandate: create,
    authorizeMandate: authorize,
    evaluateAgent,
    executeAgent,
    revokeMandate: revoke,
    resetAgent: reset,
    viewMandate,
  }
}

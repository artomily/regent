"use client"

import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import type { Hex } from "viem"
import { addActivity, getActivityForMandate } from "@/lib/activity"
import { fetchAgentHealth, requestEvaluation, requestExecution } from "@/lib/agent-client"
import { signMandateAuth } from "@/lib/auth"
import {
  disableDelegationOnChain,
  isOnChainEnabled,
  registerMandateOnChain,
  revokeMandateOnChain,
} from "@/lib/contract"
import {
  buildMandateDelegations,
  signMandateDelegations,
} from "@/lib/delegation"
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
import {
  connectWallet,
  createMetaMaskSmartAccount,
  deploySmartAccountIfNeeded,
  disconnectWallet,
  ensureBaseSepolia,
  getPersistedWalletAddress,
  getUSDCBalance,
  hasInjectedWallet,
  setupWalletListeners,
  signMandateAuthorization,
  transferUSDCToSmartAccount,
} from "@/lib/wallet"
import { AGENT_ADDRESS, MANDATE_CONTRACT } from "@/lib/constants"

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

function initialActive(focusMandateId?: string): Mandate | null {
  if (isServer()) return null
  // A detail page pins its own mandate; the dashboard falls back to the last one viewed.
  const activeId = focusMandateId ?? localStorage.getItem(ACTIVE_KEY)
  return activeId ? getMandate(activeId) : null
}

export function useRegent({ focusMandateId }: { focusMandateId?: string } = {}) {
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )

  const [walletAddress, setWalletAddress] = useState<Hex | null>(() =>
    isServer() ? null : getPersistedWalletAddress(),
  )
  const [smartAccountAddress, setSmartAccountAddress] = useState<Hex | null>(null)
  const [isSmartAccountDeployed, setIsSmartAccountDeployed] = useState(false)
  const [smartAccountUSDCBalance, setSmartAccountUSDCBalance] = useState<number | null>(null)

  const [mandates, setMandates] = useState<Mandate[]>(() => (isServer() ? [] : getAllMandates()))
  const [activeMandate, setActiveMandate] = useState<Mandate | null>(() => initialActive(focusMandateId))
  const [activityLog, setActivityLog] = useState<ActivityEvent[]>(() => {
    const active = initialActive(focusMandateId)
    return active ? getActivityForMandate(active.id) : []
  })
  const [decision, setDecision] = useState<AgentDecision | null>(() => {
    const active = initialActive(focusMandateId)
    if (!active) return null
    const saved = readJson<{ mandateId: string; decision: AgentDecision }>(DECISION_KEY)
    return saved?.mandateId === active.id ? saved.decision : null
  })
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(() => {
    const active = initialActive(focusMandateId)
    if (!active) return null
    const saved = readJson<{ mandateId: string; result: ExecutionResult }>(RESULT_KEY)
    return saved?.mandateId === active.id ? saved.result : null
  })
  const [isAgentRunning, setIsAgentRunning] = useState(false)
  const [agentHealth, setAgentHealth] = useState<AgentHealth | null>(null)

  const refreshSmartAccountBalance = useCallback(async (): Promise<number | null> => {
    if (!smartAccountAddress) return null
    try {
      const { formatted } = await getUSDCBalance(smartAccountAddress)
      setSmartAccountUSDCBalance(formatted)
      return formatted
    } catch (err) {
      console.warn("Failed to query smart account USDC balance:", err)
      return null
    }
  }, [smartAccountAddress])

  // Derive smart account address and fetch USDC balance when wallet address changes
  useEffect(() => {
    if (!walletAddress) return

    let active = true
    createMetaMaskSmartAccount(walletAddress)
      .then(async (sa) => {
        if (!active) return
        setSmartAccountAddress(sa.address)
        const deployed = await sa.isDeployed()
        if (active) setIsSmartAccountDeployed(deployed)

        const { formatted } = await getUSDCBalance(sa.address)
        if (active) setSmartAccountUSDCBalance(formatted)
      })
      .catch((err) => {
        console.warn("Failed to compute smart account address:", err)
      })

    return () => {
      active = false
    }
  }, [walletAddress])

  const fundSmartAccount = useCallback(
    async (amountUSDC: number): Promise<Hex> => {
      if (!walletAddress) throw new Error("Wallet not connected")
      const sa = smartAccountAddress ?? (await createMetaMaskSmartAccount(walletAddress)).address
      const txHash = await transferUSDCToSmartAccount(walletAddress, sa, amountUSDC)
      await refreshSmartAccountBalance()
      return txHash
    },
    [refreshSmartAccountBalance, smartAccountAddress, walletAddress],
  )

  const activeSmartAccountAddress = walletAddress ? smartAccountAddress : null
  const activeSmartAccountDeployed = walletAddress ? isSmartAccountDeployed : false

  // Wallet listeners
  useEffect(() => {
    const cleanup = setupWalletListeners(
      (newAccount) => {
        setWalletAddress(newAccount)
        if (!newAccount) {
          setSmartAccountAddress(null)
          setIsSmartAccountDeployed(false)
          setSmartAccountUSDCBalance(null)
        }
      },
      () => {
        // Chain changed
      },
    )
    return cleanup
  }, [])

  // Agent health polling
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
    await ensureBaseSepolia().catch(() => {})
    setWalletAddress(address)
    return address
  }, [])

  const disconnect = useCallback(() => {
    disconnectWallet()
    setWalletAddress(null)
    setSmartAccountAddress(null)
    setIsSmartAccountDeployed(false)
    setSmartAccountUSDCBalance(null)
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

      if (walletAddress) {
        signMandateAuth({
          action: "create",
          mandateId: mandate.id,
          owner: walletAddress,
        })
          .then((auth) =>
            fetch("/api/mandates", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ mandate, ownerAddress: walletAddress, auth }),
            }),
          )
          .catch(() => {})
      }

      return mandate
    },
    [refresh, walletAddress],
  )

  const authorize = useCallback(
    async (mandateId: string) => {
      const mandate = getMandate(mandateId)
      if (!mandate) throw new Error("Mandate not found")

      if (walletAddress) {
        // 1. Create MetaMask Smart Account
        const smartAccount = await createMetaMaskSmartAccount(walletAddress)
        setSmartAccountAddress(smartAccount.address)

        // 2. Deploy smart account on first use if needed
        try {
          const deployTx = await deploySmartAccountIfNeeded(smartAccount, walletAddress)
          if (deployTx) {
            setIsSmartAccountDeployed(true)
            addActivity(mandateId, "permission_granted", "MetaMask Smart Account deployed on Base Sepolia.", {
              transactionHash: deployTx,
            })
          }
        } catch (e) {
          console.warn("Smart account deployment check failed or skipped:", e)
        }

        // 3. Build & sign ERC-7710 delegations with caveats (approve + swap)
        const rawDelegations = buildMandateDelegations({
          smartAccountAddress: smartAccount.address,
          agentAddress: AGENT_ADDRESS || undefined,
          mandate,
          mandateContractAddress: MANDATE_CONTRACT ? (MANDATE_CONTRACT as Hex) : undefined,
        })

        const signedDelegations = await signMandateDelegations(smartAccount, rawDelegations)
        addActivity(mandateId, "permission_granted", "ERC-7710 delegations (approve + swap) signed by Smart Account.", {
          delegationHash: signedDelegations.swap.signature,
        })

        let onChainId: Hex | undefined
        let txHash: Hex | undefined

        // 4. On-chain mandate registration on RegentMandate
        if (isOnChainEnabled()) {
          const registered = await registerMandateOnChain(mandate, walletAddress)
          onChainId = registered.onChainId
          txHash = registered.txHash
          addActivity(mandateId, "permission_granted", "Mandate registered on RegentMandate (Base Sepolia).", {
            transactionHash: txHash,
            onChainId,
          })
        }

        // Update local mandate record
        const updated = updateMandateDelegation(mandateId, {
          delegatorAddress: walletAddress,
          delegationHash: signedDelegations.swap.signature,
          smartAccountAddress: smartAccount.address,
          onChainId,
          delegation: signedDelegations.swap,
          delegations: signedDelegations,
          txHash,
        })

        // Sync with database API
        if (updated) {
          signMandateAuth({
            action: "create",
            mandateId: updated.id,
            owner: walletAddress,
          })
            .then((auth) =>
              fetch("/api/mandates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mandate: updated, ownerAddress: walletAddress, auth }),
              }),
            )
            .catch(() => {})
        }
      } else {
        await wait(900)
        // Fallback authorization for demo/simulation without wallet
        const signature = await signMandateAuthorization(mandate, "0x0000000000000000000000000000000000000000" as Hex).catch(
          () => "0x" as Hex,
        )
        updateMandateDelegation(mandateId, {
          delegatorAddress: "0x0000000000000000000000000000000000000000" as Hex,
          delegationHash: signature,
        })
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
        addActivity(mandateId, "scanning_routes", "Scanning DEX routes on Base Sepolia…")
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
          if (walletAddress) {
            signMandateAuth({
              action: "update",
              mandateId,
              owner: walletAddress,
            })
              .then((auth) =>
                fetch("/api/mandates", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    id: mandateId,
                    status: "completed",
                    spent: mandate.spent + result.spentAmount,
                    txHash: result.transactionHash,
                    ownerAddress: walletAddress,
                    auth,
                  }),
                }),
              )
              .catch(() => {})
          }
        } else {
          updateMandateStatus(mandateId, "rejected")
          addActivity(mandateId, "confirming_transaction", result.error ?? "Execution failed.")
        }
        refresh(mandateId)
      } finally {
        setIsAgentRunning(false)
      }
    },
    [decision, isAgentRunning, refresh, walletAddress],
  )

  const revoke = useCallback(
    async (mandateId: string) => {
      const mandate = getMandate(mandateId)
      if (mandate && walletAddress) {
        if (isOnChainEnabled() && mandate.onChainId) {
          await revokeMandateOnChain(mandate.onChainId, walletAddress).catch((err) => {
            console.warn("Failed to revoke mandate on-chain:", err)
          })
          addActivity(
            mandateId,
            "mandate_revoked",
            "On-chain mandate registry status set to Revoked on RegentMandate.",
          )
        }

        if (mandate.delegations || mandate.delegation) {
          const res = await disableDelegationOnChain(
            (mandate.delegations || mandate.delegation) as Parameters<typeof disableDelegationOnChain>[0],
            walletAddress,
          ).catch((err) => {
            console.warn("Failed to disable delegation on-chain:", err)
            return null
          })
          if (res?.disabledOnChain) {
            addActivity(
              mandateId,
              "mandate_revoked",
              "ERC-7710 delegations disabled via Smart Account UserOp in DelegationManager.",
            )
          } else if (res?.message) {
            addActivity(mandateId, "mandate_revoked", res.message)
          }
        }

        if (walletAddress) {
          signMandateAuth({
            action: "update",
            mandateId,
            owner: walletAddress,
          })
            .then((auth) =>
              fetch("/api/mandates", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: mandateId, status: "revoked", ownerAddress: walletAddress, auth }),
              }),
            )
            .catch(() => {})
        }
      }

      updateMandateStatus(mandateId, "revoked")
      addActivity(mandateId, "mandate_revoked", "Mandate revoked by the owner. Regent's authority has ended.")
      refresh(mandateId)
    },
    [refresh, walletAddress],
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

  const isLive = isOnChainEnabled() && Boolean(walletAddress)
  const mode: "live" | "demo" = isLive ? "live" : "demo"

  return {
    hydrated,
    walletAddress,
    smartAccountAddress: activeSmartAccountAddress,
    isSmartAccountDeployed: activeSmartAccountDeployed,
    smartAccountUSDCBalance,
    refreshSmartAccountBalance,
    fundSmartAccount,
    isOnChain: isOnChainEnabled(),
    mode,
    mandates,
    activeMandate,
    activityLog,
    decision,
    executionResult,
    isAgentRunning,
    agentHealth,
    connect,
    disconnect,
    createMandate: create,
    authorizeMandate: authorize,
    evaluateAgent,
    executeAgent,
    revokeMandate: revoke,
    resetAgent: reset,
    viewMandate,
  }
}

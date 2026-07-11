// Browser-side client for the agent. Talks to the Next.js /api/agent/* proxy,
// which forwards to the ai-agent service and falls back to the in-process
// simulator — callers never need to know which one answered.

import type { AgentDecision, AgentHealth, ExecutionResult, Mandate, Route } from "./types"
import { getVeniceApiKey } from "./venice-key"

export async function fetchAgentHealth(): Promise<AgentHealth> {
  try {
    const res = await fetch("/api/agent/health", { cache: "no-store" })
    return (await res.json()) as AgentHealth
  } catch {
    return { ok: false, mode: { intelligence: "simulated", execution: "simulated" } }
  }
}

export async function requestEvaluation(mandate: Mandate): Promise<AgentDecision> {
  const veniceApiKey = getVeniceApiKey()
  const res = await fetch("/api/agent/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mandate, ...(veniceApiKey ? { veniceApiKey } : {}) }),
  })
  const data = (await res.json().catch(() => ({}))) as { decision?: AgentDecision; error?: string }
  if (!res.ok || !data.decision) throw new Error(data.error ?? `Evaluation failed (${res.status})`)
  return data.decision
}

export async function requestExecution(mandate: Mandate, route: Route): Promise<ExecutionResult> {
  const res = await fetch("/api/agent/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mandate, route }),
  })
  if (!res.ok) throw new Error(`Execution failed (${res.status})`)
  const data = (await res.json()) as { result: ExecutionResult }
  return data.result
}

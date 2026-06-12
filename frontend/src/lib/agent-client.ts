// Browser-side client for the agent. Talks to the Next.js /api/agent/* proxy,
// which forwards to the ai-agent service and falls back to the in-process
// simulator — callers never need to know which one answered.

import type { AgentDecision, AgentHealth, ExecutionResult, Mandate, Route } from "./types"

export async function fetchAgentHealth(): Promise<AgentHealth> {
  try {
    const res = await fetch("/api/agent/health", { cache: "no-store" })
    return (await res.json()) as AgentHealth
  } catch {
    return { ok: false, mode: { intelligence: "simulated", execution: "simulated" } }
  }
}

export async function requestEvaluation(mandate: Mandate): Promise<AgentDecision> {
  const res = await fetch("/api/agent/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mandate }),
  })
  if (!res.ok) throw new Error(`Evaluation failed (${res.status})`)
  const data = (await res.json()) as { decision: AgentDecision }
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

import { NextResponse } from "next/server"
import { simulateDecision, simulateQuotes } from "@/lib/simulator"
import type { Mandate } from "@/lib/types"

const AGENT_URL = process.env.AGENT_URL ?? "http://43.133.146.186:8000"

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { mandate?: Mandate; veniceApiKey?: string } | null
  const mandate = body?.mandate
  if (!mandate?.id || !Number.isFinite(mandate.budget) || mandate.budget <= 0) {
    return NextResponse.json({ error: "Invalid mandate payload" }, { status: 400 })
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  // Forwarded straight through to the agent for this one call — never stored server-side.
  if (body?.veniceApiKey) headers["X-Venice-Api-Key"] = body.veniceApiKey

  let res: Response
  try {
    res = await fetch(`${AGENT_URL}/evaluate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ mandate }),
      signal: AbortSignal.timeout(25_000),
    })
  } catch {
    // The agent service itself is unreachable — fall back so the demo never hard-fails.
    return NextResponse.json({ decision: simulateDecision(mandate, simulateQuotes(mandate)) })
  }

  const data = await res.json().catch(() => ({}))
  // The agent responded but refused the request (e.g. no Venice key) — surface that
  // verbatim instead of papering over it with a fake simulated decision.
  if (!res.ok) return NextResponse.json(data, { status: res.status })
  return NextResponse.json(data)
}

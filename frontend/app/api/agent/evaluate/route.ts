import { NextResponse } from "next/server"
import { simulateDecision, simulateQuotes } from "@/lib/simulator"
import type { Mandate } from "@/lib/types"

const AGENT_URL = process.env.AGENT_URL ?? "http://localhost:4801"

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { mandate?: Mandate } | null
  const mandate = body?.mandate
  if (!mandate?.id || !Number.isFinite(mandate.budget) || mandate.budget <= 0) {
    return NextResponse.json({ error: "Invalid mandate payload" }, { status: 400 })
  }

  try {
    const res = await fetch(`${AGENT_URL}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mandate }),
      signal: AbortSignal.timeout(25_000),
    })
    if (!res.ok) throw new Error(`Agent responded ${res.status}`)
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ decision: simulateDecision(mandate, simulateQuotes(mandate)) })
  }
}

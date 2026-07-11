import { NextResponse } from "next/server"
import { simulateExecution } from "@/lib/simulator"
import type { Mandate, Route } from "@/lib/types"

const AGENT_URL = process.env.AGENT_URL ?? "http://43.133.146.186:8000"

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { mandate?: Mandate; route?: Route } | null
  if (!body?.mandate?.id || !body.route?.dex) {
    return NextResponse.json({ error: "Invalid execution payload" }, { status: 400 })
  }

  try {
    const res = await fetch(`${AGENT_URL}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mandate: body.mandate, route: body.route }),
      signal: AbortSignal.timeout(35_000),
    })
    if (!res.ok) throw new Error(`Agent responded ${res.status}`)
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ result: simulateExecution(body.mandate, body.route) })
  }
}

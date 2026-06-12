import { NextResponse } from "next/server"

const AGENT_URL = process.env.AGENT_URL ?? "http://localhost:4801"

export async function GET() {
  try {
    const res = await fetch(`${AGENT_URL}/health`, {
      signal: AbortSignal.timeout(1500),
      cache: "no-store",
    })
    if (!res.ok) throw new Error(`Agent responded ${res.status}`)
    return NextResponse.json(await res.json())
  } catch {
    // Agent service offline — the proxy routes fall back to the simulator.
    return NextResponse.json({
      ok: false,
      mode: { intelligence: "simulated", execution: "simulated" },
    })
  }
}

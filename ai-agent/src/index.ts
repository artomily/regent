import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import {
  AGENT_API_TOKEN,
  ALLOWED_ORIGIN,
  EXECUTION_MODE,
  LIVE_EXECUTION,
  PORT,
  VENICE_API_KEY,
} from "./config.ts"
import { saveDecision, saveExecution } from "./db.ts"
import { executeRoute } from "./executor.ts"
import { fetchQuotes } from "./quotes.ts"
import { checkRateLimit } from "./rate-limit.ts"
import type { Mandate, Route } from "./types.ts"
import { evaluateRoutes, VeniceKeyRequiredError } from "./venice.ts"

const startedAt = Date.now()

export const server = createServer(async (req, res) => {
  // Restrict CORS to ALLOWED_ORIGIN
  const requestOrigin = req.headers.origin
  const allowedOriginHeader = !requestOrigin || requestOrigin === ALLOWED_ORIGIN
    ? (requestOrigin ?? ALLOWED_ORIGIN)
    : ALLOWED_ORIGIN

  res.setHeader("Access-Control-Allow-Origin", allowedOriginHeader)
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Venice-Api-Key, Authorization, X-Agent-Api-Token")

  if (req.method === "OPTIONS") return res.writeHead(204).end()

  // Optional shared secret authentication
  if (AGENT_API_TOKEN) {
    const authHeader = req.headers["authorization"]
    const tokenHeader = req.headers["x-agent-api-token"]
    const bearer = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : undefined
    const token = typeof tokenHeader === "string" ? tokenHeader : bearer

    if (token !== AGENT_API_TOKEN) {
      return json(res, 401, { error: "Unauthorized: invalid or missing agent API token" })
    }
  }

  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`)
  const clientId = clientIdFor(req)
  const rateLimit = checkRateLimit(clientId, url.pathname)
  if (!rateLimit.allowed) {
    res.setHeader("Retry-After", String(rateLimit.retryAfterSeconds))
    res.setHeader("X-RateLimit-Limit", String(rateLimit.limit))
    res.setHeader("X-RateLimit-Remaining", "0")
    return json(res, 429, {
      error: `Rate limit exceeded for ${url.pathname}. Retry after ${rateLimit.retryAfterSeconds}s.`,
    })
  }
  if (Number.isFinite(rateLimit.limit)) {
    res.setHeader("X-RateLimit-Limit", String(rateLimit.limit))
    res.setHeader("X-RateLimit-Remaining", String(rateLimit.remaining))
  }

  try {
    if (req.method === "GET" && url.pathname === "/health") {
      return json(res, 200, {
        ok: true,
        service: "regent-agent",
        uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
        mode: {
          intelligence: VENICE_API_KEY ? "venice" : "heuristic",
          execution: EXECUTION_MODE,
        },
      })
    }

    if (req.method === "GET" && url.pathname === "/quotes") {
      const mandate = mandateFromQuery(url)
      return json(res, 200, { routes: await fetchQuotes(mandate) })
    }

    if (req.method === "POST" && url.pathname === "/evaluate") {
      const body = await readJson<{ mandate: Mandate }>(req)
      const mandate = validateMandate(body?.mandate)
      if (!mandate) return json(res, 400, { error: "Invalid mandate payload" })
      const routes = await fetchQuotes(mandate)
      // A caller-supplied key lets a deployment with no VENICE_API_KEY of its
      // own still run live — never logged, used only for this one call.
      const apiKey = req.headers["x-venice-api-key"]
      try {
        const decision = await evaluateRoutes(mandate, routes, typeof apiKey === "string" ? apiKey : undefined)
        await saveDecision(mandate, decision)
        return json(res, 200, { decision })
      } catch (error) {
        if (error instanceof VeniceKeyRequiredError) return json(res, 400, { error: error.message })
        throw error
      }
    }

    if (req.method === "POST" && url.pathname === "/execute") {
      const body = await readJson<{ mandate: Mandate; route: Route }>(req)
      const mandate = validateMandate(body?.mandate)
      if (!mandate || !body?.route?.dex) return json(res, 400, { error: "Invalid execution payload" })
      const result = await executeRoute(mandate, body.route)
      await saveExecution(mandate, body.route, result)
      return json(res, 200, { result })
    }

    return json(res, 404, { error: "Not found" })
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Internal error" })
  }
})

function clientIdFor(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"]
  if (typeof forwarded === "string" && forwarded.length > 0) return forwarded.split(",")[0].trim()
  return req.socket.remoteAddress ?? "unknown"
}

function json(res: ServerResponse, status: number, payload: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" })
  res.end(JSON.stringify(payload))
}

async function readJson<T>(req: IncomingMessage): Promise<T | null> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  if (chunks.length === 0) return null
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T
  } catch {
    return null
  }
}

function mandateFromQuery(url: URL): Mandate {
  return {
    id: "quote-preview",
    goal: "Preview quotes",
    sourceAsset: url.searchParams.get("source") ?? "USDC",
    targetAsset: url.searchParams.get("target") ?? "ETH",
    budget: Number(url.searchParams.get("budget") ?? 20),
    spent: Number(url.searchParams.get("spent") ?? 0),
    maxSlippage: Number(url.searchParams.get("maxSlippage") ?? 2),
    expiry: new Date(Date.now() + 86_400_000).toISOString(),
  }
}

export function validateMandate(m: Mandate | undefined): Mandate | null {
  if (!m || typeof m.id !== "string" || !m.id) return null
  if (typeof m.budget !== "number" || !Number.isFinite(m.budget) || m.budget <= 0) return null
  if (m.spent !== undefined && (typeof m.spent !== "number" || !Number.isFinite(m.spent) || m.spent < 0)) return null
  if (typeof m.maxSlippage !== "number" || m.maxSlippage < 0 || m.maxSlippage > 100) return null
  if (typeof m.sourceAsset !== "string" || typeof m.targetAsset !== "string") return null
  return m
}

// Only start the server if this file is run directly
if (process.argv[1] && import.meta.url.endsWith(process.argv[1])) {
  server.listen(PORT, () => {
    console.log(`regent-agent listening on http://localhost:${PORT}`)
    console.log(`  intelligence: ${VENICE_API_KEY ? "venice" : "heuristic (set VENICE_API_KEY for live)"}`)
    console.log(`  execution:    ${EXECUTION_MODE}`)
  })
}

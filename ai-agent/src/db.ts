import { randomUUID } from "node:crypto"
import { neon, type NeonQueryFunction } from "@neondatabase/serverless"
import { DATABASE_URL } from "./config.ts"
import { logger } from "./logger.ts"
import type { AgentDecision, ExecutionResult, Mandate, Route } from "./types.ts"

let sqlClient: NeonQueryFunction<false, false> | null = null

export function getDbClient(): NeonQueryFunction<false, false> | null {
  if (!DATABASE_URL) return null
  if (!sqlClient) {
    try {
      sqlClient = neon(DATABASE_URL)
    } catch (err) {
      logger.error("db.client.init_failed", {
        error: err instanceof Error ? err.message : String(err),
      })
      return null
    }
  }
  return sqlClient
}

/**
 * Persists an evaluation decision into the Neon decisions table:
 * decisions(id, mandate_id, source, selected_dex, reasoning, created_at, payload jsonb)
 * No-op when DATABASE_URL is unset or database is unreachable.
 */
export async function saveDecision(
  mandate: Mandate,
  decision: AgentDecision,
  client = getDbClient(),
): Promise<string | null> {
  if (!client) return null

  try {
    const id = randomUUID()
    const createdAt = new Date().toISOString()
    const payload = JSON.stringify({
      mandate,
      decision,
    })

    await client.query(
      `INSERT INTO decisions (id, mandate_id, source, selected_dex, reasoning, created_at, payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [
        id,
        mandate.id,
        decision.source,
        decision.selectedRoute?.dex ?? null,
        decision.reasoning,
        createdAt,
        payload,
      ],
    )

    logger.info("db.decision.persisted", { id, mandateId: mandate.id, source: decision.source })
    return id
  } catch (error) {
    logger.warn("db.decision.persist_failed", {
      mandateId: mandate.id,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

/**
 * Persists an execution result into the Neon executions table:
 * executions(id, mandate_id, tx_hash, status, spend, received, slippage_bps, created_at, payload jsonb)
 * No-op when DATABASE_URL is unset or database is unreachable.
 */
export async function saveExecution(
  mandate: Mandate,
  route: Route,
  result: ExecutionResult,
  client = getDbClient(),
): Promise<string | null> {
  if (!client) return null

  try {
    const id = randomUUID()
    const createdAt = new Date().toISOString()
    const status = result.success ? "success" : "failed"
    const txHash = result.transactionHash || result.txHash || null
    const slippageBps = Math.round(route.slippage * 100)
    const payload = JSON.stringify({
      mandate,
      route,
      result,
    })

    await client.query(
      `INSERT INTO executions (id, mandate_id, tx_hash, status, spend, received, slippage_bps, created_at, payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
      [
        id,
        mandate.id,
        txHash,
        status,
        result.spentAmount,
        result.receivedAmount,
        slippageBps,
        createdAt,
        payload,
      ],
    )

    logger.info("db.execution.persisted", { id, mandateId: mandate.id, status, txHash })
    return id
  } catch (error) {
    logger.warn("db.execution.persist_failed", {
      mandateId: mandate.id,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

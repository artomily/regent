import { NextResponse } from "next/server"
import { getSql, isDbConfigured, mapRowToMandate, type DbMandateRow } from "@/lib/db"
import type { Mandate, MandateStatus } from "@/lib/types"

export async function GET(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ mandates: [], configured: false, reason: "DATABASE_URL is not configured" })
  }

  const { searchParams } = new URL(request.url)
  const owner = searchParams.get("owner")?.toLowerCase()
  if (!owner) {
    return NextResponse.json({ error: "Missing owner query parameter" }, { status: 400 })
  }

  try {
    const sql = getSql()!
    const rows = (await sql(
      `SELECT * FROM mandates 
       WHERE LOWER(owner_address) = $1 OR LOWER(COALESCE(smart_account_address, '')) = $1
       ORDER BY created_at DESC`,
      [owner],
    )) as DbMandateRow[]

    const mandates = rows.map(mapRowToMandate)
    return NextResponse.json({ mandates, configured: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch mandates", configured: true },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    mandate?: Mandate
    ownerAddress?: string
  } | null

  const mandate = body?.mandate
  const ownerAddress = body?.ownerAddress || mandate?.delegatorAddress

  if (!mandate?.id || !ownerAddress) {
    return NextResponse.json({ error: "Invalid mandate or owner address payload" }, { status: 400 })
  }

  if (!isDbConfigured()) {
    return NextResponse.json({
      mandate,
      configured: false,
      reason: "DATABASE_URL is not configured",
    })
  }

  try {
    const sql = getSql()!
    const now = Date.now()

    await sql(
      `INSERT INTO mandates (
        id, owner_address, smart_account_address, on_chain_id, goal, budget, spent, max_slippage,
        source_asset, target_asset, expiry, status, delegator_address, delegation_hash, delegation,
        tx_hash, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )
      ON CONFLICT (id) DO UPDATE SET
        smart_account_address = EXCLUDED.smart_account_address,
        on_chain_id = EXCLUDED.on_chain_id,
        status = EXCLUDED.status,
        spent = EXCLUDED.spent,
        delegation = EXCLUDED.delegation,
        delegation_hash = EXCLUDED.delegation_hash,
        tx_hash = EXCLUDED.tx_hash,
        updated_at = EXCLUDED.updated_at`,
      [
        mandate.id,
        ownerAddress,
        mandate.smartAccountAddress ?? null,
        mandate.onChainId ?? null,
        mandate.goal,
        mandate.budget,
        mandate.spent ?? 0,
        mandate.maxSlippage,
        mandate.sourceAsset,
        mandate.targetAsset,
        mandate.expiry,
        mandate.status,
        mandate.delegatorAddress ?? null,
        mandate.delegationHash ?? null,
        mandate.delegation ? JSON.stringify(mandate.delegation) : null,
        mandate.txHash ?? null,
        mandate.createdAt ?? now,
        now,
      ],
    )

    return NextResponse.json({ mandate, configured: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to persist mandate", configured: true },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    id?: string
    status?: MandateStatus
    spent?: number
    onChainId?: string
    txHash?: string
    delegation?: unknown
    delegationHash?: string
    smartAccountAddress?: string
  } | null

  if (!body?.id) {
    return NextResponse.json({ error: "Missing mandate id" }, { status: 400 })
  }

  if (!isDbConfigured()) {
    return NextResponse.json({
      updated: false,
      configured: false,
      reason: "DATABASE_URL is not configured",
    })
  }

  try {
    const sql = getSql()!
    const now = Date.now()

    const setClauses: string[] = ["updated_at = $2"]
    const params: unknown[] = [body.id, now]
    let paramIndex = 3

    if (body.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`)
      params.push(body.status)
    }
    if (body.spent !== undefined) {
      setClauses.push(`spent = $${paramIndex++}`)
      params.push(body.spent)
    }
    if (body.onChainId !== undefined) {
      setClauses.push(`on_chain_id = $${paramIndex++}`)
      params.push(body.onChainId)
    }
    if (body.txHash !== undefined) {
      setClauses.push(`tx_hash = $${paramIndex++}`)
      params.push(body.txHash)
    }
    if (body.delegation !== undefined) {
      setClauses.push(`delegation = $${paramIndex++}`)
      params.push(JSON.stringify(body.delegation))
    }
    if (body.delegationHash !== undefined) {
      setClauses.push(`delegation_hash = $${paramIndex++}`)
      params.push(body.delegationHash)
    }
    if (body.smartAccountAddress !== undefined) {
      setClauses.push(`smart_account_address = $${paramIndex++}`)
      params.push(body.smartAccountAddress)
    }

    const query = `UPDATE mandates SET ${setClauses.join(", ")} WHERE id = $1`
    await sql(query, params)

    return NextResponse.json({ updated: true, configured: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update mandate", configured: true },
      { status: 500 },
    )
  }
}

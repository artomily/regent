import { NextResponse } from "next/server"
import { verifyMandateAuth } from "@/lib/auth"
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
    const rows = (await sql`
      SELECT * FROM mandates 
      WHERE LOWER(owner_address) = ${owner} OR LOWER(COALESCE(smart_account_address, '')) = ${owner}
      ORDER BY created_at DESC
    `) as DbMandateRow[]

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
    owner?: string
    auth?: { signature?: string; timestamp?: number; action?: "create" | "update" }
    signature?: string
    timestamp?: number
  } | null

  const mandate = body?.mandate
  const ownerAddress = body?.ownerAddress || body?.owner || mandate?.delegatorAddress || (mandate as any)?.owner

  if (!mandate?.id || !ownerAddress) {
    return NextResponse.json({ error: "Invalid mandate or owner address payload" }, { status: 400 })
  }

  const signature = body?.auth?.signature || body?.signature || request.headers.get("x-regent-signature")
  const timestampRaw =
    body?.auth?.timestamp ??
    body?.timestamp ??
    (request.headers.get("x-regent-timestamp") ? Number(request.headers.get("x-regent-timestamp")) : undefined)
  const action = body?.auth?.action || "create"

  const authResult = await verifyMandateAuth({
    action,
    mandateId: mandate.id,
    expectedOwner: ownerAddress,
    signature: signature ?? undefined,
    timestamp: timestampRaw,
  })

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
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
    const rawDelegations = mandate.delegations || mandate.delegation
    const delegationJson = rawDelegations ? JSON.stringify(rawDelegations) : null

    await sql`
      INSERT INTO mandates (
        id, owner_address, smart_account_address, on_chain_id, goal, budget, spent, max_slippage,
        source_asset, target_asset, expiry, status, delegator_address, delegation_hash, delegation,
        tx_hash, created_at, updated_at
      ) VALUES (
        ${mandate.id},
        ${ownerAddress},
        ${mandate.smartAccountAddress ?? null},
        ${mandate.onChainId ?? null},
        ${mandate.goal},
        ${mandate.budget},
        ${mandate.spent ?? 0},
        ${mandate.maxSlippage},
        ${mandate.sourceAsset},
        ${mandate.targetAsset},
        ${mandate.expiry},
        ${mandate.status},
        ${mandate.delegatorAddress ?? null},
        ${mandate.delegationHash ?? null},
        ${delegationJson ? JSON.parse(delegationJson) : null},
        ${mandate.txHash ?? null},
        ${mandate.createdAt ?? now},
        ${now}
      )
      ON CONFLICT (id) DO UPDATE SET
        smart_account_address = EXCLUDED.smart_account_address,
        on_chain_id = EXCLUDED.on_chain_id,
        status = EXCLUDED.status,
        spent = EXCLUDED.spent,
        delegation = EXCLUDED.delegation,
        delegation_hash = EXCLUDED.delegation_hash,
        tx_hash = EXCLUDED.tx_hash,
        updated_at = EXCLUDED.updated_at
    `

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
    delegations?: unknown
    delegationHash?: string
    smartAccountAddress?: string
    ownerAddress?: string
    owner?: string
    auth?: { signature?: string; timestamp?: number }
    signature?: string
    timestamp?: number
  } | null

  if (!body?.id) {
    return NextResponse.json({ error: "Missing mandate id" }, { status: 400 })
  }

  let expectedOwner = body?.ownerAddress || body?.owner || request.headers.get("x-regent-owner")

  if (isDbConfigured()) {
    try {
      const sql = getSql()!
      const rows = (await sql`
        SELECT owner_address FROM mandates WHERE id = ${body.id} LIMIT 1
      `) as DbMandateRow[]
      if (rows.length > 0 && rows[0].owner_address) {
        expectedOwner = rows[0].owner_address
      }
    } catch {
      // If DB query fails, continue with body-supplied owner
    }
  }

  if (!expectedOwner) {
    return NextResponse.json({ error: "Missing owner for authorization" }, { status: 401 })
  }

  const signature = body?.auth?.signature || body?.signature || request.headers.get("x-regent-signature")
  const timestampRaw =
    body?.auth?.timestamp ??
    body?.timestamp ??
    (request.headers.get("x-regent-timestamp") ? Number(request.headers.get("x-regent-timestamp")) : undefined)

  const authResult = await verifyMandateAuth({
    action: "update",
    mandateId: body.id,
    expectedOwner,
    signature: signature ?? undefined,
    timestamp: timestampRaw,
  })

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
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
    const rawDelegations = body.delegations || body.delegation
    const delegationJson = rawDelegations ? JSON.stringify(rawDelegations) : null

    await sql`
      UPDATE mandates SET
        status = COALESCE(${body.status ?? null}, status),
        spent = COALESCE(${body.spent ?? null}, spent),
        on_chain_id = COALESCE(${body.onChainId ?? null}, on_chain_id),
        tx_hash = COALESCE(${body.txHash ?? null}, tx_hash),
        delegation = COALESCE(${delegationJson ? JSON.parse(delegationJson) : null}, delegation),
        delegation_hash = COALESCE(${body.delegationHash ?? null}, delegation_hash),
        smart_account_address = COALESCE(${body.smartAccountAddress ?? null}, smart_account_address),
        updated_at = ${now}
      WHERE id = ${body.id}
    `

    return NextResponse.json({ updated: true, configured: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update mandate", configured: true },
      { status: 500 },
    )
  }
}

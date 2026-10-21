import { neon } from "@neondatabase/serverless"
import type { Mandate, MandateStatus } from "./types"

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0)
}

export function getSql() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) return null
  return neon(databaseUrl)
}

export interface DbMandateRow {
  id: string
  owner_address: string
  smart_account_address: string | null
  on_chain_id: string | null
  goal: string
  budget: string | number
  spent: string | number
  max_slippage: string | number
  source_asset: string
  target_asset: string
  expiry: string
  status: string
  delegator_address: string | null
  delegation_hash: string | null
  delegation: unknown
  tx_hash: string | null
  created_at: string | number
  updated_at: string | number
}

export function mapRowToMandate(row: DbMandateRow): Mandate {
  const rawDelegation = row.delegation
  const isPair =
    rawDelegation &&
    typeof rawDelegation === "object" &&
    "approve" in rawDelegation &&
    "swap" in rawDelegation

  return {
    id: row.id,
    goal: row.goal,
    budget: Number(row.budget),
    spent: Number(row.spent ?? 0),
    maxSlippage: Number(row.max_slippage),
    sourceAsset: row.source_asset,
    targetAsset: row.target_asset,
    expiry: row.expiry,
    status: row.status as MandateStatus,
    createdAt: Number(row.created_at),
    delegatorAddress: (row.delegator_address as `0x${string}`) || undefined,
    delegationHash: (row.delegation_hash as `0x${string}`) || undefined,
    smartAccountAddress: (row.smart_account_address as `0x${string}`) || undefined,
    onChainId: (row.on_chain_id as `0x${string}`) || undefined,
    delegation: row.delegation ?? undefined,
    delegations: isPair ? rawDelegation : undefined,
    txHash: (row.tx_hash as `0x${string}`) || undefined,
  }
}

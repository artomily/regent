import type { Mandate, MandateStatus } from "./types"

const MANDATES_KEY = "regent_mandates"

function getAll(): Mandate[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(MANDATES_KEY)
  if (!raw) return []
  const parsed = JSON.parse(raw) as Mandate[]
  // Older records predate the `spent` field.
  return parsed.map((m) => ({ ...m, spent: m.spent ?? 0 }))
}

function save(mandates: Mandate[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(MANDATES_KEY, JSON.stringify(mandates))
}

export function createMandate(params: {
  goal: string
  budget: number
  maxSlippage: number
  targetAsset: string
  sourceAsset: string
  expiry: string
}): Mandate {
  const mandate: Mandate = {
    id: crypto.randomUUID(),
    ...params,
    status: "pending",
    createdAt: Date.now(),
    spent: 0,
  }

  const mandates = getAll()
  mandates.push(mandate)
  save(mandates)

  return mandate
}

function update(id: string, patch: Partial<Mandate>): Mandate | null {
  const mandates = getAll()
  const idx = mandates.findIndex((m) => m.id === id)
  if (idx === -1) return null
  mandates[idx] = { ...mandates[idx], ...patch }
  save(mandates)
  return mandates[idx]
}

export function updateMandateStatus(id: string, status: MandateStatus): Mandate | null {
  return update(id, { status })
}

export function recordSpend(id: string, amount: number): Mandate | null {
  const mandate = getMandate(id)
  if (!mandate) return null
  return update(id, { spent: mandate.spent + amount })
}

export function updateMandateDelegation(
  id: string,
  data: { delegatorAddress: `0x${string}`; delegationHash: `0x${string}` },
): Mandate | null {
  return update(id, data)
}

export function getMandate(id: string): Mandate | null {
  return getAll().find((m) => m.id === id) ?? null
}

export function getAllMandates(): Mandate[] {
  return getAll().sort((a, b) => b.createdAt - a.createdAt)
}

export function validateMandate(mandate: Mandate): { valid: boolean; reason?: string } {
  if (!mandate.goal.trim()) return { valid: false, reason: "Give the mandate a goal" }
  if (!Number.isFinite(mandate.budget) || mandate.budget <= 0)
    return { valid: false, reason: "Budget must be greater than 0" }
  if (mandate.maxSlippage < 0 || mandate.maxSlippage > 100)
    return { valid: false, reason: "Slippage must be between 0 and 100" }
  if (!mandate.targetAsset) return { valid: false, reason: "Target asset is required" }
  if (mandate.targetAsset === mandate.sourceAsset)
    return { valid: false, reason: "Target and source assets must differ" }
  if (mandate.expiry && new Date(mandate.expiry).getTime() <= Date.now())
    return { valid: false, reason: "Expiry must be in the future" }
  return { valid: true }
}

export function isMandateExpired(mandate: Mandate): boolean {
  if (!mandate.expiry) return false
  return new Date(mandate.expiry).getTime() <= Date.now()
}

export function checkBudget(mandate: Mandate, proposedSpend: number): boolean {
  return mandate.spent + proposedSpend <= mandate.budget
}

export function checkSlippage(mandate: Mandate, actualSlippage: number): boolean {
  return actualSlippage <= mandate.maxSlippage
}

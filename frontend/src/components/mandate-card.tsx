"use client"

import { ArrowUpRight, Ban, Clock, FileSignature, Gauge } from "lucide-react"
import Link from "next/link"
import { StatusChip } from "./status-chip"
import { formatAmount, formatExpiry, formatPercent, formatTimeAgo, truncateMiddle } from "@/lib/format"
import type { Mandate } from "@/lib/types"

interface MandateCardProps {
  mandate: Mandate
  onRevoke?: (id: string) => void
  /** Pages that already show the goal as their title render the card as a plain clause sheet. */
  showGoal?: boolean
}

export function MandateCard({ mandate, onRevoke, showGoal = true }: MandateCardProps) {
  const spentPct = Math.min(100, (mandate.spent / mandate.budget) * 100)
  const revocable = ["authorized", "active"].includes(mandate.status) && onRevoke

  return (
    <section
      aria-label="Active mandate"
      className="rounded-2xl border border-edge bg-surface p-6 shadow-xs"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-medium tracking-[0.18em] text-muted uppercase">Mandate</p>
          <h2 className="mt-1 font-display text-2xl font-light tracking-tight text-ink">
            {showGoal ? mandate.goal : "Signed boundaries"}
          </h2>
          <p className="mt-1 text-xs text-muted">Issued {formatTimeAgo(mandate.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-edge px-2.5 py-0.5 font-mono text-[10px] tracking-wide text-fog uppercase">
            {mandate.onChainId ? "Live" : "Demo"}
          </span>
          <StatusChip status={mandate.status} />
          {revocable && (
            <button
              onClick={() => onRevoke(mandate.id)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-edge bg-panel px-3 text-xs text-negative transition-colors hover:bg-edge focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-negative"
            >
              <Ban className="h-3 w-3" aria-hidden="true" />
              Revoke
            </button>
          )}
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-edge bg-edge lg:grid-cols-4">
        <div className="bg-panel p-3.5 sm:p-4 min-w-0 overflow-hidden">
          <dt className="flex items-center gap-1.5 text-[11px] tracking-wide text-muted uppercase">
            <Gauge className="h-3 w-3 text-ink shrink-0" aria-hidden="true" /> Budget
          </dt>
          <dd className="tnum mt-2 font-mono text-base sm:text-lg font-medium text-ink truncate">
            {formatAmount(mandate.budget)} <span className="text-xs text-muted">{mandate.sourceAsset}</span>
          </dd>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas" role="presentation">
            <div
              className="h-full rounded-full bg-lime transition-[width] duration-500"
              style={{ width: `${spentPct}%` }}
            />
          </div>
          <p className="tnum mt-1.5 font-mono text-[11px] text-muted truncate">
            {formatAmount(mandate.spent)} spent
          </p>
        </div>

        <div className="bg-panel p-3.5 sm:p-4 min-w-0 overflow-hidden">
          <dt className="flex items-center gap-1.5 text-[11px] tracking-wide text-muted uppercase">
            <Gauge className="h-3 w-3 text-ink shrink-0" aria-hidden="true" /> Max slippage
          </dt>
          <dd className="tnum mt-2 font-mono text-base sm:text-lg font-medium text-ink truncate">{formatPercent(mandate.maxSlippage)}</dd>
          <p className="mt-1.5 text-[11px] text-muted truncate">Hard ceiling per route</p>
        </div>

        <div className="bg-panel p-3.5 sm:p-4 min-w-0 overflow-hidden">
          <dt className="flex items-center gap-1.5 text-[11px] tracking-wide text-muted uppercase">
            <Clock className="h-3 w-3 text-ink shrink-0" aria-hidden="true" /> Expiry
          </dt>
          <dd className="tnum mt-2 font-mono text-base sm:text-lg font-medium text-ink truncate">{formatExpiry(mandate.expiry)}</dd>
          <p className="mt-1.5 text-[11px] text-muted truncate">Authority ends automatically</p>
        </div>

        <div className="bg-panel p-3.5 sm:p-4 min-w-0 overflow-hidden">
          <dt className="flex items-center gap-1.5 text-[11px] tracking-wide text-muted uppercase">
            <FileSignature className="h-3 w-3 text-ink shrink-0" aria-hidden="true" /> Delegation
          </dt>
          <dd className="tnum mt-2 font-mono text-base sm:text-lg font-medium text-ink truncate">
            {mandate.delegationHash ? truncateMiddle(mandate.delegationHash, 8, 6) : "—"}
          </dd>
          <p className="mt-1.5 text-[11px] text-muted truncate">
            {mandate.delegation
              ? "ERC-7710 delegation"
              : mandate.delegationHash
                ? "EIP-712 signature"
                : "Simulated authorization"}
          </p>
        </div>
      </dl>

      <p className="mt-4 text-xs text-muted">
        Acquiring <span className="font-mono font-medium text-ink">{mandate.targetAsset}</span> with{" "}
        <span className="font-mono font-medium text-ink">{mandate.sourceAsset}</span>
        {mandate.smartAccountAddress ? (
          <>
            {" "}
            via Smart Account <span className="font-mono font-medium text-ink">{truncateMiddle(mandate.smartAccountAddress)}</span>
            {mandate.delegatorAddress && (
              <> (owner: <span className="font-mono font-medium text-ink">{truncateMiddle(mandate.delegatorAddress)}</span>)</>
            )}
          </>
        ) : mandate.delegatorAddress ? (
          <>
            {" "}
            on behalf of <span className="font-mono font-medium text-ink">{truncateMiddle(mandate.delegatorAddress)}</span>
          </>
        ) : null}
        {mandate.onChainId && (
          <>
            {" "}
            · Mandate ID: <span className="font-mono font-medium text-ink">{truncateMiddle(mandate.onChainId, 6, 4)}</span>
          </>
        )}
        . Regent may act only inside these boundaries — every breach reverts.
      </p>
    </section>
  )
}

export function MandateRow({ mandate }: { mandate: Mandate }) {
  const spentPct = Math.min(100, (mandate.spent / mandate.budget) * 100)
  return (
    <Link
      href={`/dashboard/mandates/${mandate.id}`}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-edge bg-surface px-4 py-3.5 shadow-2xs transition-colors hover:bg-panel-sage-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{mandate.goal}</p>
        <p className="tnum mt-0.5 font-mono text-[11px] text-muted">
          {formatAmount(mandate.budget)} {mandate.sourceAsset} → {mandate.targetAsset} ·{" "}
          {formatTimeAgo(mandate.createdAt)}
        </p>
      </div>
      <div className="hidden w-32 shrink-0 sm:block" aria-hidden="true">
        <div className="h-1.5 overflow-hidden rounded-full bg-panel">
          <div className="h-full rounded-full bg-lime" style={{ width: `${spentPct}%` }} />
        </div>
        <p className="tnum mt-1 text-right font-mono text-[10px] text-muted">{formatPercent(spentPct)} used</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusChip status={mandate.status} />
        <ArrowUpRight
          className="h-4 w-4 text-muted transition-colors group-hover:text-ink"
          aria-hidden="true"
        />
      </div>
    </Link>
  )
}

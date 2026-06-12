"use client"

import { Ban, Clock, FileSignature, Gauge } from "lucide-react"
import { StatusChip } from "./status-chip"
import { formatAmount, formatExpiry, formatPercent, formatTimeAgo, truncateMiddle } from "@/lib/format"
import type { Mandate } from "@/lib/types"

interface MandateCardProps {
  mandate: Mandate
  onRevoke?: (id: string) => void
}

export function MandateCard({ mandate, onRevoke }: MandateCardProps) {
  const spentPct = Math.min(100, (mandate.spent / mandate.budget) * 100)
  const revocable = ["authorized", "active"].includes(mandate.status) && onRevoke

  return (
    <section
      aria-label="Active mandate"
      className="rounded-2xl border border-edge bg-surface p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-[0.18em] text-dim uppercase">Mandate</p>
          <h2 className="mt-1 font-display text-2xl text-cream">{mandate.goal}</h2>
          <p className="mt-1 text-xs text-fog">Issued {formatTimeAgo(mandate.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusChip status={mandate.status} />
          {revocable && (
            <button
              onClick={() => onRevoke(mandate.id)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-edge px-3 text-xs text-fog transition-colors hover:border-negative hover:text-negative focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-negative"
            >
              <Ban className="h-3 w-3" aria-hidden="true" />
              Revoke
            </button>
          )}
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-edge bg-edge lg:grid-cols-4">
        <div className="bg-raised p-4">
          <dt className="flex items-center gap-1.5 text-[11px] tracking-wide text-fog uppercase">
            <Gauge className="h-3 w-3" aria-hidden="true" /> Budget
          </dt>
          <dd className="tnum mt-2 font-mono text-lg text-cream">
            {formatAmount(mandate.budget)} <span className="text-xs text-fog">{mandate.sourceAsset}</span>
          </dd>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-overlay" role="presentation">
            <div
              className="h-full rounded-full bg-brass transition-[width] duration-500"
              style={{ width: `${spentPct}%` }}
            />
          </div>
          <p className="tnum mt-1.5 font-mono text-[11px] text-fog">
            {formatAmount(mandate.spent)} spent
          </p>
        </div>

        <div className="bg-raised p-4">
          <dt className="flex items-center gap-1.5 text-[11px] tracking-wide text-fog uppercase">
            <Gauge className="h-3 w-3" aria-hidden="true" /> Max slippage
          </dt>
          <dd className="tnum mt-2 font-mono text-lg text-cream">{formatPercent(mandate.maxSlippage)}</dd>
          <p className="mt-1.5 text-[11px] text-fog">Hard ceiling per route</p>
        </div>

        <div className="bg-raised p-4">
          <dt className="flex items-center gap-1.5 text-[11px] tracking-wide text-fog uppercase">
            <Clock className="h-3 w-3" aria-hidden="true" /> Expiry
          </dt>
          <dd className="tnum mt-2 font-mono text-lg text-cream">{formatExpiry(mandate.expiry)}</dd>
          <p className="mt-1.5 text-[11px] text-fog">Authority ends automatically</p>
        </div>

        <div className="bg-raised p-4">
          <dt className="flex items-center gap-1.5 text-[11px] tracking-wide text-fog uppercase">
            <FileSignature className="h-3 w-3" aria-hidden="true" /> Delegation
          </dt>
          <dd className="tnum mt-2 font-mono text-lg text-cream">
            {mandate.delegationHash ? truncateMiddle(mandate.delegationHash, 8, 6) : "—"}
          </dd>
          <p className="mt-1.5 text-[11px] text-fog">
            {mandate.delegationHash ? "EIP-712 signature" : "Demo authorization"}
          </p>
        </div>
      </dl>

      <p className="mt-4 text-xs text-fog">
        Acquiring <span className="font-mono text-cream">{mandate.targetAsset}</span> with{" "}
        <span className="font-mono text-cream">{mandate.sourceAsset}</span>
        {mandate.delegatorAddress && (
          <>
            {" "}
            on behalf of <span className="font-mono text-cream">{truncateMiddle(mandate.delegatorAddress)}</span>
          </>
        )}
        . Regent may act only inside these boundaries — every breach reverts.
      </p>
    </section>
  )
}

export function MandateRow({
  mandate,
  onView,
}: {
  mandate: Mandate
  onView?: (id: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-edge bg-surface px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm text-cream">{mandate.goal}</p>
        <p className="tnum mt-0.5 font-mono text-[11px] text-fog">
          {formatAmount(mandate.budget)} {mandate.sourceAsset} → {mandate.targetAsset} ·{" "}
          {formatTimeAgo(mandate.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusChip status={mandate.status} />
        {onView && (
          <button
            onClick={() => onView(mandate.id)}
            className="rounded-full border border-edge px-3 py-1.5 text-xs text-fog transition-colors hover:border-brass hover:text-brass-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            View
          </button>
        )}
      </div>
    </div>
  )
}

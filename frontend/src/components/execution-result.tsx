"use client"

import { CheckCircle2, ExternalLink, XCircle } from "lucide-react"
import { CHAIN } from "@/lib/constants"
import { formatAmount, truncateMiddle } from "@/lib/format"
import type { ExecutionResult, Mandate } from "@/lib/types"

export function ExecutionResultPanel({ mandate, result }: { mandate: Mandate; result: ExecutionResult }) {
  return (
    <section aria-label="Execution result" className="rounded-2xl border border-edge bg-surface p-5">
      {result.success ? (
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="h-5 w-5 text-positive" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-cream">Execution confirmed</h3>
          <span className="ml-auto text-[11px] tracking-wide text-dim uppercase">{result.source}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2.5">
          <XCircle className="h-5 w-5 text-negative" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-cream">Execution refused</h3>
        </div>
      )}

      {result.success ? (
        <>
          <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-edge bg-edge">
            <div className="bg-raised p-3.5">
              <dt className="text-[11px] tracking-wide text-fog uppercase">Spent</dt>
              <dd className="tnum mt-1 font-mono text-base text-cream">
                {formatAmount(result.spentAmount)}{" "}
                <span className="text-xs text-fog">{mandate.sourceAsset}</span>
              </dd>
            </div>
            <div className="bg-raised p-3.5">
              <dt className="text-[11px] tracking-wide text-fog uppercase">Received</dt>
              <dd className="tnum mt-1 font-mono text-base text-cream">
                {formatAmount(result.receivedAmount)}{" "}
                <span className="text-xs text-fog">{mandate.targetAsset}</span>
              </dd>
            </div>
            <div className="bg-raised p-3.5">
              <dt className="text-[11px] tracking-wide text-fog uppercase">Under budget</dt>
              <dd className="tnum mt-1 font-mono text-base text-positive">
                {formatAmount(mandate.budget - result.spentAmount)}{" "}
                <span className="text-xs">{mandate.sourceAsset}</span>
              </dd>
            </div>
          </dl>

          {result.transactionHash && (
            <p className="tnum mt-3 flex flex-wrap items-center gap-2 font-mono text-xs text-fog">
              tx {truncateMiddle(result.transactionHash, 12, 8)}
              {result.source === "relayer" ? (
                <a
                  href={`${CHAIN.explorerUrl}/tx/${result.transactionHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-brass transition-colors hover:text-brass-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
                >
                  BaseScan <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              ) : (
                <span className="text-[10px] tracking-wide text-dim uppercase">simulated — not on chain</span>
              )}
            </p>
          )}
        </>
      ) : (
        <p className="mt-3 rounded-xl border border-negative/30 bg-negative/10 px-4 py-3 text-sm text-negative">
          {result.error ?? "The transaction failed."}
        </p>
      )}
    </section>
  )
}

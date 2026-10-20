"use client"

import { Route as RouteIcon } from "lucide-react"
import { formatAmount, formatPercent } from "@/lib/format"
import type { AgentDecision, Mandate } from "@/lib/types"

const SOURCE_LABELS: Record<AgentDecision["source"], string> = {
  venice: "Decided by Venice AI",
  heuristic: "Decided by the agent's heuristic policy",
  simulated: "Decided by the built-in simulator",
}

export function RoutePanel({ mandate, decision }: { mandate: Mandate; decision: AgentDecision }) {
  return (
    <section aria-label="Route comparison" className="rounded-2xl border border-edge bg-surface shadow-xs">
      <header className="flex items-center justify-between border-b border-edge px-5 py-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <RouteIcon className="h-4 w-4 text-ink" aria-hidden="true" />
          Route comparison
        </h3>
        <span className="font-mono text-[11px] tracking-wide text-muted uppercase">{decision.source}</span>
      </header>

      <div className="p-5">
        <ul className="space-y-2.5">
          {decision.allRoutes.map((route) => {
            const selected = route.dex === decision.selectedRoute?.dex
            const slippageBreach = route.slippage > mandate.maxSlippage
            const budgetBreach = route.inputAmount > mandate.budget
            const breached = slippageBreach || budgetBreach
            return (
              <li
                key={route.dex}
                className={`rounded-xl border p-3.5 transition-colors ${
                  selected
                    ? "border-ink bg-panel/70 shadow-xs"
                    : breached
                      ? "border-edge bg-panel/20 opacity-55"
                      : "border-edge bg-surface"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold text-ink">{route.dex}</span>
                    {selected && (
                      <span className="rounded-full bg-lime px-2 py-0.5 font-mono text-[10px] font-bold tracking-wide text-ink uppercase shadow-2xs">
                        Selected
                      </span>
                    )}
                    {breached && (
                      <span className="font-mono text-[10px] tracking-wide text-negative uppercase">
                        {budgetBreach ? "over budget" : "over slippage limit"}
                      </span>
                    )}
                  </div>
                  <span className="tnum font-mono text-xs text-muted">
                    {formatAmount(route.inputAmount)} {mandate.sourceAsset} →{" "}
                    <span className="font-semibold text-ink">{formatAmount(route.outputAmount)}</span>{" "}
                    {mandate.targetAsset}
                  </span>
                </div>
                <div className="tnum mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
                  <span className={slippageBreach ? "font-semibold text-negative" : ""}>
                    slip {formatPercent(route.slippage)}
                  </span>
                  <span>fee {formatPercent(route.fee)}</span>
                  <span>
                    px {formatAmount(route.executionPrice)} {mandate.sourceAsset}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>

        <figure className="mt-5 border-l-2 border-ink pl-4">
          <blockquote className="text-xs leading-relaxed text-ink/80 italic">{decision.reasoning}</blockquote>
          <figcaption className="mt-2 font-mono text-[10px] tracking-wider text-muted uppercase">
            {SOURCE_LABELS[decision.source]}
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

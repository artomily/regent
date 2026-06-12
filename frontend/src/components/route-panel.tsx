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
    <section aria-label="Route comparison" className="rounded-2xl border border-edge bg-surface">
      <header className="flex items-center justify-between border-b border-edge px-5 py-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-cream">
          <RouteIcon className="h-4 w-4 text-brass" aria-hidden="true" />
          Route comparison
        </h3>
        <span className="text-[11px] tracking-wide text-dim uppercase">{decision.source}</span>
      </header>

      <div className="p-5">
        <ul className="space-y-2">
          {decision.allRoutes.map((route) => {
            const selected = route.dex === decision.selectedRoute?.dex
            const slippageBreach = route.slippage > mandate.maxSlippage
            const budgetBreach = route.inputAmount > mandate.budget
            const breached = slippageBreach || budgetBreach
            return (
              <li
                key={route.dex}
                className={`rounded-xl border p-3.5 ${
                  selected
                    ? "border-brass/40 bg-brass-faint"
                    : breached
                      ? "border-edge opacity-55"
                      : "border-edge bg-raised"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold text-cream">{route.dex}</span>
                    {selected && (
                      <span className="rounded-full bg-brass px-2 py-0.5 text-[10px] font-bold tracking-wide text-ink uppercase">
                        Selected
                      </span>
                    )}
                    {breached && (
                      <span className="text-[10px] tracking-wide text-negative uppercase">
                        {budgetBreach ? "over budget" : "over slippage ceiling"}
                      </span>
                    )}
                  </div>
                  <span className="tnum font-mono text-xs text-fog">
                    {formatAmount(route.inputAmount)} {mandate.sourceAsset} →{" "}
                    <span className="text-cream">{formatAmount(route.outputAmount)}</span> {mandate.targetAsset}
                  </span>
                </div>
                <div className="tnum mt-2 flex gap-4 font-mono text-[11px] text-fog">
                  <span className={slippageBreach ? "text-negative" : ""}>
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

        <figure className="mt-4 border-l-2 border-brass/50 pl-4">
          <blockquote className="text-sm leading-relaxed text-fog">{decision.reasoning}</blockquote>
          <figcaption className="mt-2 text-[11px] tracking-wide text-dim uppercase">
            {SOURCE_LABELS[decision.source]}
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

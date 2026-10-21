"use client"

import { ArrowLeft, Play, Send } from "lucide-react"
import Link from "next/link"
import { use } from "react"
import { ActivityFeed } from "@/components/activity-feed"
import { DashboardShell, DashboardSkeleton } from "@/components/dashboard/dashboard-shell"
import { ExecutionResultPanel } from "@/components/execution-result"
import { MandateCard } from "@/components/mandate-card"
import { RoutePanel } from "@/components/route-panel"
import { StatusChip } from "@/components/status-chip"
import { useRegent } from "@/hooks/use-regent"
import { formatAmount, formatExpiry } from "@/lib/format"

export default function MandateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const {
    hydrated,
    walletAddress,
    activeMandate: mandate,
    activityLog,
    decision,
    executionResult,
    isAgentRunning,
    evaluateAgent,
    executeAgent,
    revokeMandate,
  } = useRegent({ focusMandateId: id })

  if (!hydrated) {
    return <DashboardSkeleton />
  }

  const backLink = (
    <Link
      href="/dashboard?tab=mandates"
      className="inline-flex w-fit items-center gap-1.5 rounded-full text-xs font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> All mandates
    </Link>
  )

  if (!mandate || mandate.id !== id) {
    return (
      <DashboardShell walletAddress={walletAddress} activeTab="mandates">
        {backLink}
        <div className="mt-10 flex flex-col items-center rounded-3xl border border-edge/60 bg-panel-sage p-12 text-center">
          <h1 className="font-display text-2xl font-light text-ink">Mandate not found</h1>
          <p className="mt-1 max-w-sm text-xs text-muted">
            It may have been created in another browser. Mandates are stored with the wallet that signed them.
          </p>
        </div>
      </DashboardShell>
    )
  }

  const remaining = Math.max(0, mandate.budget - mandate.spent)
  const canExecute = mandate.status === "active" && decision?.selectedRoute && !executionResult

  return (
    <DashboardShell walletAddress={walletAddress} activeTab="mandates">
      {backLink}

      <header className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">Mandate</span>
            <StatusChip status={mandate.status} />
          </div>
          <h1 className="mt-2 font-display text-3xl font-light tracking-tight text-ink sm:text-4xl">
            {mandate.goal}
          </h1>
          <p className="tnum mt-2 font-mono text-xs text-muted">
            {formatAmount(remaining)} {mandate.sourceAsset} left · {formatExpiry(mandate.expiry)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {mandate.status === "authorized" && (
            <button
              onClick={() => evaluateAgent(mandate.id)}
              disabled={isAgentRunning}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-xs font-semibold text-pure-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 text-lime" aria-hidden="true" />
              {isAgentRunning ? "Regent is working…" : "Activate Regent"}
            </button>
          )}
          {canExecute && (
            <button
              onClick={() => executeAgent(mandate.id)}
              disabled={isAgentRunning}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-xs font-semibold text-pure-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5 text-lime" aria-hidden="true" />
              {isAgentRunning ? "Executing…" : `Execute on ${decision.selectedRoute!.dex}`}
            </button>
          )}
        </div>
      </header>

      <div className="mt-7 grid items-start gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <MandateCard mandate={mandate} onRevoke={revokeMandate} showGoal={false} />

          {decision ? (
            <div className="rounded-3xl border border-edge/60 bg-panel-sage p-4 shadow-xs sm:p-6">
              <RoutePanel mandate={mandate} decision={decision} />
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-edge-strong p-8 text-center">
              <p className="text-sm font-medium text-ink">No route evaluation yet</p>
              <p className="mt-1 text-xs text-muted">
                {mandate.status === "authorized"
                  ? "Activate Regent to have Venice compare routes inside this mandate."
                  : "Routes appear here once the agent evaluates this mandate."}
              </p>
            </div>
          )}

          {executionResult && (
            <div className="rounded-3xl border border-edge/60 bg-panel-sage p-4 shadow-xs sm:p-6">
              <ExecutionResultPanel mandate={mandate} result={executionResult} />
            </div>
          )}
        </div>

        <section aria-label="Activity" className="rounded-3xl border border-edge/60 bg-panel-sage p-4 shadow-xs sm:p-6 xl:col-span-4">
          <ActivityFeed events={activityLog} isRunning={isAgentRunning} />
        </section>
      </div>
    </DashboardShell>
  )
}

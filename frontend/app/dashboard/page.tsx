"use client"

import { Crown, Play, RotateCcw, Send } from "lucide-react"
import Link from "next/link"
import { ActivityFeed } from "@/components/activity-feed"
import { ExecutionResultPanel } from "@/components/execution-result"
import { MandateCard, MandateRow } from "@/components/mandate-card"
import { RoutePanel } from "@/components/route-panel"
import { SiteFooter } from "@/components/site-footer"
import { AppHeader } from "@/components/site-header"
import { useRegent } from "@/hooks/use-regent"

function PanelSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div
      className={`animate-pulse-soft rounded-2xl border border-edge bg-panel/40 ${tall ? "h-80" : "h-44"}`}
      aria-hidden="true"
    />
  )
}

export default function Dashboard() {
  const {
    hydrated,
    walletAddress,
    mandates,
    activeMandate,
    activityLog,
    decision,
    executionResult,
    isAgentRunning,
    agentHealth,
    connect,
    evaluateAgent,
    executeAgent,
    revokeMandate,
    resetAgent,
    viewMandate,
  } = useRegent()

  const history = mandates.filter((m) => m.id !== activeMandate?.id)

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <AppHeader walletAddress={walletAddress} onConnect={connect} health={agentHealth} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {!hydrated ? (
          <div className="space-y-6">
            <PanelSkeleton />
            <div className="grid gap-6 lg:grid-cols-2">
              <PanelSkeleton tall />
              <PanelSkeleton tall />
            </div>
            <span className="sr-only">Loading your mandates…</span>
          </div>
        ) : !activeMandate ? (
          <div className="flex flex-col items-center py-20 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-edge bg-surface shadow-xs">
              <Crown className="h-7 w-7 text-ink" aria-hidden="true" />
            </span>
            <h1 className="mt-6 font-display text-3xl font-light tracking-tight text-ink sm:text-4xl">
              No active mandate
            </h1>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-muted sm:text-sm">
              Give Regent a goal, a budget, and boundaries. It does the rest — and can never go beyond
              what you sign.
            </p>
            <Link
              href="/mandate"
              className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-7 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Create a mandate
            </Link>

            {history.length > 0 && (
              <section aria-label="Previous mandates" className="mt-14 w-full max-w-2xl text-left">
                <h2 className="mb-3 font-mono text-xs font-semibold tracking-[0.18em] text-muted uppercase">
                  Previous mandates
                </h2>
                <div className="space-y-2">
                  {history.map((m) => (
                    <MandateRow key={m.id} mandate={m} onView={viewMandate} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-3xl font-light tracking-tight text-ink">Dashboard</h1>
                <p className="mt-1 text-xs text-muted">Regent operates inside the boundaries below.</p>
              </div>
              <div className="flex gap-2">
                {activeMandate.status === "authorized" && (
                  <button
                    onClick={() => evaluateAgent(activeMandate.id)}
                    disabled={isAgentRunning}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50"
                  >
                    <Play className="h-3.5 w-3.5 text-lime" aria-hidden="true" />
                    {isAgentRunning ? "Regent is working…" : "Activate Regent"}
                  </button>
                )}
                {activeMandate.status === "active" && decision?.selectedRoute && !executionResult && (
                  <button
                    onClick={() => executeAgent(activeMandate.id)}
                    disabled={isAgentRunning}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5 text-lime" aria-hidden="true" />
                    {isAgentRunning ? "Executing…" : `Execute on ${decision.selectedRoute.dex}`}
                  </button>
                )}
                {["completed", "rejected", "revoked"].includes(activeMandate.status) && (
                  <>
                    <button
                      onClick={resetAgent}
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-edge bg-surface px-4 text-xs font-medium text-ink transition-colors hover:bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Dismiss
                    </button>
                    <Link
                      href="/mandate"
                      className="inline-flex h-10 items-center rounded-full bg-ink px-5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                      New mandate
                    </Link>
                  </>
                )}
              </div>
            </div>

            <MandateCard mandate={activeMandate} onRevoke={revokeMandate} />

            <div className="grid items-start gap-6 lg:grid-cols-2">
              <ActivityFeed events={activityLog} isRunning={isAgentRunning} />

              <div className="space-y-6">
                {decision ? (
                  <RoutePanel mandate={activeMandate} decision={decision} />
                ) : (
                  <section
                    aria-label="What happens next"
                    className="rounded-2xl border border-edge bg-surface p-6 shadow-xs"
                  >
                    <h3 className="text-sm font-semibold text-ink">What happens next</h3>
                    <ol className="mt-4 space-y-3">
                      {[
                        {
                          label: "Authorize the mandate",
                          done: activeMandate.status !== "pending",
                          hint: "Sign the boundaries so Regent may act",
                        },
                        {
                          label: "Activate Regent",
                          done: ["active", "executing", "completed", "rejected"].includes(
                            activeMandate.status,
                          ),
                          hint: "It scans DEX routes and reasons about each clause",
                        },
                        {
                          label: "Watch the decision",
                          done: ["completed", "rejected"].includes(activeMandate.status),
                          hint: "Route comparison and reasoning appear here",
                        },
                        {
                          label: "Execution settles",
                          done: activeMandate.status === "completed",
                          hint: "Gas-abstracted via the 1Shot relayer",
                        },
                      ].map((step, i) => (
                        <li key={step.label} className="flex items-start gap-3">
                          <span
                            className={`tnum mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] ${
                              step.done
                                ? "border border-positive bg-positive text-white"
                                : "border border-edge bg-panel text-muted"
                            }`}
                            aria-hidden="true"
                          >
                            {step.done ? "✓" : i + 1}
                          </span>
                          <div>
                            <p className={`text-xs font-medium ${step.done ? "text-ink" : "text-muted"}`}>{step.label}</p>
                            <p className="text-[11px] text-muted">{step.hint}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                    {activeMandate.status === "pending" && (
                      <Link
                        href="/mandate"
                        className="mt-5 inline-flex h-9 items-center rounded-full bg-ink px-4 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                      >
                        Finish authorization
                      </Link>
                    )}
                  </section>
                )}

                {executionResult && <ExecutionResultPanel mandate={activeMandate} result={executionResult} />}
              </div>
            </div>

            {history.length > 0 && (
              <section aria-label="Mandate history" className="pt-4">
                <h2 className="mb-3 font-mono text-xs font-semibold tracking-[0.18em] text-muted uppercase">History</h2>
                <div className="space-y-2">
                  {history.map((m) => (
                    <MandateRow key={m.id} mandate={m} onView={viewMandate} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}

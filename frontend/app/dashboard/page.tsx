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
      className={`animate-pulse-soft rounded-2xl border border-edge bg-surface ${tall ? "h-80" : "h-44"}`}
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
    <>
      <AppHeader walletAddress={walletAddress} onConnect={connect} health={agentHealth} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
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
          <div className="flex flex-col items-center py-24 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-edge bg-surface">
              <Crown className="h-7 w-7 text-brass" aria-hidden="true" />
            </span>
            <h1 className="mt-6 font-display text-3xl text-cream">No active mandate</h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-fog">
              Give Regent a goal, a budget, and boundaries. It does the rest — and can never go beyond
              what you sign.
            </p>
            <Link
              href="/mandate"
              className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-brass px-6 text-sm font-semibold text-ink transition-colors hover:bg-brass-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
            >
              Create a mandate
            </Link>

            {history.length > 0 && (
              <section aria-label="Previous mandates" className="mt-14 w-full max-w-2xl text-left">
                <h2 className="mb-3 text-xs font-medium tracking-[0.18em] text-dim uppercase">
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
                <h1 className="font-display text-3xl text-cream">Dashboard</h1>
                <p className="mt-1 text-sm text-fog">Regent operates inside the boundaries below.</p>
              </div>
              <div className="flex gap-2">
                {activeMandate.status === "authorized" && (
                  <button
                    onClick={() => evaluateAgent(activeMandate.id)}
                    disabled={isAgentRunning}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-brass px-6 text-sm font-semibold text-ink transition-colors hover:bg-brass-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:opacity-50"
                  >
                    <Play className="h-4 w-4" aria-hidden="true" />
                    {isAgentRunning ? "Regent is working…" : "Activate Regent"}
                  </button>
                )}
                {activeMandate.status === "active" && decision?.selectedRoute && !executionResult && (
                  <button
                    onClick={() => executeAgent(activeMandate.id)}
                    disabled={isAgentRunning}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-brass px-6 text-sm font-semibold text-ink transition-colors hover:bg-brass-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    {isAgentRunning ? "Executing…" : `Execute on ${decision.selectedRoute.dex}`}
                  </button>
                )}
                {["completed", "rejected", "revoked"].includes(activeMandate.status) && (
                  <>
                    <button
                      onClick={resetAgent}
                      className="inline-flex h-11 items-center gap-2 rounded-full border border-edge px-5 text-sm font-medium text-fog transition-colors hover:border-edge-strong hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" /> Dismiss
                    </button>
                    <Link
                      href="/mandate"
                      className="inline-flex h-11 items-center rounded-full bg-brass px-6 text-sm font-semibold text-ink transition-colors hover:bg-brass-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
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
                    className="rounded-2xl border border-edge bg-surface p-6"
                  >
                    <h3 className="text-sm font-semibold text-cream">What happens next</h3>
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
                            className={`tnum mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] ${
                              step.done
                                ? "border-positive/40 bg-positive/10 text-positive"
                                : "border-edge text-dim"
                            }`}
                            aria-hidden="true"
                          >
                            {step.done ? "✓" : i + 1}
                          </span>
                          <div>
                            <p className={`text-sm ${step.done ? "text-cream" : "text-fog"}`}>{step.label}</p>
                            <p className="text-xs text-dim">{step.hint}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                    {activeMandate.status === "pending" && (
                      <Link
                        href="/mandate"
                        className="mt-5 inline-flex h-10 items-center rounded-full border border-brass/40 px-5 text-sm font-medium text-brass transition-colors hover:bg-brass-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
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
              <section aria-label="Mandate history">
                <h2 className="mb-3 text-xs font-medium tracking-[0.18em] text-dim uppercase">History</h2>
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
    </>
  )
}

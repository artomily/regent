"use client"

import {
  ArrowRight,
  Bot,
  Crown,
  Play,
  RotateCcw,
  Send,
  Shield,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { ActivityFeed } from "@/components/activity-feed"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardRail } from "@/components/dashboard/dashboard-rail"
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs"
import { MetricCards } from "@/components/dashboard/metric-cards"
import { RightTiles } from "@/components/dashboard/right-tiles"
import { StatisticsPanel } from "@/components/dashboard/statistics-panel"
import type { DashboardTab } from "@/components/dashboard/types"
import { ExecutionResultPanel } from "@/components/execution-result"
import { MandateCard, MandateRow } from "@/components/mandate-card"
import { RoutePanel } from "@/components/route-panel"
import { useRegent } from "@/hooks/use-regent"

function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="flex w-full max-w-7xl animate-pulse-soft flex-col gap-6 rounded-[32px] border border-edge/60 bg-surface p-6 shadow-sm md:flex-row">
        <div className="hidden h-140 w-16 shrink-0 rounded-3xl bg-panel md:block" />
        <div className="flex-1 space-y-6">
          <div className="h-16 w-3/4 rounded-2xl bg-panel" />
          <div className="h-10 w-1/2 rounded-full bg-panel" />
          <div className="grid gap-5 md:grid-cols-3">
            <div className="h-44 rounded-3xl bg-panel" />
            <div className="h-44 rounded-3xl bg-panel" />
            <div className="h-44 rounded-3xl bg-panel" />
          </div>
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="h-80 rounded-3xl bg-panel lg:col-span-8" />
            <div className="h-80 rounded-3xl bg-panel lg:col-span-4" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading dashboard…</span>
    </div>
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

  const [activeTab, setActiveTab] = useState<DashboardTab>("overview")

  const history = mandates.filter((m) => m.id !== activeMandate?.id)

  if (!hydrated) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen w-full bg-canvas text-ink antialiased">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col p-3 sm:p-6 lg:p-8">
        {/* App Shell Container modeled on the SaaS reference */}
        <div className="relative flex flex-1 flex-col overflow-hidden rounded-[28px] border border-edge/60 bg-surface/90 p-4 shadow-sm backdrop-blur-md md:flex-row md:p-6 lg:rounded-[36px] lg:p-8">
          {/* Left Vertical Icon Rail (Bottom Bar on Mobile) */}
          <DashboardRail
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            walletAddress={walletAddress}
            onOpenSettings={() => setActiveTab("agent")}
          />

          {/* Main Dashboard Canvas */}
          <main className="flex flex-1 flex-col min-w-0 md:pl-6 lg:pl-8 pb-20 md:pb-0">
            {/* Header: Editorial headline with inline pills and right-side CTA */}
            <DashboardHeader onOpenSettings={() => setActiveTab("agent")} />

            {/* Pill Tab Navigation */}
            <div className="mt-6 mb-7">
              <DashboardTabs
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                mandatesCount={mandates.length}
                activityCount={activityLog.length}
              />
            </div>

            {/* Client-Side View Switching */}
            {activeTab === "overview" && (
              <div className="space-y-7">
                {/* Metric Cards Row */}
                <MetricCards
                  activeMandate={activeMandate}
                  mandates={mandates}
                  decision={decision}
                  executionResult={executionResult}
                  isAgentRunning={isAgentRunning}
                  onEvaluateAgent={() => activeMandate && evaluateAgent(activeMandate.id)}
                  onExecuteAgent={() => activeMandate && executeAgent(activeMandate.id)}
                />

                {/* Primary Content Grid: Statistics Panel + Right Tiles */}
                <div className="grid gap-6 lg:grid-cols-12 items-start">
                  <div className="lg:col-span-8 space-y-6">
                    <StatisticsPanel activityLog={activityLog} mandates={mandates} />

                    {/* Active Mandate Highlights / Quick Access Banner */}
                    {activeMandate ? (
                      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-edge/60 bg-panel-sage p-6 shadow-xs">
                        <div className="flex items-center gap-4">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pure-white text-ink shadow-2xs">
                            <Shield className="h-6 w-6 text-ink" aria-hidden="true" />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold tracking-wide text-ink uppercase">
                                Active Mandate
                              </span>
                              <span className="rounded-full bg-lime px-2 py-0.5 font-mono text-[10px] font-bold text-ink uppercase">
                                {activeMandate.status}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-ink/90 font-medium">
                              {activeMandate.goal}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          {activeMandate.status === "authorized" && (
                            <button
                              onClick={() => evaluateAgent(activeMandate.id)}
                              disabled={isAgentRunning}
                              className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-xs font-semibold text-pure-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                              <Play className="h-3.5 w-3.5 text-lime" aria-hidden="true" />
                              {isAgentRunning ? "Running…" : "Activate Regent"}
                            </button>
                          )}
                          <button
                            onClick={() => setActiveTab("mandates")}
                            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-edge bg-pure-white px-4 text-xs font-semibold text-ink shadow-2xs transition-colors hover:bg-panel"
                          >
                            <span>View details</span>
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-edge/60 bg-panel-sage p-6 shadow-xs">
                        <div className="flex items-center gap-4">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pure-white text-ink shadow-2xs">
                            <Crown className="h-6 w-6 text-ink" aria-hidden="true" />
                          </span>
                          <div>
                            <h3 className="text-sm font-semibold text-ink">No active mandate</h3>
                            <p className="mt-0.5 text-xs text-muted">
                              Authorize a spending boundary and let Regent act on your behalf.
                            </p>
                          </div>
                        </div>
                        <Link
                          href="/mandate"
                          className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-xs font-semibold text-pure-white shadow-xs transition-opacity hover:opacity-90"
                        >
                          <span>Create a mandate</span>
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Status Tiles & Links */}
                  <div className="lg:col-span-4">
                    <RightTiles
                      walletAddress={walletAddress}
                      activeMandate={activeMandate}
                      agentHealth={agentHealth}
                      onConnectWallet={connect}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Mandates */}
            {activeTab === "mandates" && (
              <div className="space-y-6">
                {activeMandate ? (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h2 className="font-display text-2xl font-light tracking-tight text-ink">
                          Active Mandate
                        </h2>
                        <p className="mt-0.5 text-xs text-muted">
                          Regent operates strictly inside these signed boundaries.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {activeMandate.status === "authorized" && (
                          <button
                            onClick={() => evaluateAgent(activeMandate.id)}
                            disabled={isAgentRunning}
                            className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-xs font-semibold text-pure-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50"
                          >
                            <Play className="h-3.5 w-3.5 text-lime" aria-hidden="true" />
                            {isAgentRunning ? "Regent is working…" : "Activate Regent"}
                          </button>
                        )}
                        {activeMandate.status === "active" && decision?.selectedRoute && !executionResult && (
                          <button
                            onClick={() => executeAgent(activeMandate.id)}
                            disabled={isAgentRunning}
                            className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-xs font-semibold text-pure-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50"
                          >
                            <Send className="h-3.5 w-3.5 text-lime" aria-hidden="true" />
                            {isAgentRunning ? "Executing…" : `Execute on ${decision.selectedRoute.dex}`}
                          </button>
                        )}
                        {["completed", "rejected", "revoked"].includes(activeMandate.status) && (
                          <button
                            onClick={resetAgent}
                            className="inline-flex h-10 items-center gap-2 rounded-full border border-edge bg-surface px-4 text-xs font-medium text-ink transition-colors hover:bg-panel"
                          >
                            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Dismiss
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-edge/60 bg-panel-sage p-5 sm:p-6 shadow-xs">
                      <MandateCard mandate={activeMandate} onRevoke={revokeMandate} />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-3xl border border-edge/60 bg-panel-sage p-12 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pure-white text-ink shadow-2xs">
                      <Crown className="h-7 w-7" aria-hidden="true" />
                    </span>
                    <h2 className="mt-4 font-display text-2xl font-light text-ink">No active mandate</h2>
                    <p className="mt-1 max-w-sm text-xs text-muted">
                      Create and sign a mandate to delegate swap execution within strict budget and slippage ceilings.
                    </p>
                    <Link
                      href="/mandate"
                      className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-xs font-semibold text-pure-white shadow-xs transition-opacity hover:opacity-90"
                    >
                      Create a mandate
                    </Link>
                  </div>
                )}

                {/* Mandate History */}
                {history.length > 0 && (
                  <section aria-label="Previous mandates" className="mt-8">
                    <h3 className="mb-3 font-mono text-xs font-semibold tracking-[0.18em] text-muted uppercase">
                      Previous mandates
                    </h3>
                    <div className="space-y-2.5">
                      {history.map((m) => (
                        <div key={m.id} className="rounded-2xl border border-edge/60 bg-panel-sage p-2 shadow-xs">
                          <MandateRow mandate={m} onView={viewMandate} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* Tab: Activity */}
            {activeTab === "activity" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-light tracking-tight text-ink">
                    Agent Activity Log
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    Real-time verification events, pricing scans, and execution transactions.
                  </p>
                </div>
                <div className="rounded-3xl border border-edge/60 bg-panel-sage p-4 sm:p-6 shadow-xs">
                  <ActivityFeed events={activityLog} isRunning={isAgentRunning} />
                </div>
              </div>
            )}

            {/* Tab: Routes */}
            {activeTab === "routes" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-light tracking-tight text-ink">
                    DEX Route Comparison
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    Venice AI evaluates liquidity pools across Base Sepolia to guarantee execution within budget.
                  </p>
                </div>

                {decision && activeMandate ? (
                  <div className="space-y-6">
                    <div className="rounded-3xl border border-edge/60 bg-panel-sage p-4 sm:p-6 shadow-xs">
                      <RoutePanel mandate={activeMandate} decision={decision} />
                    </div>
                    {executionResult && (
                      <div className="rounded-3xl border border-edge/60 bg-panel-sage p-4 sm:p-6 shadow-xs">
                        <ExecutionResultPanel mandate={activeMandate} result={executionResult} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-3xl border border-edge/60 bg-panel-sage p-12 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pure-white text-ink shadow-2xs">
                      <Bot className="h-7 w-7 text-ink" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 font-display text-xl font-light text-ink">
                      No routes evaluated yet
                    </h3>
                    <p className="mt-1 max-w-sm text-xs text-muted">
                      Activate Regent on an authorized mandate to evaluate DEX quotes and select the optimal execution path.
                    </p>
                    {activeMandate?.status === "authorized" && (
                      <button
                        onClick={() => evaluateAgent(activeMandate.id)}
                        disabled={isAgentRunning}
                        className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-xs font-semibold text-pure-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        <Play className="h-4 w-4 text-lime" aria-hidden="true" />
                        <span>Run agent</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Agent */}
            {activeTab === "agent" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-light tracking-tight text-ink">
                    Venice AI Agent Configuration
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    Autonomous reasoning model, relayer settings, and on-chain verification engine.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex flex-col justify-between rounded-3xl border border-edge/60 bg-panel-sage p-6 shadow-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pure-white text-ink shadow-2xs">
                          <Bot className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span
                          className={`tnum rounded-full border border-edge bg-pure-white px-2.5 py-0.5 font-mono text-[10px] font-semibold ${
                            agentHealth?.ok ? "text-positive" : "text-muted"
                          }`}
                        >
                          {agentHealth?.ok ? "Service Active" : "Simulator Mode"}
                        </span>
                      </div>
                      <h3 className="mt-4 font-semibold text-ink">Intelligence Engine</h3>
                      <p className="mt-1 text-xs text-muted leading-relaxed">
                        Evaluates swap routes against mandate limits using Venice AI with zero telemetry retention.
                      </p>
                    </div>

                    <div className="mt-6 border-t border-edge/40 pt-4 font-mono text-xs text-muted space-y-1">
                      <p>Mode: <span className="text-ink font-semibold">{agentHealth?.mode.intelligence ?? "simulated"}</span></p>
                      <p>Uptime: <span className="text-ink font-semibold">{agentHealth?.uptimeSeconds ? `${agentHealth.uptimeSeconds}s` : "local"}</span></p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between rounded-3xl border border-edge/60 bg-panel-sage p-6 shadow-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pure-white text-ink shadow-2xs">
                          <Sparkles className="h-5 w-5 text-lime" aria-hidden="true" />
                        </span>
                        <span className="tnum rounded-full border border-edge bg-pure-white px-2.5 py-0.5 font-mono text-[10px] font-semibold text-ink">
                          1Shot Relayer
                        </span>
                      </div>
                      <h3 className="mt-4 font-semibold text-ink">Settlement Relayer</h3>
                      <p className="mt-1 text-xs text-muted leading-relaxed">
                        Submits signed transactions gas-abstracted onto Base Sepolia, verifying boundaries on-chain.
                      </p>
                    </div>

                    <div className="mt-6 border-t border-edge/40 pt-4 font-mono text-xs text-muted space-y-1">
                      <p>Execution: <span className="text-ink font-semibold">{agentHealth?.mode.execution ?? "simulated"}</span></p>
                      <p>Relayer: <span className="text-ink font-semibold">1Shot v1</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

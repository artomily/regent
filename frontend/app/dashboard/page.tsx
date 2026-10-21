"use client"

import { ArrowRight, Bot, Crown, Play, Plus, Shield, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ActivityFeed } from "@/components/activity-feed"
import { CreateMandateDialog } from "@/components/dashboard/create-mandate-dialog"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell, DashboardSkeleton } from "@/components/dashboard/dashboard-shell"
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs"
import { MetricCards } from "@/components/dashboard/metric-cards"
import { RightTiles } from "@/components/dashboard/right-tiles"
import { StatisticsPanel } from "@/components/dashboard/statistics-panel"
import type { DashboardTab } from "@/components/dashboard/types"
import { MandateRow } from "@/components/mandate-card"
import { VeniceKeyCard } from "@/components/venice-key-card"
import { useRegent } from "@/hooks/use-regent"

const TABS: DashboardTab[] = ["overview", "mandates", "activity", "routes", "agent"]

// The dashboard renders only after hydration, so the URL can seed state directly.
function readQuery(): URLSearchParams {
  return typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search)
}

function initialTab(): DashboardTab {
  const tab = readQuery().get("tab") as DashboardTab | null
  return tab && TABS.includes(tab) ? tab : "overview"
}

export default function Dashboard() {
  const router = useRouter()
  const {
    hydrated,
    walletAddress,
    smartAccountAddress,
    smartAccountUSDCBalance,
    fundSmartAccount,
    refreshSmartAccountBalance,
    mandates,
    activeMandate,
    activityLog,
    decision,
    executionResult,
    isAgentRunning,
    agentHealth,
    connect,
    createMandate,
    authorizeMandate,
    evaluateAgent,
    executeAgent,
  } = useRegent()

  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab)
  const [createOpen, setCreateOpen] = useState(() => readQuery().get("new") === "1")

  const openCreate = () => setCreateOpen(true)
  const closeCreate = () => {
    setCreateOpen(false)
    // Drop ?new=1 so a reload does not reopen the dialog.
    if (readQuery().has("new")) window.history.replaceState(null, "", "/dashboard")
  }

  if (!hydrated) {
    return <DashboardSkeleton />
  }

  const detailHref = (id: string) => `/dashboard/mandates/${id}`

  return (
    <DashboardShell walletAddress={walletAddress} activeTab={activeTab} onSelectTab={setActiveTab}>
      <DashboardHeader onOpenSettings={() => setActiveTab("agent")} onCreateMandate={openCreate} />

      <div className="mt-6 mb-7">
        <DashboardTabs
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          mandatesCount={mandates.length}
          activityCount={activityLog.length}
        />
      </div>

      {activeTab === "overview" && (
        <div className="space-y-7">
          <MetricCards
            activeMandate={activeMandate}
            mandates={mandates}
            decision={decision}
            executionResult={executionResult}
            isAgentRunning={isAgentRunning}
            onEvaluateAgent={() => activeMandate && evaluateAgent(activeMandate.id)}
            onExecuteAgent={() => activeMandate && executeAgent(activeMandate.id)}
          />

          <div className="grid items-start gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <StatisticsPanel activityLog={activityLog} mandates={mandates} onCreateMandate={openCreate} />

              {activeMandate ? (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-edge/60 bg-panel-sage p-6 shadow-xs">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pure-white text-ink shadow-2xs">
                      <Shield className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold tracking-wide text-ink uppercase">Active mandate</span>
                        <span className="rounded-full bg-lime px-2 py-0.5 font-mono text-[10px] font-bold text-ink uppercase">
                          {activeMandate.status}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm font-medium text-ink/90">{activeMandate.goal}</p>
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
                    <Link
                      href={detailHref(activeMandate.id)}
                      className="inline-flex h-10 items-center gap-1.5 rounded-full border border-edge bg-pure-white px-4 text-xs font-semibold text-ink shadow-2xs transition-colors hover:bg-panel"
                    >
                      <span>View details</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ) : (
                <EmptyMandate onCreate={openCreate} />
              )}
            </div>

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

      {activeTab === "mandates" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-light tracking-tight text-ink">All mandates</h2>
              <p className="mt-0.5 text-xs text-muted">Open a mandate to run the agent, inspect routes or revoke it.</p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-xs font-semibold text-pure-white shadow-xs transition-opacity hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> New mandate
            </button>
          </div>

          {mandates.length > 0 ? (
            <ul className="space-y-2.5">
              {mandates.map((m) => (
                <li key={m.id}>
                  <MandateRow mandate={m} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyMandate onCreate={openCreate} />
          )}
        </div>
      )}

      {activeTab === "activity" && (
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-light tracking-tight text-ink">Agent activity log</h2>
            <p className="mt-0.5 text-xs text-muted">
              Verification events, pricing scans and execution transactions for the current mandate.
            </p>
          </div>
          <div className="rounded-3xl border border-edge/60 bg-panel-sage p-4 shadow-xs sm:p-6">
            <ActivityFeed events={activityLog} isRunning={isAgentRunning} />
          </div>
        </div>
      )}

      {activeTab === "routes" && (
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-light tracking-tight text-ink">DEX route comparison</h2>
            <p className="mt-0.5 text-xs text-muted">
              Venice AI compares Uniswap quotes on Base Sepolia before anything executes.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-3xl border border-edge/60 bg-panel-sage p-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pure-white text-ink shadow-2xs">
              <Bot className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-display text-xl font-light text-ink">
              {decision ? "Routes live on the mandate page" : "No routes evaluated yet"}
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted">
              Every evaluation belongs to a mandate. Open one to compare routes and execute the selected path.
            </p>
            {activeMandate ? (
              <Link
                href={detailHref(activeMandate.id)}
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-xs font-semibold text-pure-white shadow-xs transition-opacity hover:opacity-90"
              >
                Open current mandate <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ) : (
              <button
                onClick={openCreate}
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-xs font-semibold text-pure-white shadow-xs transition-opacity hover:opacity-90"
              >
                Create a mandate
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === "agent" && (
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-light tracking-tight text-ink">Agent configuration</h2>
            <p className="mt-0.5 text-xs text-muted">Reasoning model, execution path and your Venice key.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div className="flex flex-col justify-between rounded-3xl border border-edge/60 bg-panel-sage p-6 shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pure-white text-ink shadow-2xs">
                    <Bot className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span
                    className={`rounded-full border border-edge bg-pure-white px-2.5 py-0.5 font-mono text-[10px] font-semibold ${
                      agentHealth?.ok ? "text-positive" : "text-muted"
                    }`}
                  >
                    {agentHealth?.ok ? "Service active" : "Simulator mode"}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold text-ink">Intelligence engine</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Venice AI evaluates swap routes against mandate limits, with a labelled heuristic fallback.
                </p>
              </div>
              <div className="mt-6 space-y-1 border-t border-edge/40 pt-4 font-mono text-xs text-muted">
                <p>
                  Mode: <span className="font-semibold text-ink">{agentHealth?.mode.intelligence ?? "simulated"}</span>
                </p>
                <p>
                  Uptime:{" "}
                  <span className="tnum font-semibold text-ink">
                    {agentHealth?.uptimeSeconds ? `${agentHealth.uptimeSeconds}s` : "local"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-3xl border border-edge/60 bg-panel-sage p-6 shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pure-white text-ink shadow-2xs">
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="rounded-full border border-edge bg-pure-white px-2.5 py-0.5 font-mono text-[10px] font-semibold text-ink">
                    ERC-7710
                  </span>
                </div>
                <h3 className="mt-4 font-semibold text-ink">Delegated execution</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  The agent records the spend on RegentMandate, then redeems your approve and swap delegations in
                  one transaction.
                </p>
              </div>
              <div className="mt-6 border-t border-edge/40 pt-4 font-mono text-xs text-muted">
                <p>
                  Execution: <span className="font-semibold text-ink">{agentHealth?.mode.execution ?? "simulated"}</span>
                </p>
              </div>
            </div>

            <div className="md:col-span-2 xl:col-span-1">
              <VeniceKeyCard />
            </div>
          </div>
        </div>
      )}

      <CreateMandateDialog
        open={createOpen}
        onClose={closeCreate}
        walletAddress={walletAddress}
        smartAccountAddress={smartAccountAddress}
        smartAccountBalance={smartAccountUSDCBalance}
        onFundSmartAccount={fundSmartAccount}
        onRefreshBalance={refreshSmartAccountBalance}
        onCreate={createMandate}
        onAuthorize={authorizeMandate}
        // Navigating away unmounts the dialog; closing it first would fire onClose and its URL rewrite.
        onDone={(m) => router.push(detailHref(m.id))}
      />
    </DashboardShell>
  )
}

function EmptyMandate({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-edge/60 bg-panel-sage p-6 shadow-xs">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pure-white text-ink shadow-2xs">
          <Crown className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-ink">No active mandate</h3>
          <p className="mt-0.5 text-xs text-muted">Authorize a spending boundary and let Regent act on your behalf.</p>
        </div>
      </div>
      <button
        onClick={onCreate}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-xs font-semibold text-pure-white shadow-xs transition-opacity hover:opacity-90"
      >
        <span>Create a mandate</span>
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

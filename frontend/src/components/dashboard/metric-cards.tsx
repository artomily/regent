"use client"

import {
  ArrowUpRight,
  MoreVertical,
  Play,
  RotateCw,
  Send,
  Sliders,
  Sparkles,
  Zap,
} from "lucide-react"
import { formatAmount } from "@/lib/format"
import type { AgentDecision, ExecutionResult, Mandate } from "@/lib/types"

interface MetricCardsProps {
  activeMandate: Mandate | null
  mandates: Mandate[]
  decision: AgentDecision | null
  executionResult: ExecutionResult | null
  isAgentRunning: boolean
  onEvaluateAgent?: () => void
  onExecuteAgent?: () => void
}

export function MetricCards({
  activeMandate,
  mandates,
  decision,
  executionResult,
  isAgentRunning,
  onEvaluateAgent,
  onExecuteAgent,
}: MetricCardsProps) {
  // Card 1 calculations: Budget spent
  const spent = activeMandate?.spent ?? 0
  const budget = activeMandate?.budget ?? (mandates.length > 0 ? mandates[0].budget : 500)
  const currency = activeMandate?.sourceAsset ?? "USDC"
  const budgetPct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0
  const budgetSegments = 8
  const budgetFilled = Math.min(budgetSegments, Math.max(0, Math.round((budgetPct / 100) * budgetSegments)))

  // Card 2 calculations: Executions
  const completedExecutions = mandates.filter((m) => m.status === "completed").length
  const totalLimit = Math.max(mandates.length, 5)
  const execPct = totalLimit > 0 ? Math.min(100, Math.round((completedExecutions / totalLimit) * 100)) : 0
  const execSegments = 8
  const execFilled = Math.min(execSegments, Math.max(0, Math.round((execPct / 100) * execSegments)))

  // Card 3 promo action logic
  const canExecute = activeMandate?.status === "active" && Boolean(decision?.selectedRoute) && !executionResult
  const canEvaluate = activeMandate?.status === "authorized" || (!activeMandate && mandates.length > 0)
  const handlePromoAction = () => {
    if (canExecute && onExecuteAgent) {
      onExecuteAgent()
    } else if (onEvaluateAgent) {
      onEvaluateAgent()
    }
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {/* CARD 1: Budget spent (Soft sage surface) */}
      <section
        aria-label="Budget spent overview"
        className="flex flex-col justify-between rounded-3xl border border-edge/60 bg-panel-sage p-6 shadow-xs sm:p-7"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-edge/50 bg-pure-white text-ink shadow-2xs">
              <Sliders className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-ink">Budget spent</span>
          </div>
          <button
            aria-label="Budget options"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <MoreVertical className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="my-6">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="tnum font-mono text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                {formatAmount(spent)}
              </span>
              <span className="tnum font-mono text-sm text-muted">
                / {formatAmount(budget)} {currency}
              </span>
            </div>
            <span className="tnum inline-flex items-center gap-1 rounded-full border border-edge bg-pure-white px-2.5 py-0.5 font-mono text-xs font-semibold text-ink shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" aria-hidden="true" />
              {budgetPct}%
            </span>
          </div>
        </div>

        {/* Segmented capsule progress bar */}
        <div>
          <div
            className="flex items-center gap-1.5 sm:gap-2"
            role="progressbar"
            aria-valuenow={budgetPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Budget spent ${budgetPct}%`}
          >
            {Array.from({ length: budgetSegments }).map((_, i) => {
              const isFilled = i < budgetFilled
              return (
                <div
                  key={i}
                  className={`h-11 flex-1 rounded-full transition-colors ${
                    isFilled
                      ? "bg-ink shadow-xs"
                      : "border border-dashed border-edge-strong bg-transparent"
                  }`}
                />
              )
            })}
          </div>
        </div>
      </section>

      {/* CARD 2: Executions (Soft luminous lime surface) */}
      <section
        aria-label="Executions overview"
        className="flex flex-col justify-between rounded-3xl border border-lime/40 bg-lime-card p-6 shadow-xs sm:p-7"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-ink/10 bg-pure-white text-ink shadow-2xs">
              <Zap className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-ink">Executions</span>
          </div>
          <button
            aria-label="Executions options"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink/60 transition-colors hover:bg-pure-white/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <MoreVertical className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="my-6">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="tnum font-mono text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                {completedExecutions}
              </span>
              <span className="tnum font-mono text-sm text-ink/70">
                / {totalLimit} total
              </span>
            </div>
            <span className="tnum inline-flex items-center gap-1 rounded-full border border-ink/10 bg-pure-white px-2.5 py-0.5 font-mono text-xs font-semibold text-ink shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
              {execPct}%
            </span>
          </div>
        </div>

        {/* Segmented capsule progress bar */}
        <div>
          <div
            className="flex items-center gap-1.5 sm:gap-2"
            role="progressbar"
            aria-valuenow={execPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Executions completed ${execPct}%`}
          >
            {Array.from({ length: execSegments }).map((_, i) => {
              const isFilled = i < execFilled
              return (
                <div
                  key={i}
                  className={`h-11 flex-1 rounded-full transition-colors ${
                    isFilled
                      ? "bg-ink shadow-xs"
                      : "border border-dashed border-ink/25 bg-transparent"
                  }`}
                />
              )
            })}
          </div>
        </div>
      </section>

      {/* CARD 3: Promo card (Venice decides the next route) */}
      <section
        aria-label="Venice AI agent action"
        className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-edge/30 bg-hero-bg p-6 text-pure-white shadow-lg md:col-span-2 lg:col-span-1 sm:p-7"
      >
        {/* Token gradient glows */}
        <div
          className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-hero-glow-lime blur-3xl opacity-60"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-hero-glow-amber blur-2xl opacity-40"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-pure-white/20 bg-pure-white/10 px-3 py-1 text-[11px] font-medium tracking-wide text-pure-white backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-lime" aria-hidden="true" />
              Autonomous Engine
            </span>
            <ArrowUpRight className="h-4.5 w-4.5 text-dim" aria-hidden="true" />
          </div>

          <h2 className="mt-4 font-display text-2xl font-light tracking-tight text-pure-white sm:text-3xl">
            Venice decides the next route
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-dim">
            Zero-knowledge reasoning scans liquidity pools, verifying bounds before any transaction.
          </p>
        </div>

        <div className="relative z-10 mt-6 pt-2">
          <button
            onClick={handlePromoAction}
            disabled={isAgentRunning || (!canEvaluate && !canExecute)}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-pure-white px-5 text-xs font-semibold text-ink shadow-md transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime disabled:opacity-50"
          >
            {isAgentRunning ? (
              <>
                <RotateCw className="h-3.5 w-3.5 animate-spin text-ink" aria-hidden="true" />
                <span>Evaluating routes…</span>
              </>
            ) : canExecute ? (
              <>
                <Send className="h-3.5 w-3.5 text-ink" aria-hidden="true" />
                <span>Execute route</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-ink text-ink" aria-hidden="true" />
                <span>Run agent</span>
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  )
}

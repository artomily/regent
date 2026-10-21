"use client"

import { ArrowRight, BarChart2, ChevronDown } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { formatAmount } from "@/lib/format"
import type { ActivityEvent, Mandate } from "@/lib/types"

interface StatisticsPanelProps {
  activityLog: ActivityEvent[]
  mandates: Mandate[]
  onCreateMandate?: () => void
}

interface DayData {
  key: string
  label: string
  isToday: boolean
  hasData: boolean
  spent: number
  executions: number
  spentRatio: number // 0 to 1
  execRatio: number // 0 to 1
  tooltipText?: string
  tooltipVariant?: "ink" | "lime"
}

function parseSpentFromEvent(ev: ActivityEvent): number {
  if (typeof ev.metadata?.spentAmount === "number") {
    return ev.metadata.spentAmount
  }
  const match = ev.message.match(/Spent\s+([0-9.]+)/i)
  if (match) {
    const val = parseFloat(match[1])
    return isNaN(val) ? 0 : val
  }
  return 0
}

function isExecutionEvent(ev: ActivityEvent): boolean {
  return ev.step === "confirming_transaction" || ev.step === "executing_swap"
}

export function StatisticsPanel({ activityLog, mandates, onCreateMandate }: StatisticsPanelProps) {
  const [period, setPeriod] = useState<"7d" | "30d" | "all">("7d")
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null)

  // Derive per-day real data from activityLog & mandates
  const daysData = useMemo<DayData[]>(() => {
    const days: DayData[] = []
    const now = new Date()

    // 1. Gather raw execution data per day across the past 8 days
    const rawDays: Array<{
      key: string
      label: string
      isToday: boolean
      spent: number
      executions: number
    }> = []

    for (let i = 7; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      const dayEnd = dayStart + 86400000

      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      const label = d.toLocaleDateString("en-US", { day: "numeric", month: "short" })

      // Execution events from activityLog on this day
      const dayEvents = activityLog.filter(
        (ev) => ev.timestamp >= dayStart && ev.timestamp < dayEnd,
      )
      const executionEvents = dayEvents.filter(isExecutionEvent)

      let daySpent = 0
      let dayExecutions = 0
      const handledMandateIds = new Set<string>()

      for (const ev of executionEvents) {
        daySpent += parseSpentFromEvent(ev)
        dayExecutions += 1
        handledMandateIds.add(ev.mandateId)
      }

      // Also account for completed or spent mandates created on this day that might not be in activityLog
      const dayMandates = mandates.filter(
        (m) =>
          m.createdAt >= dayStart &&
          m.createdAt < dayEnd &&
          !handledMandateIds.has(m.id) &&
          (m.spent > 0 || m.status === "completed"),
      )

      for (const m of dayMandates) {
        daySpent += m.spent || 0
        dayExecutions += 1
      }

      rawDays.push({
        key,
        label,
        isToday: i === 0,
        spent: daySpent,
        executions: dayExecutions,
      })
    }

    // 2. Normalize against the real maximum day in the period
    const maxSpent = Math.max(...rawDays.map((d) => d.spent), 0)
    const maxExecutions = Math.max(...rawDays.map((d) => d.executions), 0)

    for (const raw of rawDays) {
      const hasData = raw.spent > 0 || raw.executions > 0
      const spentRatio = maxSpent > 0 ? raw.spent / maxSpent : 0
      const execRatio = maxExecutions > 0 ? raw.executions / maxExecutions : 0

      let tooltipText: string | undefined = undefined
      if (hasData) {
        if (raw.spent > 0 && raw.executions > 0) {
          tooltipText = `${formatAmount(raw.spent)} USDC (${raw.executions} ${raw.executions === 1 ? "exec" : "execs"})`
        } else if (raw.spent > 0) {
          tooltipText = `${formatAmount(raw.spent)} USDC`
        } else {
          tooltipText = `${raw.executions} ${raw.executions === 1 ? "exec" : "execs"}`
        }
      }

      days.push({
        key: raw.key,
        label: raw.label,
        isToday: raw.isToday,
        hasData,
        spent: raw.spent,
        executions: raw.executions,
        spentRatio,
        execRatio,
        tooltipText,
        tooltipVariant: raw.executions > 0 && raw.spent === 0 ? "lime" : "ink",
      })
    }

    return days
  }, [activityLog, mandates])

  const maxSpentInPeriod = useMemo(
    () => Math.max(...daysData.map((d) => d.spent), 0),
    [daysData],
  )

  const hasAnyData = useMemo(() => daysData.some((d) => d.hasData), [daysData])

  // Derive real scale ticks if data exists, otherwise omit ticks
  const yTicks = useMemo(() => {
    if (maxSpentInPeriod <= 0) return []
    return [
      maxSpentInPeriod,
      maxSpentInPeriod * 0.75,
      maxSpentInPeriod * 0.5,
      maxSpentInPeriod * 0.25,
      0,
    ]
  }, [maxSpentInPeriod])

  return (
    <section
      aria-label="Execution statistics"
      className="flex flex-col justify-between rounded-3xl border border-edge/60 bg-panel-sage p-6 shadow-xs sm:p-7"
    >
      {/* Top Header: Title, Legend, and Period Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-edge/40 pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-edge/50 bg-pure-white text-ink shadow-2xs">
            <BarChart2 className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <h2 className="font-display text-2xl font-light tracking-tight text-ink">Statistics</h2>
        </div>

        {/* Legend: matches what is actually plotted */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-ink" aria-hidden="true" />
            <span className="text-xs font-medium text-ink">Budget spent (USDC)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-lime" aria-hidden="true" />
            <span className="text-xs font-medium text-ink">Executions</span>
          </div>
        </div>

        {/* Period Selector */}
        <div className="relative">
          <button
            onClick={() => setPeriod((prev) => (prev === "7d" ? "30d" : prev === "30d" ? "all" : "7d"))}
            className="inline-flex items-center gap-2 rounded-full border border-edge bg-pure-white px-3.5 py-1.5 text-xs font-semibold text-ink shadow-2xs transition-colors hover:bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            aria-label="Select statistics period"
          >
            <span>{period === "7d" ? "Last 7 days" : period === "30d" ? "Last 30 days" : "All time"}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Capsule Bar Chart Area */}
      <div className="relative mt-8 flex flex-1 items-end gap-3 sm:gap-6">
        {/* Y-Axis Scale (derived from real scale, or omitted if empty) */}
        {yTicks.length > 0 && (
          <div className="flex h-64 flex-col justify-between pb-7 font-mono text-[11px] text-muted tnum pr-2 select-none">
            {yTicks.map((val, idx) => (
              <span key={idx}>
                {val > 0 ? `${formatAmount(val)}` : "0.00"}
              </span>
            ))}
          </div>
        )}

        {/* Bars Container */}
        <div className="relative flex h-64 flex-1 items-end justify-between gap-1.5 sm:gap-3 pb-7">
          {/* Horizontal Gridlines */}
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-7 flex flex-col justify-between">
            {yTicks.length > 0 ? (
              yTicks.map((_, idx) => (
                <div key={idx} className="w-full border-b border-edge/40" />
              ))
            ) : (
              <>
                <div className="w-full border-b border-edge/30" />
                <div className="w-full border-b border-edge/30" />
                <div className="w-full border-b border-edge/30" />
                <div className="w-full border-b border-edge/60" />
              </>
            )}
          </div>

          {/* Empty State Callout when there is no data */}
          {!hasAnyData && (
            <div className="pointer-events-auto absolute inset-0 z-30 flex flex-col items-center justify-center p-4 text-center">
              <div className="rounded-2xl border border-edge bg-surface/90 px-5 py-3.5 shadow-sm backdrop-blur-sm">
                <p className="text-xs font-medium text-ink">
                  No executions yet - authorize a mandate and run the agent
                </p>
                {onCreateMandate ? (
                  <button
                    onClick={onCreateMandate}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ink underline underline-offset-4 hover:opacity-80"
                  >
                    <span>Create a mandate</span>
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </button>
                ) : (
                  <Link
                    href="/dashboard?new=1"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ink underline underline-offset-4 hover:opacity-80"
                  >
                    <span>Create a mandate</span>
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Day Columns */}
          {daysData.map((day) => {
            const isSelected = selectedDayKey === day.key
            return (
              <div
                key={day.key}
                onClick={() => setSelectedDayKey(isSelected ? null : day.key)}
                className="group relative flex h-full flex-1 cursor-pointer flex-col items-center justify-end"
              >
                {/* Floating Tooltip Pill (shows real values) */}
                {(day.tooltipText || (isSelected && day.hasData)) && (
                  <div
                    className={`absolute z-20 transition-transform ${
                      day.tooltipVariant === "lime"
                        ? "bg-lime text-ink"
                        : "bg-ink text-pure-white"
                    } -top-3 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold shadow-md whitespace-nowrap tnum`}
                    style={{
                      bottom: day.hasData ? `${Math.min(95, Math.max(18, day.spentRatio * 100 + 4))}%` : "50%",
                      top: "auto",
                    }}
                  >
                    {day.tooltipText}
                  </div>
                )}

                {/* Vertical Bar Capsule */}
                <div className="relative flex h-full w-full max-w-7 sm:max-w-9 items-end justify-center">
                  {day.hasData && (day.spentRatio > 0 || day.execRatio > 0) ? (
                    <div
                      className="relative w-full rounded-full overflow-hidden bg-ink transition-transform group-hover:scale-105 shadow-xs"
                      style={{ height: `${Math.max(16, Math.min(100, Math.max(day.spentRatio, day.execRatio) * 100))}%` }}
                    >
                      {/* Upper ink portion with value dot */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-pure-white/80" />

                      {/* Lower lime portion representing executions */}
                      {day.execRatio > 0 && (
                        <div
                          className="absolute bottom-0 inset-x-0 rounded-b-full bg-lime"
                          style={{
                            height: `${Math.max(20, Math.min(100, (day.execRatio / Math.max(day.spentRatio, day.execRatio, 0.01)) * 100))}%`,
                          }}
                        >
                          {/* Dot at boundary */}
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-ink" />
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Dashed Empty Capsule for days with no activity */
                    <div className="relative h-[80%] w-full rounded-full border border-dashed border-edge-strong bg-transparent transition-transform group-hover:scale-105">
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-edge-strong" />
                    </div>
                  )}
                </div>

                {/* X-Axis Date Label */}
                <span
                  className={`tnum absolute -bottom-6 font-mono text-[11px] whitespace-nowrap transition-colors ${
                    day.isToday || isSelected
                      ? "font-bold text-ink"
                      : "text-muted group-hover:text-ink"
                  }`}
                >
                  {day.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

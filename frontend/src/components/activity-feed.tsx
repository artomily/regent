"use client"

import {
  Activity,
  Ban,
  CheckCheck,
  FileSignature,
  Hourglass,
  Radar,
  Scale,
  ScrollText,
  Send,
  Sparkles,
} from "lucide-react"
import { useEffect, useRef } from "react"
import type { ActivityEvent } from "@/lib/types"

const STEP_ICONS: Record<string, typeof Activity> = {
  mandate_created: ScrollText,
  awaiting_permission: Hourglass,
  permission_granted: FileSignature,
  scanning_routes: Radar,
  comparing_prices: Scale,
  evaluating_slippage: Scale,
  making_decision: Sparkles,
  executing_swap: Send,
  confirming_transaction: CheckCheck,
  mandate_revoked: Ban,
}

function formatClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", { hour12: false })
}

export function ActivityFeed({ events, isRunning }: { events: ActivityEvent[]; isRunning: boolean }) {
  const endRef = useRef<HTMLDivElement>(null)
  const countRef = useRef(events.length)

  useEffect(() => {
    if (events.length > countRef.current) {
      endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
    countRef.current = events.length
  }, [events.length])

  return (
    <section aria-label="Agent activity" className="flex flex-col rounded-2xl border border-edge bg-surface">
      <header className="flex items-center justify-between border-b border-edge px-5 py-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-cream">
          <Activity className="h-4 w-4 text-brass" aria-hidden="true" />
          Agent activity
        </h3>
        {isRunning && (
          <span className="flex items-center gap-2 text-xs text-info">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-info" aria-hidden="true" />
            working
          </span>
        )}
      </header>

      <div className="max-h-105 flex-1 overflow-y-auto p-5" role="log" aria-live="polite">
        {events.length === 0 ? (
          <p className="py-10 text-center text-sm text-fog">
            No activity yet. Authorize the mandate and activate Regent.
          </p>
        ) : (
          <ol className="space-y-0">
            {events.map((event, i) => {
              const Icon = STEP_ICONS[event.step] ?? Activity
              const last = i === events.length - 1
              return (
                <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
                  {!last && (
                    <span
                      className="absolute top-7 left-3 h-[calc(100%-1.5rem)] w-px bg-edge"
                      aria-hidden="true"
                    />
                  )}
                  <span className="z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-edge bg-raised">
                    <Icon className="h-3 w-3 text-brass" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm break-words text-cream">{event.message}</p>
                    <p className="tnum mt-0.5 font-mono text-[11px] text-dim">
                      {formatClock(event.timestamp)}
                      {typeof event.metadata?.source === "string" && (
                        <span className="ml-2 tracking-wide uppercase">via {event.metadata.source}</span>
                      )}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
        <div ref={endRef} />
      </div>
    </section>
  )
}

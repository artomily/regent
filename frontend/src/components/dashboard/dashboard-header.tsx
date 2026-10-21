"use client"

import { Plus, Settings, Shield, Sparkles } from "lucide-react"
import Link from "next/link"

interface DashboardHeaderProps {
  onOpenSettings?: () => void
}

export function DashboardHeader({ onOpenSettings }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      {/* Editorial headline with inline pill icons */}
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-light tracking-tight text-ink sm:text-4xl lg:text-[42px] lg:leading-[1.15]">
          <span className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <span>Managing</span>
            <span className="inline-flex items-center justify-center rounded-full border border-edge bg-surface px-3 py-1 shadow-2xs">
              <Shield className="h-4 w-4 text-ink" aria-hidden="true" />
            </span>
            <span>your mandates</span>
          </span>
          <br className="hidden sm:inline" />
          <span className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <span>and</span>
            <span className="inline-flex items-center justify-center rounded-full bg-lime px-3 py-1 text-ink shadow-2xs">
              <Sparkles className="h-4 w-4 text-ink" aria-hidden="true" />
            </span>
            <span>your agent</span>
          </span>
        </h1>
      </div>

      {/* Right side action controls */}
      <div className="flex shrink-0 items-center gap-2.5 sm:self-start">
        <button
          onClick={onOpenSettings}
          aria-label="Dashboard settings"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-edge bg-surface text-ink shadow-2xs transition-colors hover:bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <Settings className="h-4.5 w-4.5" aria-hidden="true" />
        </button>

        <Link
          href="/mandate"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-xs font-semibold tracking-wide text-pure-white shadow-xs transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Create a new mandate</span>
        </Link>
      </div>
    </header>
  )
}

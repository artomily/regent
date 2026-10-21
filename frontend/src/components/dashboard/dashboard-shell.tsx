"use client"

import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import type { Hex } from "viem"
import { DashboardRail } from "./dashboard-rail"
import type { DashboardTab } from "./types"

interface DashboardShellProps {
  walletAddress?: Hex | null
  /** Highlighted rail item; omit on pages that are not one of the dashboard tabs. */
  activeTab?: DashboardTab
  /** In-page tab switching. Without it the rail navigates back to the dashboard on that tab. */
  onSelectTab?: (tab: DashboardTab) => void
  children: ReactNode
}

export function DashboardShell({ walletAddress, activeTab, onSelectTab, children }: DashboardShellProps) {
  const router = useRouter()
  const selectTab =
    onSelectTab ?? ((tab: DashboardTab) => router.push(tab === "overview" ? "/dashboard" : `/dashboard?tab=${tab}`))

  return (
    <div className="flex min-h-screen w-full flex-col bg-canvas text-ink antialiased md:flex-row">
      <DashboardRail
        activeTab={activeTab}
        onSelectTab={selectTab}
        walletAddress={walletAddress}
        onOpenSettings={() => selectTab("agent")}
      />
      <main className="flex min-w-0 flex-1 flex-col p-4 pb-20 md:p-6 lg:p-8">{children}</main>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex w-full animate-pulse-soft flex-col gap-6 p-6 md:flex-row">
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

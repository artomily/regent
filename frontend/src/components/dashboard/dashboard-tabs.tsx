"use client"

import type { DashboardTab } from "./types"

interface DashboardTabsProps {
  activeTab: DashboardTab
  onSelectTab: (tab: DashboardTab) => void
  mandatesCount?: number
  activityCount?: number
}

interface TabOption {
  id: DashboardTab
  label: string
  badge?: number
}

export function DashboardTabs({
  activeTab,
  onSelectTab,
  mandatesCount,
  activityCount,
}: DashboardTabsProps) {
  const tabs: TabOption[] = [
    { id: "overview", label: "Overview" },
    { id: "mandates", label: "Mandates", badge: mandatesCount },
    { id: "activity", label: "Activity", badge: activityCount },
    { id: "routes", label: "Routes" },
    { id: "agent", label: "Agent" },
  ]

  return (
    <div
      role="tablist"
      aria-label="Dashboard views"
      className="flex max-w-full items-center gap-2 overflow-x-auto py-1 scrollbar-none"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onSelectTab(tab.id)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
              isActive
                ? "bg-ink text-pure-white shadow-xs font-semibold"
                : "border border-edge bg-surface text-muted hover:bg-panel hover:text-ink"
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={`tnum font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isActive ? "bg-pure-white/20 text-pure-white" : "bg-panel text-muted"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

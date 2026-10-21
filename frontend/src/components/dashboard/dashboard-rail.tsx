"use client"

import {
  Activity,
  BookOpen,
  Bot,
  Crown,
  HelpCircle,
  LayoutDashboard,
  Route,
  Settings,
  Shield,
} from "lucide-react"
import Link from "next/link"
import type { DashboardNavProps, DashboardTab } from "./types"
import { WalletAvatar } from "./wallet-avatar"

interface DashboardRailProps extends DashboardNavProps {
  className?: string
}

interface NavItem {
  id: DashboardTab
  label: string
  icon: typeof LayoutDashboard
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "mandates", label: "Mandates", icon: Shield },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "routes", label: "Routes", icon: Route },
  { id: "agent", label: "Agent", icon: Bot },
]

export function DashboardRail({
  activeTab,
  onSelectTab,
  walletAddress,
  onOpenSettings,
  className = "",
}: DashboardRailProps) {
  return (
    <>
      {/* Desktop Vertical Icon Rail */}
      <aside
        aria-label="Sidebar navigation"
        className={`hidden md:flex w-16 shrink-0 flex-col items-center justify-between rounded-3xl bg-rail-ink py-5 text-pure-white shadow-xl ${className}`}
      >
        {/* Top: Regent Mark */}
        <div className="flex flex-col items-center gap-6">
          <Link
            href="/"
            aria-label="Regent Home"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface/10 text-pure-white transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
          >
            <Crown className="h-5 w-5 text-lime" aria-hidden="true" />
          </Link>

          {/* Primary View Navigation */}
          <nav aria-label="Main Views" className="flex flex-col items-center gap-2">
            {PRIMARY_NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={`group relative flex h-10 w-10 items-center justify-center rounded-2xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime ${
                    isActive
                      ? "bg-surface/20 text-pure-white shadow-xs"
                      : "text-dim hover:bg-surface/10 hover:text-pure-white"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? "text-lime" : ""}`} aria-hidden="true" />
                  <span className="pointer-events-none absolute left-full ml-3 hidden rounded-lg bg-ink px-2.5 py-1 text-xs font-medium whitespace-nowrap text-pure-white shadow-md group-hover:block z-50">
                    {item.label}
                  </span>
                </button>
              )
            })}

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              aria-label="Settings"
              className="group relative flex h-10 w-10 items-center justify-center rounded-2xl text-dim transition-colors hover:bg-surface/10 hover:text-pure-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
            >
              <Settings className="h-4.5 w-4.5" aria-hidden="true" />
              <span className="pointer-events-none absolute left-full ml-3 hidden rounded-lg bg-ink px-2.5 py-1 text-xs font-medium whitespace-nowrap text-pure-white shadow-md group-hover:block z-50">
                Settings
              </span>
            </button>
          </nav>
        </div>

        {/* Bottom Section: Docs, Help, and Wallet Avatar */}
        <div className="flex flex-col items-center gap-3 pt-6 border-t border-surface/10 w-10">
          <Link
            href="/legal"
            aria-label="Documentation and Legal"
            className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-dim transition-colors hover:bg-surface/10 hover:text-pure-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            <span className="pointer-events-none absolute left-full ml-3 hidden rounded-lg bg-ink px-2.5 py-1 text-xs font-medium whitespace-nowrap text-pure-white shadow-md group-hover:block z-50">
              Docs & Legal
            </span>
          </Link>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Help and Support"
            className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-dim transition-colors hover:bg-surface/10 hover:text-pure-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
          >
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            <span className="pointer-events-none absolute left-full ml-3 hidden rounded-lg bg-ink px-2.5 py-1 text-xs font-medium whitespace-nowrap text-pure-white shadow-md group-hover:block z-50">
              Help
            </span>
          </a>

          <div className="pt-1">
            <WalletAvatar address={walletAddress} size="sm" />
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Viewport <768px) */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-edge bg-rail-ink px-2 text-pure-white md:hidden shadow-lg safe-bottom"
      >
        {PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center rounded-xl px-2 py-1 transition-colors ${
                isActive ? "text-lime" : "text-dim hover:text-pure-white"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="mt-0.5 text-[10px] font-medium tracking-tight">{item.label}</span>
            </button>
          )
        })}

        <div className="flex items-center justify-center px-1">
          <WalletAvatar address={walletAddress} size="sm" />
        </div>
      </nav>
    </>
  )
}

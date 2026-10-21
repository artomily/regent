"use client"

import {
  Activity,
  BookOpen,
  Bot,
  Crown,
  HelpCircle,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Route,
  Settings,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
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

const COLLAPSE_STORAGE_KEY = "regent_sidebar_collapsed"

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

function writeCollapsed(collapsed: boolean) {
  try {
    window.localStorage.setItem(COLLAPSE_STORAGE_KEY, collapsed ? "1" : "0")
  } catch {
    // Storage unavailable (private mode) — the toggle still works for this visit.
  }
}

interface RailItemProps {
  label: string
  icon: typeof LayoutDashboard
  collapsed: boolean
  isActive?: boolean
  onClick?: () => void
  href?: string
  external?: boolean
}

function RailItem({ label, icon: Icon, collapsed, isActive = false, onClick, href, external }: RailItemProps) {
  const className = `group relative flex h-10 w-full items-center gap-3 rounded-2xl px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime ${
    collapsed ? "justify-center px-0" : ""
  } ${isActive ? "bg-surface/20 text-pure-white shadow-xs" : "text-dim hover:bg-surface/10 hover:text-pure-white"}`
  const content = (
    <>
      <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-lime" : ""}`} aria-hidden="true" />
      {collapsed ? (
        <span className="pointer-events-none absolute left-full z-50 ml-3 hidden rounded-lg bg-ink px-2.5 py-1 text-xs font-medium whitespace-nowrap text-pure-white shadow-md group-hover:block">
          {label}
        </span>
      ) : (
        <span className="truncate">{label}</span>
      )}
    </>
  )

  if (href) {
    return external ? (
      <a href={href} target="_blank" rel="noreferrer" aria-label={label} className={className}>
        {content}
      </a>
    ) : (
      <Link href={href} aria-label={label} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button onClick={onClick} aria-label={label} aria-current={isActive ? "page" : undefined} className={className}>
      {content}
    </button>
  )
}

export function DashboardRail({
  activeTab,
  onSelectTab,
  walletAddress,
  onOpenSettings,
  className = "",
}: DashboardRailProps) {
  // The dashboard renders only after hydration, so reading storage on init is safe.
  const [collapsed, setCollapsed] = useState(() => typeof window !== "undefined" && readCollapsed())

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      writeCollapsed(!prev)
      return !prev
    })
  }

  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <>
      {/* Desktop sidebar: flush to the top, left and bottom edges; foldable */}
      <aside
        aria-label="Sidebar navigation"
        className={`sticky top-0 hidden h-screen shrink-0 flex-col justify-between bg-rail-ink px-3 py-5 text-pure-white transition-[width] duration-200 md:flex ${
          collapsed ? "w-18" : "w-60"
        } ${className}`}
      >
        <div className="flex flex-col gap-6">
          {/* Top: Regent mark + fold toggle */}
          <div className={`flex items-center ${collapsed ? "flex-col gap-3" : "justify-between"}`}>
            <Link
              href="/"
              aria-label="Regent Home"
              className="flex items-center gap-2.5 rounded-2xl text-pure-white transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface/10">
                <Crown className="h-5 w-5 text-lime" aria-hidden="true" />
              </span>
              {!collapsed && <span className="text-base font-medium tracking-tight">Regent</span>}
            </Link>
            <button
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-dim transition-colors hover:bg-surface/10 hover:text-pure-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
            >
              <ToggleIcon className="h-4.5 w-4.5" aria-hidden="true" />
            </button>
          </div>

          {/* Primary View Navigation */}
          <nav aria-label="Main Views" className="flex flex-col gap-1.5">
            {PRIMARY_NAV_ITEMS.map((item) => (
              <RailItem
                key={item.id}
                label={item.label}
                icon={item.icon}
                collapsed={collapsed}
                isActive={activeTab === item.id}
                onClick={() => onSelectTab(item.id)}
              />
            ))}
            <RailItem label="Settings" icon={Settings} collapsed={collapsed} onClick={onOpenSettings} />
          </nav>
        </div>

        {/* Bottom Section: Docs, Help, and Wallet */}
        <div className="flex flex-col gap-1.5 border-t border-surface/10 pt-5">
          <RailItem label="Docs & Legal" icon={BookOpen} collapsed={collapsed} href="/legal" />
          <RailItem label="Help" icon={HelpCircle} collapsed={collapsed} href="https://github.com" external />
          <div className={`mt-2 flex items-center gap-3 ${collapsed ? "justify-center" : "px-2"}`}>
            <WalletAvatar address={walletAddress} size="sm" />
            {!collapsed && (
              <span className="tnum truncate font-mono text-xs text-dim">
                {walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : "Not connected"}
              </span>
            )}
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

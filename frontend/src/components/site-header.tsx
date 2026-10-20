"use client"

import { Crown, LayoutDashboard, ScrollText } from "lucide-react"
import Link from "next/link"
import type { Hex } from "viem"
import { AgentStatus } from "./agent-status"
import { WalletConnect } from "./wallet-connect"
import type { AgentHealth } from "@/lib/types"

export function Brandmark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-lime shadow-xs">
        <Crown className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className="font-display text-lg font-medium tracking-tight text-ink">
        REGENT<span className="align-top font-mono text-[10px] text-muted">®</span>
      </span>
    </span>
  )
}

interface AppHeaderProps {
  walletAddress: Hex | null
  onConnect: () => Promise<Hex | null>
  health: AgentHealth | null
}

export function AppHeader({ walletAddress, onConnect, health }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-edge bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            <Brandmark />
          </Link>
          <nav className="flex items-center gap-1.5" aria-label="Application">
            <Link
              href="/dashboard"
              aria-label="Dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-panel hover:text-ink focus-visible:outline-2 focus-visible:outline-ink sm:h-auto sm:w-auto sm:px-3.5 sm:py-1.5 sm:text-xs sm:font-medium"
            >
              <LayoutDashboard className="h-4 w-4 sm:hidden" aria-hidden="true" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link
              href="/mandate"
              aria-label="New mandate"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-panel hover:text-ink focus-visible:outline-2 focus-visible:outline-ink sm:h-auto sm:w-auto sm:px-3.5 sm:py-1.5 sm:text-xs sm:font-medium"
            >
              <ScrollText className="h-4 w-4 sm:hidden" aria-hidden="true" />
              <span className="hidden sm:inline">New mandate</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <AgentStatus health={health} />
          </div>
          <WalletConnect address={walletAddress} onConnect={onConnect} />
        </div>
      </div>
    </header>
  )
}

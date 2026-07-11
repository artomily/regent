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
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge-strong bg-raised">
        <Crown className="h-4 w-4 text-brass" aria-hidden="true" />
      </span>
      <span className="font-display text-xl tracking-wide text-cream">Regent</span>
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
    <header className="sticky top-0 z-20 border-b border-edge bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass"
          >
            <Brandmark />
          </Link>
          <nav className="flex items-center gap-1" aria-label="Application">
            <Link
              href="/dashboard"
              aria-label="Dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-full text-fog transition-colors hover:text-cream focus-visible:outline-2 focus-visible:outline-brass sm:h-auto sm:w-auto sm:px-3 sm:py-2 sm:text-sm"
            >
              <LayoutDashboard className="h-4 w-4 sm:hidden" aria-hidden="true" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link
              href="/mandate"
              aria-label="New mandate"
              className="flex h-9 w-9 items-center justify-center rounded-full text-fog transition-colors hover:text-cream focus-visible:outline-2 focus-visible:outline-brass sm:h-auto sm:w-auto sm:px-3 sm:py-2 sm:text-sm"
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

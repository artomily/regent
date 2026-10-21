"use client"

import {
  ArrowUpRight,
  BookOpen,
  Bot,
  FileCheck2,
  KeyRound,
  Wallet,
} from "lucide-react"
import Link from "next/link"
import type { Hex } from "viem"
import { CHAIN, MANDATE_CONTRACT } from "@/lib/constants"
import { truncateMiddle } from "@/lib/format"
import type { AgentHealth, Mandate } from "@/lib/types"

interface RightTilesProps {
  walletAddress: Hex | null
  activeMandate: Mandate | null
  agentHealth: AgentHealth | null
  onConnectWallet?: () => void
}

export function RightTiles({
  walletAddress,
  activeMandate,
  agentHealth,
  onConnectWallet,
}: RightTilesProps) {
  const isAgentOnline = agentHealth?.ok ?? false
  const agentMode = agentHealth?.mode.intelligence ?? "simulated"
  const delegationActive =
    activeMandate && ["authorized", "active", "executing"].includes(activeMandate.status)

  return (
    <div className="flex flex-col gap-4">
      {/* Top dual square tiles (like Community / Academy in reference) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Smart Account Tile */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-edge/60 bg-panel-sage p-5 shadow-xs transition-colors hover:bg-panel-sage-light">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-edge/40 bg-pure-white text-ink shadow-2xs">
              <Wallet className="h-4 w-4" aria-hidden="true" />
            </span>
            {walletAddress ? (
              <a
                href={`${CHAIN.explorerUrl}/address/${walletAddress}`}
                target="_blank"
                rel="noreferrer"
                aria-label="View smart account on BaseScan"
                className="text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : (
              <button
                onClick={onConnectWallet}
                className="text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                aria-label="Connect wallet"
              >
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold tracking-tight text-ink">Smart Account</span>
            <p className="tnum mt-0.5 font-mono text-[11px] text-muted truncate">
              {walletAddress ? truncateMiddle(walletAddress, 6, 4) : "Connect wallet"}
            </p>
          </div>
        </div>

        {/* Delegation Status Tile */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-edge/60 bg-panel-sage p-5 shadow-xs transition-colors hover:bg-panel-sage-light">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-edge/40 bg-pure-white text-ink shadow-2xs">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
            </span>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                delegationActive ? "bg-positive" : "bg-dim"
              }`}
              aria-hidden="true"
            />
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold tracking-tight text-ink">Delegation</span>
            <p className="tnum mt-0.5 font-mono text-[11px] text-muted capitalize truncate">
              {delegationActive ? "Signed & active" : activeMandate?.status ?? "Unassigned"}
            </p>
          </div>
        </div>
      </div>

      {/* Vertical stack tiles (like Help Center, Partner Directory in reference) */}

      {/* 1. Venice AI status (agent mode) */}
      <div className="group relative flex flex-col justify-between rounded-3xl border border-edge/60 bg-panel-sage p-5 shadow-xs transition-colors hover:bg-panel-sage-light sm:p-6">
        <div className="flex items-start justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-edge/40 bg-pure-white text-ink shadow-2xs">
            <Bot className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <span
            className={`tnum inline-flex items-center gap-1.5 rounded-full border border-edge bg-pure-white px-2.5 py-0.5 font-mono text-[10px] font-semibold text-ink shadow-2xs`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isAgentOnline ? "bg-positive" : "bg-dim animate-pulse-soft"
              }`}
              aria-hidden="true"
            />
            {agentMode}
          </span>
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-semibold tracking-tight text-ink">Venice AI status</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Autonomous decision engine using private Zero-Knowledge compute to compare DEX pools.
          </p>
        </div>
      </div>

      {/* 2. RegentMandate contract */}
      <a
        href={
          MANDATE_CONTRACT
            ? `${CHAIN.explorerUrl}/address/${MANDATE_CONTRACT}`
            : `${CHAIN.explorerUrl}`
        }
        target="_blank"
        rel="noreferrer"
        className="group relative flex flex-col justify-between rounded-3xl border border-edge/60 bg-panel-sage p-5 shadow-xs transition-colors hover:bg-panel-sage-light sm:p-6"
      >
        <div className="flex items-start justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-edge/40 bg-pure-white text-ink shadow-2xs">
            <FileCheck2 className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <ArrowUpRight className="h-4.5 w-4.5 text-muted transition-colors group-hover:text-ink" aria-hidden="true" />
        </div>
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-ink">RegentMandate</h3>
            <span className="tnum font-mono text-[10px] text-muted">Base Sepolia</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {MANDATE_CONTRACT ? (
              <span className="tnum font-mono">{truncateMiddle(MANDATE_CONTRACT, 8, 6)}</span>
            ) : (
              "Immutable spending boundary enforcement and delegation registry."
            )}
          </p>
        </div>
      </a>

      {/* 3. Docs & Legal */}
      <Link
        href="/legal"
        className="group relative flex flex-col justify-between rounded-3xl border border-edge/60 bg-panel-sage p-5 shadow-xs transition-colors hover:bg-panel-sage-light sm:p-6"
      >
        <div className="flex items-start justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-edge/40 bg-pure-white text-ink shadow-2xs">
            <BookOpen className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <ArrowUpRight className="h-4.5 w-4.5 text-muted transition-colors group-hover:text-ink" aria-hidden="true" />
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-semibold tracking-tight text-ink">Docs & Legal</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Architecture documentation, cryptographic security model, and boundary specifications.
          </p>
        </div>
      </Link>
    </div>
  )
}

"use client"

import { Wallet } from "lucide-react"
import { useState } from "react"
import type { Hex } from "viem"
import { truncateMiddle } from "@/lib/format"

interface WalletConnectProps {
  address: Hex | null
  onConnect: () => Promise<Hex | null>
}

export function WalletConnect({ address, onConnect }: WalletConnectProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (address) {
    return (
      <span className="inline-flex h-10 items-center gap-2 rounded-full border border-edge bg-surface px-4 font-mono text-xs text-cream">
        <span className="h-1.5 w-1.5 rounded-full bg-positive" aria-hidden="true" />
        {truncateMiddle(address)}
      </span>
    )
  }

  const connect = async () => {
    setBusy(true)
    setError(null)
    try {
      await onConnect()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={connect}
        disabled={busy}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-edge-strong px-4 text-xs font-semibold whitespace-nowrap text-cream transition-colors hover:border-brass hover:text-brass-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:opacity-50"
      >
        <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="sm:hidden">{busy ? "Connecting…" : "Connect"}</span>
        <span className="hidden sm:inline">{busy ? "Connecting…" : "Connect wallet"}</span>
      </button>
      {error && (
        <p role="alert" className="absolute top-full right-0 mt-2 w-64 rounded-lg border border-edge bg-raised p-3 text-xs text-negative">
          {error}
        </p>
      )}
    </div>
  )
}

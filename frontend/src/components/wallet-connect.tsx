"use client"

import { Wallet } from "lucide-react"
import { useEffect, useState } from "react"
import type { Hex } from "viem"
import { isOnChainEnabled } from "@/lib/contract"
import { truncateMiddle } from "@/lib/format"
import { createMetaMaskSmartAccount } from "@/lib/wallet"

interface WalletConnectProps {
  address: Hex | null
  onConnect: () => Promise<Hex | null>
}

export function WalletConnect({ address, onConnect }: WalletConnectProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [smartAccountAddress, setSmartAccountAddress] = useState<Hex | null>(null)

  const isLive = isOnChainEnabled() && Boolean(address)

  useEffect(() => {
    if (!address) return
    let active = true
    createMetaMaskSmartAccount(address)
      .then((sa) => {
        if (active) setSmartAccountAddress(sa.address)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [address])

  const displayedSmartAccount = address ? smartAccountAddress : null

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-9 items-center gap-2 rounded-full border border-edge bg-surface px-3.5 font-mono text-xs text-ink shadow-2xs"
          title={displayedSmartAccount ? `Smart Account: ${displayedSmartAccount}` : undefined}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-positive" : "bg-brass"}`}
            aria-hidden="true"
          />
          <span>{truncateMiddle(address)}</span>
          {displayedSmartAccount && (
            <span className="hidden text-[10px] text-muted sm:inline">
              · SA: {truncateMiddle(displayedSmartAccount, 4, 3)}
            </span>
          )}
          <span className="text-[10px] tracking-wide text-muted uppercase">
            {isLive ? "Live" : "Demo"}
          </span>
        </span>
      </div>
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
    <div className="relative flex items-center gap-2">
      <span className="hidden text-[10px] tracking-wide text-fog uppercase sm:inline">
        Demo mode
      </span>
      <button
        onClick={connect}
        disabled={busy}
        className="inline-flex h-9 items-center gap-2 rounded-full bg-ink px-4 text-xs font-semibold whitespace-nowrap text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50 shadow-2xs"
      >
        <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="sm:hidden">{busy ? "Connecting…" : "Connect"}</span>
        <span className="hidden sm:inline">{busy ? "Connecting…" : "Connect wallet"}</span>
      </button>
      {error && (
        <p role="alert" className="absolute top-full right-0 mt-2 w-64 rounded-xl border border-edge bg-panel p-3 text-xs text-negative shadow-lg z-50">
          {error}
        </p>
      )}
    </div>
  )
}

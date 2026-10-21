"use client"

import { Crown } from "lucide-react"

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

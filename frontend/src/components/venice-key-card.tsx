"use client"

import { KeyRound } from "lucide-react"
import { useState } from "react"
import { clearVeniceApiKey, getVeniceApiKey, setVeniceApiKey } from "@/lib/venice-key"

export function VeniceKeyCard() {
  const [key, setKey] = useState(() => getVeniceApiKey() ?? "")
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    const trimmed = key.trim()
    if (trimmed) setVeniceApiKey(trimmed)
    else clearVeniceApiKey()
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <section className="rounded-2xl border border-edge bg-surface p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-cream">
        <KeyRound className="h-3.5 w-3.5 text-brass" aria-hidden="true" /> Venice AI key (required)
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-fog">
        Regent needs a real Venice API key to decide — there is no silent fallback to a canned policy.
        Paste yours below, or the agent falls back to VENICE_API_KEY if the service itself has one
        configured. Stored only in this browser and sent solely with your own evaluation requests — never
        logged.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-..."
          autoComplete="off"
          aria-label="Venice API key"
          className="w-full rounded-xl border border-edge bg-raised px-3.5 py-2.5 font-mono text-sm text-cream placeholder:text-dim focus-visible:outline-2 focus-visible:outline-brass"
        />
        <button
          type="button"
          onClick={handleSave}
          className="shrink-0 rounded-xl border border-edge-strong px-4 text-sm font-medium text-cream transition-colors hover:border-brass hover:text-brass-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        >
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </section>
  )
}

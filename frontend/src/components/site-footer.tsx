import Link from "next/link"
import { Brandmark } from "./site-header"

export function SiteFooter() {
  return (
    <footer className="border-t border-edge">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <Brandmark />
        <p className="text-sm text-fog">
          MetaMask Smart Accounts · Venice AI · 1Shot Relayer · Base Sepolia
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/legal"
            className="rounded text-xs text-dim underline decoration-edge-strong underline-offset-4 transition-colors hover:text-fog focus-visible:outline-2 focus-visible:outline-brass"
          >
            Legal & risk disclosure
          </Link>
          <p className="font-mono text-xs text-dim">frontend/ · ai-agent/ · contract/</p>
        </div>
      </div>
    </footer>
  )
}

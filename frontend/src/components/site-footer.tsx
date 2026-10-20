import Link from "next/link"
import { Brandmark } from "./site-header"

export function SiteFooter() {
  return (
    <footer className="border-t border-edge bg-panel/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <Brandmark />
        <p className="text-xs text-muted">
          MetaMask Smart Accounts · Venice AI · 1Shot Relayer · Base Sepolia
        </p>
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
          <Link
            href="/legal"
            className="rounded text-xs text-muted underline decoration-edge underline-offset-4 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-ink"
          >
            Legal & risk disclosure
          </Link>
          <p className="font-mono text-xs text-muted">frontend/ · ai-agent/ · contract/</p>
        </div>
      </div>
    </footer>
  )
}

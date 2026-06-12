import { Brandmark } from "./site-header"

export function SiteFooter() {
  return (
    <footer className="border-t border-edge">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <Brandmark />
        <p className="text-sm text-fog">
          MetaMask Smart Accounts · Venice AI · 1Shot Relayer · Base Sepolia
        </p>
        <p className="font-mono text-xs text-dim">frontend/ · ai-agent/ · contract/</p>
      </div>
    </footer>
  )
}

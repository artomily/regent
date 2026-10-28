import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { Brandmark } from "@/components/site-header"

export const metadata: Metadata = {
  title: "Legal & risk disclosure — Regent",
  description:
    "Non-custodial, no-warranty, no-advice: what Regent is and isn't before you sign a mandate.",
}

const SECTIONS = [
  {
    title: "§1 — Non-custodial by design",
    body: "Regent never takes custody of your funds or your keys. Authorization happens through dual ERC-7710 delegations (one for USDC approval, one for Uniswap execution) bounded by contract caveats from your own Smart Account — the agent acts within the clauses you sign, and you can revoke that authority at any time, effective immediately, on-chain.",
  },
  {
    title: "§2 — Experimental software, no warranty",
    body: "This is a hackathon project. The contract has an automated test suite but has not been professionally audited, and the frontend and agent service have not been hardened for production use. Regent is provided \"as is,\" without warranty of any kind. Do not commit funds you cannot afford to lose, and treat Base Sepolia as the intended environment unless you understand the mainnet risk yourself.",
  },
  {
    title: "§3 — The model proposes, the mandate disposes",
    body: "Venice AI evaluates routes and suggests a decision; that decision is re-validated against your mandate's budget, slippage, and expiry before anything executes, and a hallucinated or malformed verdict is rejected rather than trusted. Even so, AI-assisted decisions are probabilistic, not guaranteed — the boundary enforcement is the guarantee, not the reasoning.",
  },
  {
    title: "§4 — Not financial advice",
    body: "Regent does not recommend trades, sizes, or timing. Every parameter — the goal, the budget, the slippage ceiling, the expiry — is set by you. Nothing in this product should be read as investment, financial, or legal advice.",
  },
  {
    title: "§5 — Where your data lives",
    body: "Mandates and the activity trail are stored in your browser's local storage and optionally synchronized to an authenticated Neon Postgres database when configured. Mutating API requests require an EIP-191 personal_sign signature by the mandate owner within a 5-minute replay window.",
  },
  {
    title: "§6 — Source and terms",
    body: "Regent is open source under the MIT License. Read the code, file an issue, or report a security concern through the links below before you rely on it for anything that matters.",
  },
]

export default function LegalPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <header className="border-b border-edge">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
            <Brandmark />
          </Link>
          <Link
            href="/dashboard?new=1"
            className="rounded-full border border-edge bg-surface px-4 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-panel focus-visible:outline-2 focus-visible:outline-ink"
          >
            New mandate
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
        <p className="font-mono text-xs font-semibold tracking-[0.2em] text-muted uppercase">
          Legal & risk disclosure
        </p>
        <h1 className="mt-3 font-display text-3xl font-light tracking-tight text-ink sm:text-5xl">
          Read this before you sign a mandate.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
          Regent is non-custodial and boundary-enforced, but it is still software, and the software is still
          young. Here is what that means in practice.
        </p>

        <div className="mt-12 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.title} className="border-t border-edge pt-8">
              <h2 className="font-display text-xl font-light tracking-tight text-ink">{s.title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">{s.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-edge pt-8 text-xs font-medium text-muted">
          <a
            href="https://github.com/artomily/regent"
            className="text-ink underline decoration-edge underline-offset-4 transition-colors hover:text-muted"
          >
            Source code
          </a>
          <a
            href="https://github.com/artomily/regent/blob/main/LICENSE"
            className="text-ink underline decoration-edge underline-offset-4 transition-colors hover:text-muted"
          >
            MIT License
          </a>
          <a
            href="https://github.com/artomily/regent/blob/main/SECURITY.md"
            className="text-ink underline decoration-edge underline-offset-4 transition-colors hover:text-muted"
          >
            Report a security issue
          </a>
          <a
            href="https://github.com/artomily/regent/issues"
            className="text-ink underline decoration-edge underline-offset-4 transition-colors hover:text-muted"
          >
            File an issue
          </a>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

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
    body: "Regent never takes custody of your funds or your keys. Authorization happens through a signed EIP-712 mandate and a bounded delegation from your own Smart Account — the agent acts within the clauses you sign, and you can revoke that authority at any time, effective immediately, on-chain.",
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
    body: "Mandates and the activity/audit trail are stored only in your browser's local storage — there is no backend database. Clearing your browser data or switching devices means that history is gone. Regent does not run analytics or tracking scripts.",
  },
  {
    title: "§6 — Source and terms",
    body: "Regent is open source under the MIT License. Read the code, file an issue, or report a security concern through the links below before you rely on it for anything that matters.",
  },
]

export default function LegalPage() {
  return (
    <>
      <header className="border-b border-edge">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass">
            <Brandmark />
          </Link>
          <Link
            href="/mandate"
            className="rounded-full px-4 py-2 text-sm text-fog transition-colors hover:text-cream focus-visible:outline-2 focus-visible:outline-brass"
          >
            New mandate
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <p className="text-xs font-medium tracking-[0.22em] text-brass uppercase">Legal & risk disclosure</p>
        <h1 className="mt-3 font-display text-4xl text-cream">Read this before you sign a mandate.</h1>
        <p className="mt-4 text-base leading-relaxed text-fog">
          Regent is non-custodial and boundary-enforced, but it is still software, and the software is still
          young. Here is what that means in practice.
        </p>

        <div className="mt-12 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.title} className="border-t border-edge pt-8">
              <h2 className="font-display text-2xl text-brass-bright">{s.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-fog">{s.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-edge pt-8 text-sm">
          <a
            href="https://github.com/artomily/regent"
            className="text-cream underline decoration-edge-strong underline-offset-4 transition-colors hover:text-brass-bright"
          >
            Source code
          </a>
          <a
            href="https://github.com/artomily/regent/blob/main/LICENSE"
            className="text-cream underline decoration-edge-strong underline-offset-4 transition-colors hover:text-brass-bright"
          >
            MIT License
          </a>
          <a
            href="https://github.com/artomily/regent/blob/main/SECURITY.md"
            className="text-cream underline decoration-edge-strong underline-offset-4 transition-colors hover:text-brass-bright"
          >
            Report a security issue
          </a>
          <a
            href="https://github.com/artomily/regent/issues"
            className="text-cream underline decoration-edge-strong underline-offset-4 transition-colors hover:text-brass-bright"
          >
            File an issue
          </a>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}

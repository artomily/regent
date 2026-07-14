import {
  ArrowRight,
  Brain,
  Clock,
  FileSignature,
  Gauge,
  LayoutDashboard,
  Play,
  ScrollText,
  Send,
  Server,
  ShieldCheck,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { Hero3D } from "@/components/hero-3d"
import { SiteFooter } from "@/components/site-footer"
import { Brandmark } from "@/components/site-header"

const BOUNDARIES = [
  {
    clause: "§1",
    icon: Gauge,
    title: "Budget ceiling",
    sample: "100 USDC",
    body: "Cumulative spend is capped. The contract reverts the transaction that would cross it — BudgetExceeded.",
  },
  {
    clause: "§2",
    icon: ShieldCheck,
    title: "Slippage ceiling",
    sample: "≤ 2.00%",
    body: "Every route is checked against your tolerance before execution — SlippageExceeded.",
  },
  {
    clause: "§3",
    icon: Clock,
    title: "Expiry",
    sample: "24h",
    body: "Authority ends on schedule, automatically. No cleanup required — Expired.",
  },
]

const STEPS = [
  {
    icon: ScrollText,
    title: "Create a mandate",
    body: "A goal, a budget, hard boundaries. Written like a deed, enforced like one.",
  },
  {
    icon: FileSignature,
    title: "Authorize Regent",
    body: "Sign the boundaries (EIP-712) from your Smart Account. You stay the owner; Regent gets a leash.",
  },
  {
    icon: Brain,
    title: "Regent evaluates",
    body: "Venice AI scans DEX routes on Base, compares prices, and reasons about every clause.",
  },
  {
    icon: Send,
    title: "Regent executes",
    body: "The best route clears through the 1Shot relayer, gas abstracted. Breaches revert.",
  },
]

const WORKSPACES = [
  {
    path: "frontend/",
    icon: LayoutDashboard,
    title: "Control surface",
    body: "Next.js app where mandates are drafted, signed, observed, and revoked.",
  },
  {
    path: "ai-agent/",
    icon: Server,
    title: "Decision engine",
    body: "Standalone service: Venice AI route evaluation behind an HTTP API, with a final boundary check before anything moves.",
  },
  {
    path: "contract/",
    icon: ShieldCheck,
    title: "Law",
    body: "RegentMandate on Base Sepolia. Budget, slippage, and expiry enforced where the agent can't argue.",
  },
]

export default function Landing() {
  return (
    <>
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <Brandmark />
          <nav className="flex items-center gap-2" aria-label="Main">
            <Link
              href="/mandate"
              className="hidden rounded-full px-4 py-2 text-sm text-fog transition-colors hover:text-cream focus-visible:outline-2 focus-visible:outline-brass sm:block"
            >
              New mandate
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-edge-strong px-4 text-sm font-semibold text-cream transition-colors hover:border-brass hover:text-brass-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
            >
              Launch app
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative flex min-h-[92svh] items-center overflow-hidden">
          <div className="absolute inset-0" aria-hidden="true">
            <Hero3D />
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/60 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
          </div>

          <div className="relative mx-auto w-full max-w-6xl px-6 pt-24 pb-16">
            <div className="max-w-2xl">
              <p className="animate-rise text-xs font-medium tracking-[0.22em] text-brass uppercase">
                Agent-operated wallet · Base Sepolia
              </p>
              <h1 className="animate-rise mt-5 font-display text-5xl leading-[1.05] text-cream [animation-delay:80ms] sm:text-7xl">
                You give the mandate.
                <br />
                <em className="text-brass-bright">Regent executes.</em>
              </h1>
              <p className="animate-rise mt-6 max-w-xl text-lg leading-relaxed text-fog [animation-delay:160ms]">
                An AI agent that acts on your behalf inside hard, signed boundaries — budget, slippage,
                expiry. Never beyond. Built on MetaMask Smart Accounts, Venice AI, and the 1Shot relayer.
              </p>
              <div className="animate-rise mt-9 flex flex-wrap gap-3 [animation-delay:240ms]">
                <Link
                  href="/mandate"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-brass px-7 text-sm font-semibold text-ink transition-colors hover:bg-brass-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
                >
                  Give your first mandate <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-edge-strong px-7 text-sm font-semibold text-cream transition-colors hover:border-brass hover:text-brass-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
                >
                  <Play className="h-4 w-4" aria-hidden="true" /> Watch it work
                </Link>
              </div>
              <p className="animate-rise mt-10 font-mono text-xs text-dim [animation-delay:320ms]">
                ERC-7710 delegation · EIP-7702 gas abstraction · works with zero configuration
              </p>
            </div>
          </div>
        </section>

        {/* Boundaries */}
        <section className="border-t border-edge">
          <div className="mx-auto w-full max-w-6xl px-6 py-24">
            <p className="text-xs font-medium tracking-[0.22em] text-brass uppercase">The mandate is law</p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl text-cream">
              Autonomy you can sign, <em className="text-brass-bright">boundaries you can prove.</em>
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-fog">
              Most agents ask for trust. Regent asks for a mandate — three clauses enforced by the{" "}
              <span className="font-mono text-sm text-cream">RegentMandate</span> contract, the agent
              service, and the interface alike.
            </p>

            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-edge bg-edge md:grid-cols-3">
              {BOUNDARIES.map((b) => (
                <article key={b.clause} className="bg-surface p-7">
                  <div className="flex items-center justify-between">
                    <b.icon className="h-5 w-5 text-brass" aria-hidden="true" />
                    <span className="font-display text-2xl text-dim">{b.clause}</span>
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-cream">{b.title}</h3>
                  <p className="tnum mt-1 font-mono text-sm text-brass-bright">{b.sample}</p>
                  <p className="mt-3 text-sm leading-relaxed text-fog">{b.body}</p>
                </article>
              ))}
            </div>

            <div className="mt-6 overflow-x-auto rounded-2xl border border-edge bg-surface p-6">
              <p className="text-[11px] font-medium tracking-[0.18em] text-dim uppercase">
                contract/src/RegentMandate.sol — what a breach looks like
              </p>
              <pre className="tnum mt-4 font-mono text-[13px] leading-relaxed text-fog">
                <code>{`if (slippageBps > m.maxSlippageBps) revert `}<span className="text-negative">SlippageExceeded</span>{`(m.maxSlippageBps, slippageBps);

uint256 remaining = m.budget - m.spent;
if (spendAmount > remaining) revert `}<span className="text-negative">BudgetExceeded</span>{`(remaining, spendAmount);

if (block.timestamp >= m.expiry) revert `}<span className="text-negative">Expired</span>{`();`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-edge">
          <div className="mx-auto w-full max-w-6xl px-6 py-24">
            <p className="text-xs font-medium tracking-[0.22em] text-brass uppercase">How it works</p>
            <h2 className="mt-3 font-display text-4xl text-cream">From intent to execution</h2>

            <ol className="mt-12 grid gap-8 md:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-edge-strong bg-raised">
                      <s.icon className="h-4 w-4 text-brass" aria-hidden="true" />
                    </span>
                    <span className="tnum font-mono text-xs text-dim">0{i + 1}</span>
                    {i < STEPS.length - 1 && (
                      <span className="hidden h-px flex-1 bg-edge md:block" aria-hidden="true" />
                    )}
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-cream">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-fog">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Architecture */}
        <section className="border-t border-edge">
          <div className="mx-auto w-full max-w-6xl px-6 py-24">
            <p className="text-xs font-medium tracking-[0.22em] text-brass uppercase">Architecture</p>
            <h2 className="mt-3 font-display text-4xl text-cream">
              Three workspaces, <em className="text-brass-bright">one chain of authority</em>
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-fog">
              The interface drafts the mandate, the agent reasons about it, the contract enforces it. Each
              lives in its own directory and they meet at the boundaries.
            </p>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {WORKSPACES.map((w) => (
                <article key={w.path} className="rounded-2xl border border-edge bg-surface p-7 transition-colors hover:border-edge-strong">
                  <div className="flex items-center justify-between">
                    <w.icon className="h-5 w-5 text-brass" aria-hidden="true" />
                    <code className="rounded-md border border-edge bg-raised px-2 py-1 font-mono text-xs text-brass-bright">
                      {w.path}
                    </code>
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-cream">{w.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-fog">{w.body}</p>
                </article>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-edge bg-surface px-7 py-5">
              <span className="text-xs font-medium tracking-[0.18em] text-dim uppercase">Powered by</span>
              {[
                ["MetaMask Smart Accounts", "delegation"],
                ["Venice AI", "intelligence"],
                ["1Shot Relayer", "gas abstraction"],
                ["Base Sepolia", "settlement"],
              ].map(([name, role]) => (
                <span key={name} className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-cream">{name}</span>
                  <span className="text-xs text-dim">{role}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-edge">
          <div className="mx-auto w-full max-w-6xl px-6 py-24 text-center">
            <Zap className="mx-auto h-6 w-6 text-brass" aria-hidden="true" />
            <h2 className="mt-5 font-display text-4xl text-cream sm:text-5xl">
              Delegate the work. <em className="text-brass-bright">Keep the throne.</em>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-fog">
              Try the full flow — no keys, no testnet funds, nothing at risk.
            </p>
            <Link
              href="/mandate"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-brass px-8 text-sm font-semibold text-ink transition-colors hover:bg-brass-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
            >
              Give your first mandate <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}

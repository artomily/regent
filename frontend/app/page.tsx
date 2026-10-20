import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileSignature,
  Gauge,
  Play,
  ScrollText,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { Hero3D } from "@/components/hero-3d"
import { SiteFooter } from "@/components/site-footer"

const BOUNDARIES = [
  {
    clause: "§1",
    icon: Gauge,
    title: "Budget ceiling",
    sample: "100.00 USDC",
    body: "Cumulative spend is strictly capped. The contract reverts any transaction that crosses it — BudgetExceeded.",
  },
  {
    clause: "§2",
    icon: ShieldCheck,
    title: "Slippage ceiling",
    sample: "≤ 2.00% max",
    body: "Every route is re-checked against your tolerance before execution — SlippageExceeded.",
  },
  {
    clause: "§3",
    icon: Clock,
    title: "Automatic expiry",
    sample: "24h scheduled",
    body: "Authority ends on schedule, automatically on-chain. No manual revocation needed — Expired.",
  },
]

const STEPS = [
  {
    num: "01",
    icon: ScrollText,
    title: "Create a mandate",
    body: "A goal, a budget, hard boundaries. Written like a deed, enforced like law.",
  },
  {
    num: "02",
    icon: FileSignature,
    title: "Authorize Regent",
    body: "Sign the boundaries (EIP-712) from your Smart Account. You stay owner; Regent gets a narrow leash.",
  },
  {
    num: "03",
    icon: Sparkles,
    title: "Venice evaluates",
    body: "Venice AI scans DEX routes on Base, compares prices, and reasons about every clause.",
  },
  {
    num: "04",
    icon: Send,
    title: "Relayer executes",
    body: "The selected route settles through the 1Shot relayer with gas abstraction. Breaches revert.",
  },
]

const METRICS = [
  {
    value: "100%",
    label: "On-chain enforcement",
    desc: "Every boundary enforced by contract on Base",
  },
  {
    value: "3x",
    label: "Redundant verification",
    desc: "Interface, Venice agent, and smart contract",
  },
  {
    value: "0",
    label: "Custody risk",
    desc: "Keys and funds never leave your smart account",
  },
  {
    value: "84532",
    label: "Base Sepolia",
    desc: "Target chain with EIP-7702 gas abstraction",
  },
]

const TRUST_LAYERS = [
  {
    tag: "LAYER 01 · CLIENT",
    title: "Interface guard",
    file: "frontend/src/hooks/use-regent.ts",
    body: "Validates all inputs against user limits before any request is generated. Prevents malformed or out-of-boundary actions client-side.",
    revert: "Pre-flight rejection before broadcast",
  },
  {
    tag: "LAYER 02 · AGENT",
    title: "Venice AI decision guard",
    file: "ai-agent/src/executor.ts",
    body: "Venice AI evaluates competitive DEX quotes. The executor service re-validates the chosen route against budget, slippage, and expiry before dispatch.",
    revert: "Rejects hallucinated or unauthorized routes",
  },
  {
    tag: "LAYER 03 · CONTRACT",
    title: "RegentMandate.sol",
    file: "contract/src/RegentMandate.sol",
    body: "On-chain caveat registry on Base Sepolia. Even if the agent service were compromised, the contract unconditionally reverts on clause breach.",
    revert: "Reverts: BudgetExceeded · SlippageExceeded · Expired",
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* ── HERO: Full-bleed warm luminous gradient panel modeled on Wellmo ── */}
      <section className="relative min-h-[94svh] w-full overflow-hidden bg-hero-bg">
        {/* CSS Gradient mesh background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 95% 75% at 80% 10%, var(--color-hero-glow-lime) 0%, transparent 65%),
              radial-gradient(ellipse 85% 65% at 15% 15%, var(--color-hero-glow-sun) 0%, transparent 55%),
              radial-gradient(ellipse 70% 50% at 50% 28%, var(--color-hero-glow-amber) 0%, transparent 60%),
              radial-gradient(circle at 50% 100%, var(--color-hero-shade) 0%, var(--color-hero-bg) 65%, var(--color-hero-amber) 130%)
            `,
          }}
          aria-hidden="true"
        />

        {/* Geometric architectural rings overlay */}
        <svg
          className="absolute inset-0 h-full w-full pointer-events-none opacity-20"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="35%" cy="30%" r="280" fill="none" stroke="var(--color-lime)" strokeWidth="0.8" strokeDasharray="3 3" />
          <circle cx="35%" cy="30%" r="460" fill="none" stroke="var(--color-pure-white)" strokeWidth="0.5" />
          <circle cx="35%" cy="30%" r="680" fill="none" stroke="var(--color-pure-white)" strokeWidth="0.5" />
          <line x1="35%" y1="0" x2="35%" y2="100%" stroke="var(--color-pure-white)" strokeWidth="0.5" strokeDasharray="3 6" />
        </svg>

        {/* Ambient 3D canvas orb */}
        <div className="absolute inset-0 pointer-events-none opacity-45 mix-blend-screen" aria-hidden="true">
          <Hero3D />
        </div>

        {/* Top Header inside Hero */}
        <header className="relative z-20 w-full border-b border-white/10">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
            <Link
              href="/"
              className="group flex items-baseline gap-1 focus-visible:outline-2 focus-visible:outline-white"
            >
              <span className="font-display text-3xl font-light tracking-[-0.04em] text-white transition-opacity group-hover:opacity-85 sm:text-5xl">
                REGENT
              </span>
              <span className="font-mono text-xs text-lime">®</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="hidden rounded-full px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:text-white sm:inline-block"
              >
                Dashboard
              </Link>
              <Link
                href="/mandate"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-xs font-semibold text-ink transition-colors hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Give a mandate
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <div className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-md">
                <span className="h-0.5 w-4 rounded-full bg-white/80" />
                <span className="h-0.5 w-4 rounded-full bg-white/80" />
                <span className="h-0.5 w-4 rounded-full bg-white/80" />
              </div>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-between px-4 pt-10 pb-16 sm:px-6 sm:pt-16 sm:pb-24">
          {/* Top row: floating micro-pills */}
          <div className="flex flex-wrap items-center justify-end gap-2 text-[11px] font-mono tracking-wider text-white/70 uppercase">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 backdrop-blur-md">
              ERC-7710 Delegation
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 backdrop-blur-md">
              Venice AI Reasoning
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 backdrop-blur-md">
              MetaMask Smart Accounts
            </span>
          </div>

          {/* Middle: Floating Frosted Glass Mandate Card */}
          <div className="my-10 flex justify-end">
            <div className="w-full max-w-sm rounded-3xl border border-white/20 bg-ink/40 p-6 shadow-2xl backdrop-blur-xl text-white transition-transform sm:max-w-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime animate-pulse-soft" />
                  <span className="font-mono text-[11px] tracking-widest text-white/80 uppercase">
                    MANDATE #01
                  </span>
                </div>
                <span className="rounded-full bg-lime px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-ink uppercase">
                  Active · Guarded
                </span>
              </div>

              <div className="mt-5 flex items-baseline justify-between">
                <div>
                  <p className="font-display text-5xl font-light tracking-tight text-white sm:text-6xl">
                    80<span className="text-3xl sm:text-4xl font-normal">%</span>
                  </p>
                  <p className="mt-1 text-xs text-white/70">Budget utilized within ceiling</p>
                </div>
                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-mono text-xs font-medium text-lime">
                  ↑ 15% executed
                </span>
              </div>

              {/* Lime Progress Bar */}
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/15 p-0.5">
                <div
                  className="h-full rounded-full bg-lime shadow-[0_0_12px_rgba(227,232,42,0.8)] transition-[width] duration-700"
                  style={{ width: "80%" }}
                />
              </div>

              {/* Parameters mini grid */}
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 font-mono text-[11px]">
                <div>
                  <p className="text-white/60">§1 Budget ceiling</p>
                  <p className="mt-0.5 font-medium text-white">100.00 USDC</p>
                </div>
                <div>
                  <p className="text-white/60">§2 Slippage limit</p>
                  <p className="mt-0.5 font-medium text-lime">≤ 2.00% max</p>
                </div>
                <div>
                  <p className="text-white/60">§3 Authority expires</p>
                  <p className="mt-0.5 font-medium text-white">23h 48m left</p>
                </div>
                <div>
                  <p className="text-white/60">Target venue</p>
                  <p className="mt-0.5 font-medium text-white">Base Sepolia</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Hero headline and action pills */}
          <div className="relative max-w-3xl rounded-3xl p-5 sm:p-8 bg-gradient-to-t from-hero-shade/85 via-hero-shade/40 to-transparent backdrop-blur-xs">
            <h1 className="animate-rise font-display text-4xl font-light tracking-[-0.03em] text-white sm:text-6xl md:text-7xl">
              You give the mandate.
              <br />
              <span className="font-normal text-white">Regent executes.</span>
            </h1>

            <p className="animate-rise mt-5 max-w-xl text-base font-normal leading-relaxed text-white/90 [animation-delay:120ms] sm:text-lg">
              An AI agent that acts on your behalf inside hard, signed boundaries — budget, slippage,
              expiry. Never beyond. Built on MetaMask Smart Accounts, Venice AI, and the 1Shot relayer.
            </p>

            <div className="animate-rise mt-8 flex flex-wrap items-center gap-3 [animation-delay:200ms]">
              <Link
                href="/mandate"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-ink transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                Give your first mandate
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <Play className="h-4 w-4 text-lime" aria-hidden="true" />
                Launch dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 01: Problem Statement & The Three Hard Clauses ── */}
      <section className="border-t border-edge bg-canvas">
        {/* Hairline sub-header divider */}
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between border-b border-edge px-4 py-3 sm:px-6">
          <span className="font-mono text-xs text-muted">(01)</span>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-lime text-ink shadow-xs">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-mono text-xs text-muted">©2026</span>
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="text-center">
            <p className="font-mono text-xs tracking-[0.2em] text-muted uppercase">
              The mandate is law
            </p>
            <h2 className="mt-4 font-display text-3xl font-light tracking-[-0.03em] text-ink sm:text-5xl md:text-6xl">
              Autonomy you can sign,
              <br />
              <span className="font-normal">boundaries you can prove.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted">
              Most agents ask for blind trust. Regent asks for a mandate — three clauses enforced by the{" "}
              <span className="font-mono text-ink">RegentMandate</span> smart contract, the agent
              service, and the interface alike.
            </p>
          </div>

          {/* Three Clauses Hairline Grid */}
          <div className="mt-14 grid grid-cols-1 border-t border-b border-edge divide-y md:grid-cols-3 md:divide-y-0 md:divide-x divide-edge bg-panel/30">
            {BOUNDARIES.map((b) => (
              <article key={b.clause} className="p-6 sm:p-8 transition-colors hover:bg-panel/60">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-edge bg-surface shadow-xs">
                    <b.icon className="h-4 w-4 text-ink" aria-hidden="true" />
                  </div>
                  <span className="font-mono text-xs font-semibold tracking-wider text-muted">
                    {b.clause}
                  </span>
                </div>
                <h3 className="mt-6 text-base font-semibold text-ink">{b.title}</h3>
                <p className="tnum mt-1 font-mono text-sm font-medium text-ink/80">{b.sample}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{b.body}</p>
              </article>
            ))}
          </div>

          {/* Black Circular Arrow CTA Row */}
          <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-2xl border border-edge bg-panel/40 p-6 sm:flex-row sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-canvas bg-ink text-xs font-bold text-lime">
                  R
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-canvas bg-panel text-xs font-bold text-ink">
                  V
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-canvas bg-lime text-xs font-bold text-ink">
                  1S
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Inspect live boundary code</p>
                <p className="text-xs text-muted">
                  Every execution checks cumulative budget, slippage, and timestamp.
                </p>
              </div>
            </div>

            <Link
              href="/mandate"
              aria-label="Create a mandate"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink text-white shadow-md transition-transform hover:scale-105 active:scale-95"
            >
              <ArrowUpRight className="h-6 w-6" aria-hidden="true" />
            </Link>
          </div>

          {/* Solidity Revert Preview */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-edge bg-surface p-4 sm:p-6 shadow-xs max-w-full">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge pb-3">
              <span className="font-mono text-[11px] tracking-wider text-muted uppercase">
                contract/src/RegentMandate.sol — on-chain boundary enforcement
              </span>
              <span className="rounded-full bg-panel px-2.5 py-0.5 font-mono text-[10px] text-ink">
                Base Sepolia
              </span>
            </div>
            <pre className="tnum mt-4 overflow-x-auto font-mono text-xs leading-relaxed text-ink/80 max-w-full">
              <code>{`if (slippageBps > m.maxSlippageBps) revert `}<span className="font-semibold text-negative">SlippageExceeded</span>{`(m.maxSlippageBps, slippageBps);

uint256 remaining = m.budget - m.spent;
if (spendAmount > remaining) revert `}<span className="font-semibold text-negative">BudgetExceeded</span>{`(remaining, spendAmount);

if (block.timestamp >= m.expiry) revert `}<span className="font-semibold text-negative">Expired</span>{`();`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* ── SECTION 02: How It Works (Chain of Authority) ── */}
      <section className="border-t border-edge bg-panel/30">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between border-b border-edge px-4 py-3 sm:px-6">
          <span className="font-mono text-xs text-muted">(02)</span>
          <span className="font-mono text-xs tracking-wider text-muted uppercase">Chain of Authority</span>
          <span className="font-mono text-xs text-muted">WORKFLOW</span>
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="font-mono text-xs tracking-[0.2em] text-muted uppercase">How it works</p>
            <h2 className="mt-3 font-display text-3xl font-light tracking-[-0.03em] text-ink sm:text-5xl">
              From intent to <span className="font-normal">autonomous settlement</span>
            </h2>
            <p className="mt-3 text-base text-muted">
              Four transparent steps. The user drafts and authorizes; the agent evaluates; the relayer
              settles inside the mandate.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-edge bg-edge sm:grid-cols-2 md:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.title} className="bg-surface p-6 sm:p-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-panel text-ink">
                      <s.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-xs text-muted">{s.num}</span>
                  </div>
                  <h3 className="mt-5 text-sm font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{s.body}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-edge/60 flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-wider text-muted uppercase">Stage {s.num}</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-positive" aria-hidden="true" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 03: Metrics Row ── */}
      <section className="border-t border-edge bg-canvas">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between border-b border-edge px-4 py-3 sm:px-6">
          <span className="font-mono text-xs text-muted">(03)</span>
          <span className="font-mono text-xs tracking-wider text-muted uppercase">System Metrics</span>
          <span className="font-mono text-xs text-muted">INTEGRITY</span>
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid grid-cols-2 border-t border-b border-edge divide-y sm:divide-y-0 sm:grid-cols-4 sm:divide-x divide-edge bg-panel/30">
            {METRICS.map((m) => (
              <div key={m.label} className="p-6 sm:p-8 text-center sm:text-left">
                <p className="tnum font-display text-4xl font-light tracking-tight text-ink sm:text-5xl">
                  {m.value}
                </p>
                <p className="mt-2 text-xs font-semibold text-ink uppercase tracking-wide">
                  {m.label}
                </p>
                <p className="mt-1 text-xs text-muted leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 04: Trust Model (Defense in Depth) ── */}
      <section className="border-t border-edge bg-panel/20">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between border-b border-edge px-4 py-3 sm:px-6">
          <span className="font-mono text-xs text-muted">(04)</span>
          <span className="font-mono text-xs tracking-wider text-muted uppercase">Defense in Depth</span>
          <span className="font-mono text-xs text-muted">TRUST MODEL</span>
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="font-mono text-xs tracking-[0.2em] text-muted uppercase">Architecture</p>
            <h2 className="mt-3 font-display text-3xl font-light tracking-[-0.03em] text-ink sm:text-5xl">
              Three workspaces, <span className="font-normal">one chain of authority</span>
            </h2>
            <p className="mt-3 text-base text-muted">
              The interface drafts the mandate, the agent reasons about it, the contract enforces it.
              Redundancy is deliberate — a bug in any one layer cannot move funds beyond the signature.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {TRUST_LAYERS.map((layer) => (
              <article
                key={layer.tag}
                className="flex flex-col justify-between rounded-2xl border border-edge bg-surface p-6 sm:p-7 shadow-xs transition-shadow hover:shadow-sm"
              >
                <div>
                  <span className="font-mono text-[10px] tracking-wider text-muted uppercase">
                    {layer.tag}
                  </span>
                  <h3 className="mt-2 text-base font-semibold text-ink">{layer.title}</h3>
                  <code className="mt-1 block font-mono text-xs text-muted">{layer.file}</code>
                  <p className="mt-4 text-xs leading-relaxed text-muted">{layer.body}</p>
                </div>
                <div className="mt-6 rounded-xl border border-edge bg-panel/50 p-3">
                  <p className="font-mono text-[11px] text-ink">{layer.revert}</p>
                </div>
              </article>
            ))}
          </div>

          {/* Powered by row */}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-edge bg-surface p-4 sm:px-6 sm:py-5">
            <span className="font-mono text-xs font-semibold tracking-wider text-muted uppercase">
              POWERED BY
            </span>
            <div className="flex flex-wrap items-center gap-4 sm:gap-8 font-mono text-xs text-ink">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                MetaMask Smart Accounts
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                Venice AI
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                1Shot Relayer
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                Base Sepolia
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 05: Final CTA ── */}
      <section className="border-t border-edge bg-canvas">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between border-b border-edge px-4 py-3 sm:px-6">
          <span className="font-mono text-xs text-muted">(05)</span>
          <span className="font-mono text-xs tracking-wider text-muted uppercase">Get Started</span>
          <span className="font-mono text-xs text-muted">LAUNCH</span>
        </div>

        <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lime text-ink shadow-xs">
            <Sparkles className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mt-6 font-display text-4xl font-light tracking-[-0.03em] text-ink sm:text-6xl">
            Delegate the work.
            <br />
            <span className="font-normal">Keep the throne.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted">
            Try the full flow on Base Sepolia with simulated fallback — no keys, no testnet funds,
            nothing at risk.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/mandate"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-8 text-sm font-semibold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Give your first mandate
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-edge bg-surface px-7 text-sm font-semibold text-ink transition-colors hover:bg-panel"
            >
              Launch dashboard
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}

import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Clock,
  FileSignature,
  Gauge,
  Menu,
  Plus,
  ScrollText,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { Hero3D } from "@/components/hero-3d"
import { SiteFooter } from "@/components/site-footer"

const NAV = [
  { href: "#clauses", label: "Clauses" },
  { href: "#how", label: "How it works" },
  { href: "#trust", label: "Security" },
  { href: "#faq", label: "FAQ" },
]

const CREATE_HREF = "/dashboard?new=1"

const BOUNDARIES = [
  {
    clause: "§1",
    icon: Gauge,
    title: "Budget ceiling",
    sample: "100.00 USDC",
    revert: "BudgetExceeded",
    body: "Cumulative spend is capped. Any execution that would cross the ceiling reverts.",
  },
  {
    clause: "§2",
    icon: ShieldCheck,
    title: "Slippage ceiling",
    sample: "≤ 2.00%",
    revert: "SlippageExceeded",
    body: "Every route is re-checked against your tolerance before it is allowed to settle.",
  },
  {
    clause: "§3",
    icon: Clock,
    title: "Automatic expiry",
    sample: "24h",
    revert: "Expired",
    body: "Authority ends on schedule — both the delegation caveat and the contract stop honouring it.",
  },
]

const STEPS = [
  {
    num: "01",
    icon: ScrollText,
    title: "Write the mandate",
    body: "A goal, a budget, a slippage ceiling and an expiry. Four clauses, nothing implicit.",
  },
  {
    num: "02",
    icon: FileSignature,
    title: "Sign two delegations",
    body: "Your MetaMask Smart Account signs narrow ERC-7710 delegations: approve USDC to the router, swap into your own account.",
  },
  {
    num: "03",
    icon: Sparkles,
    title: "Venice evaluates",
    body: "Venice AI compares Uniswap quotes on Base Sepolia and explains why a route fits — or why nothing does.",
  },
  {
    num: "04",
    icon: Send,
    title: "Regent settles",
    body: "The agent records the spend on RegentMandate and redeems both delegations in one transaction. Breaches revert.",
  },
]

const FACTS = [
  { value: "3", label: "Enforcement layers", desc: "Interface, agent service and contract" },
  { value: "2", label: "Narrow delegations", desc: "Approve and swap, each with its own caveats" },
  { value: "0", label: "Keys shared", desc: "Regent never holds your keys or custody" },
  { value: "84532", label: "Base Sepolia", desc: "Chain ID for every mandate today" },
]

const TRUST_LAYERS = [
  {
    tag: "Layer 01 · Interface",
    title: "Pre-flight guard",
    body: "Validates every input against your limits before anything is signed or sent.",
    revert: "Rejected before broadcast",
  },
  {
    tag: "Layer 02 · Agent",
    title: "Decision guard",
    body: "Venice picks a route; the executor re-checks budget, slippage and expiry before and after the model answers.",
    revert: "Rejects out-of-mandate routes",
  },
  {
    tag: "Layer 03 · Chain",
    title: "Caveats + RegentMandate",
    body: "Delegation caveat enforcers pin targets, calldata and balance change; the contract tracks cumulative spend.",
    revert: "BudgetExceeded · SlippageExceeded · Expired",
  },
]

const FAQ = [
  {
    q: "Does Regent ever hold my funds?",
    a: "No. Funds stay in your MetaMask Smart Account. Regent only receives delegations that let it call USDC.approve for the Uniswap router and a single swap shape that must pay out to your own account.",
  },
  {
    q: "What stops the AI from doing something unexpected?",
    a: "The model only proposes. Its choice is re-validated by the agent service, then the on-chain caveats and the RegentMandate contract refuse anything outside the clauses you signed.",
  },
  {
    q: "Can I stop a mandate early?",
    a: "Yes. Revoking disables the delegations on the DelegationManager and marks the mandate revoked on RegentMandate, so further redemptions fail.",
  },
  {
    q: "Do I need testnet funds to try it?",
    a: "No. Without a wallet the whole flow runs in a clearly labelled demo mode. Connect MetaMask on Base Sepolia with faucet USDC to run it for real.",
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-hero-bg text-pure-white">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 60% at 85% 0%, var(--color-hero-glow-lime) 0%, transparent 60%),
              radial-gradient(ellipse 60% 50% at 10% 0%, var(--color-hero-glow-sun) 0%, transparent 55%),
              radial-gradient(ellipse 80% 70% at 50% 110%, var(--color-hero-shade) 0%, transparent 70%)
            `,
          }}
          aria-hidden="true"
        />

        {/* Nav */}
        <header className="relative z-20 border-b border-pure-white/10">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <Link
              href="/"
              className="flex items-baseline gap-1 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pure-white"
            >
              <span className="font-display text-2xl font-light tracking-[-0.04em]">REGENT</span>
              <span className="font-mono text-[10px] text-lime">®</span>
            </Link>

            <nav aria-label="Sections" className="hidden items-center gap-1 rounded-full border border-pure-white/15 bg-pure-white/5 p-1 backdrop-blur-md md:flex">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-4 py-1.5 text-xs font-medium text-pure-white/75 transition-colors hover:bg-pure-white/10 hover:text-pure-white"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-pure-white px-5 text-xs font-semibold text-ink transition-colors hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pure-white"
              >
                Launch app
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <details className="group relative md:hidden">
                <summary
                  aria-label="Open menu"
                  className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-pure-white/15 bg-pure-white/5 backdrop-blur-md [&::-webkit-details-marker]:hidden"
                >
                  <Menu className="h-4 w-4" aria-hidden="true" />
                </summary>
                <nav
                  aria-label="Sections"
                  className="absolute top-12 right-0 flex w-48 flex-col rounded-2xl border border-edge bg-surface p-2 text-ink shadow-lg"
                >
                  {NAV.map((item) => (
                    <a key={item.href} href={item.href} className="rounded-xl px-3 py-2 text-sm hover:bg-panel">
                      {item.label}
                    </a>
                  ))}
                </nav>
              </details>
            </div>
          </div>
        </header>

        {/* Hero body */}
        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pt-14 pb-10 sm:px-6 lg:grid-cols-12 lg:pt-20">
          <div className="lg:col-span-7">
            <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-pure-white/15 bg-pure-white/5 py-1 pr-3 pl-1 text-xs text-pure-white/80 backdrop-blur-md">
              <span className="rounded-full bg-lime px-2 py-0.5 font-mono text-[10px] font-bold text-ink uppercase">
                Live
              </span>
              MetaMask Smart Accounts × Venice AI on Base Sepolia
            </div>

            <h1 className="animate-rise mt-6 font-display text-5xl leading-[1.02] font-light tracking-[-0.04em] [animation-delay:80ms] sm:text-7xl lg:text-[5.5rem]">
              You give the mandate.
              <br />
              <span className="text-lime">Regent</span> executes.
            </h1>

            <p className="animate-rise mt-6 max-w-xl text-base leading-relaxed text-pure-white/75 [animation-delay:160ms] sm:text-lg">
              An AI agent that trades on your behalf inside hard, signed boundaries — budget, slippage, expiry.
              Never beyond them, and never with your keys.
            </p>

            <div className="animate-rise mt-9 flex flex-wrap items-center gap-3 [animation-delay:240ms]">
              <Link
                href={CREATE_HREF}
                className="group inline-flex h-13 items-center gap-3 rounded-full bg-pure-white py-1.5 pr-1.5 pl-6 text-sm font-semibold text-ink shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Give your first mandate
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-pure-white transition-transform group-hover:rotate-45">
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
              <a
                href="#how"
                className="inline-flex h-13 items-center rounded-full border border-pure-white/20 px-6 text-sm font-medium text-pure-white transition-colors hover:bg-pure-white/10"
              >
                See how it works
              </a>
            </div>

            <dl className="animate-rise mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-pure-white/10 pt-6 [animation-delay:320ms]">
              {[
                ["3×", "redundant checks"],
                ["2", "ERC-7710 delegations"],
                ["0", "keys handed over"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd className="tnum font-mono text-2xl text-pure-white">{value}</dd>
                  <dd className="mt-1 text-xs text-pure-white/60">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Mandate card over the orbit orb */}
          <div className="relative lg:col-span-5">
            <div className="pointer-events-none absolute -inset-16 opacity-70" aria-hidden="true">
              <Hero3D />
            </div>

            <div className="relative mx-auto w-full max-w-md rounded-3xl border border-pure-white/20 bg-ink/45 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-pure-white/75 uppercase">
                  <span className="h-2 w-2 animate-pulse-soft rounded-full bg-lime" />
                  Mandate #01
                </span>
                <span className="rounded-full bg-lime px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-ink uppercase">
                  Within mandate
                </span>
              </div>

              <p className="mt-5 text-sm text-pure-white/80">Swap USDC into ETH at the best route</p>

              <div className="mt-3 flex items-end justify-between">
                <p className="tnum font-display text-6xl font-light tracking-tight">
                  64<span className="text-3xl">%</span>
                </p>
                <p className="tnum pb-2 text-right font-mono text-xs text-pure-white/70">
                  64.00 / 100.00 USDC
                  <br />
                  budget used
                </p>
              </div>

              <div className="mt-3 flex gap-1" role="presentation">
                {Array.from({ length: 20 }, (_, i) => (
                  <span key={i} className={`h-6 flex-1 rounded-full ${i < 13 ? "bg-lime" : "bg-pure-white/15"}`} />
                ))}
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-pure-white/10 pt-4 font-mono text-[11px]">
                <div>
                  <dt className="text-pure-white/55">§2 Slippage</dt>
                  <dd className="tnum mt-0.5 text-lime">≤ 2.00%</dd>
                </div>
                <div>
                  <dt className="text-pure-white/55">§3 Expires in</dt>
                  <dd className="tnum mt-0.5">23h 48m</dd>
                </div>
              </dl>

              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-pure-white/10 p-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime text-ink">
                  <Bot className="h-4 w-4" aria-hidden="true" />
                </span>
                <p className="text-xs leading-relaxed text-pure-white/80">
                  <span className="font-semibold text-pure-white">Venice:</span> Uniswap 0.05% pool beats 0.3% by{" "}
                  <span className="tnum font-mono text-lime">0.41%</span>. Slippage 0.18% — inside §2. Executing.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Oversized wordmark, editorial bleed */}
        <p
          className="relative z-0 -mb-[0.2em] text-center font-display text-[22vw] leading-none font-light tracking-[-0.06em] text-pure-white/[0.07] select-none"
          aria-hidden="true"
        >
          REGENT
        </p>
      </section>

      {/* ── (01) CLAUSES ── */}
      <section id="clauses" className="scroll-mt-4 border-t border-edge">
        <SectionRule num="01" label="The mandate is law" />
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <h2 className="font-display text-4xl font-light tracking-[-0.03em] sm:text-6xl lg:col-span-7">
              Autonomy you can sign. Boundaries you can prove.
            </h2>
            <p className="text-base leading-relaxed text-muted lg:col-span-5">
              Most agents ask for blind trust. Regent asks for a mandate — three clauses checked by the interface,
              the agent service and the chain alike.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 divide-y divide-edge border-y border-edge md:grid-cols-3 md:divide-x md:divide-y-0">
            {BOUNDARIES.map((b) => (
              <article key={b.clause} className="group p-6 transition-colors hover:bg-panel/60 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-edge bg-surface transition-colors group-hover:bg-lime">
                    <b.icon className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs text-muted">{b.clause}</span>
                </div>
                <p className="tnum mt-10 font-display text-4xl font-light tracking-tight">{b.sample}</p>
                <h3 className="mt-2 text-base font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{b.body}</p>
                <p className="mt-5 inline-flex rounded-full bg-panel px-2.5 py-1 font-mono text-[11px] text-negative">
                  revert {b.revert}()
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── (02) HOW IT WORKS ── */}
      <section id="how" className="scroll-mt-4 border-t border-edge bg-panel/40">
        <SectionRule num="02" label="Chain of authority" />
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl font-light tracking-[-0.03em] sm:text-6xl">
              From intent to settlement in four steps
            </h2>
            <p className="mt-4 text-base text-muted">
              You define and sign. The agent reasons. The chain enforces.
            </p>
          </div>

          <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li
                key={s.num}
                className={`relative flex flex-col rounded-3xl border p-6 sm:p-7 ${
                  i === 0 ? "border-ink bg-ink text-pure-white" : "border-edge bg-surface"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      i === 0 ? "bg-lime text-ink" : "bg-panel"
                    }`}
                  >
                    <s.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className={`font-mono text-xs ${i === 0 ? "text-pure-white/60" : "text-muted"}`}>{s.num}</span>
                </div>
                <h3 className="mt-12 text-lg font-medium">{s.title}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${i === 0 ? "text-pure-white/70" : "text-muted"}`}>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── (03) FACTS ── */}
      <section className="border-t border-edge">
        <SectionRule num="03" label="By design" />
        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 divide-edge px-4 sm:px-6 lg:grid-cols-4 lg:divide-x">
          {FACTS.map((f) => (
            <div key={f.label} className="px-2 py-12 sm:px-8 sm:py-16">
              <p className="tnum font-mono text-5xl font-light tracking-tight sm:text-6xl">{f.value}</p>
              <p className="mt-3 text-sm font-semibold">{f.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── (04) TRUST MODEL ── */}
      <section id="trust" className="scroll-mt-4 border-t border-edge bg-panel/40">
        <SectionRule num="04" label="Defense in depth" />
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <h2 className="font-display text-4xl font-light tracking-[-0.03em] sm:text-6xl lg:col-span-7">
              A bug in one layer cannot move funds beyond your signature.
            </h2>
            <p className="text-base leading-relaxed text-muted lg:col-span-5">
              The redundancy is deliberate. Each layer checks the same clauses independently, so none of them has
              to be trusted alone.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {TRUST_LAYERS.map((layer) => (
              <article key={layer.tag} className="flex flex-col justify-between rounded-3xl border border-edge bg-surface p-6 sm:p-7">
                <div>
                  <span className="font-mono text-[11px] tracking-wider text-muted uppercase">{layer.tag}</span>
                  <h3 className="mt-3 text-lg font-medium">{layer.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{layer.body}</p>
                </div>
                <p className="mt-8 rounded-2xl bg-panel px-4 py-3 font-mono text-[11px]">{layer.revert}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl bg-ink p-5 text-pure-white sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pure-white/10 pb-3">
              <span className="font-mono text-[11px] tracking-wider text-pure-white/60 uppercase">
                contract/src/RegentMandate.sol
              </span>
              <span className="rounded-full bg-lime px-2.5 py-0.5 font-mono text-[10px] font-bold text-ink">Base Sepolia</span>
            </div>
            <pre className="tnum mt-4 overflow-x-auto font-mono text-xs leading-relaxed text-pure-white/80">
              <code>
                {`if (slippageBps > m.maxSlippageBps) revert `}
                <span className="text-lime">SlippageExceeded</span>
                {`(m.maxSlippageBps, slippageBps);

uint256 remaining = m.budget - m.spent;
if (spendAmount > remaining) revert `}
                <span className="text-lime">BudgetExceeded</span>
                {`(remaining, spendAmount);

if (block.timestamp >= m.expiry) revert `}
                <span className="text-lime">Expired</span>
                {`();`}
              </code>
            </pre>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-xs">
            <span className="font-semibold tracking-wider text-muted uppercase">Built with</span>
            {["MetaMask Smart Accounts", "Venice AI", "Uniswap v3", "Neon Postgres", "Base Sepolia"].map((name) => (
              <span key={name} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── (05) FAQ ── */}
      <section id="faq" className="scroll-mt-4 border-t border-edge">
        <SectionRule num="05" label="Questions" />
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-12">
          <h2 className="font-display text-4xl font-light tracking-[-0.03em] sm:text-6xl lg:col-span-5">
            Before you sign
          </h2>
          <div className="divide-y divide-edge border-y border-edge lg:col-span-7">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-medium [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-edge transition-[transform,background-color] group-open:rotate-45 group-open:bg-lime">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </span>
                </summary>
                <p className="mt-3 max-w-xl pr-12 text-sm leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── (06) CTA ── */}
      <section className="border-t border-edge px-4 py-6 sm:px-6">
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 overflow-hidden rounded-[2rem] bg-lime p-8 sm:p-12 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] uppercase">(06) Get started</p>
            <h2 className="mt-4 max-w-2xl font-display text-5xl leading-[1.02] font-light tracking-[-0.04em] sm:text-7xl">
              Delegate the work. Keep the throne.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ink/70">
              Runs end to end on Base Sepolia — or in demo mode with nothing at risk.
            </p>
          </div>
          <Link
            href={CREATE_HREF}
            aria-label="Give your first mandate"
            className="group flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-ink text-pure-white transition-transform hover:scale-105 active:scale-95 sm:h-36 sm:w-36"
          >
            <ArrowUpRight className="h-10 w-10 transition-transform group-hover:rotate-45" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}

function SectionRule({ num, label }: { num: string; label: string }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl items-center justify-between border-b border-edge px-4 py-3 font-mono text-xs text-muted sm:px-6">
      <span>({num})</span>
      <span className="tracking-wider uppercase">{label}</span>
      <span>©2026</span>
    </div>
  )
}

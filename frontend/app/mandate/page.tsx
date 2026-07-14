"use client"

import { ArrowLeft, Ban, Clock, Gauge, Info } from "lucide-react"
import Link from "next/link"
import { CreateMandateForm } from "@/components/create-mandate-form"
import { SiteFooter } from "@/components/site-footer"
import { AppHeader } from "@/components/site-header"
import { VeniceKeyCard } from "@/components/venice-key-card"
import { useRegent } from "@/hooks/use-regent"

const NEVER = [
  {
    icon: Gauge,
    label: "Exceed the budget",
    detail: "BudgetExceeded — the spend that would cross the ceiling reverts.",
  },
  {
    icon: Ban,
    label: "Accept worse slippage",
    detail: "SlippageExceeded — routes over your tolerance are rejected.",
  },
  {
    icon: Clock,
    label: "Act after expiry",
    detail: "Expired — authority ends on schedule, automatically.",
  },
]

export default function MandatePage() {
  const { walletAddress, agentHealth, connect, createMandate, authorizeMandate } = useRegent()

  return (
    <>
      <AppHeader walletAddress={walletAddress} onConnect={connect} health={agentHealth} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-full text-sm text-fog transition-colors hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to dashboard
        </Link>

        <div className="mt-6 grid items-start gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <h1 className="font-display text-4xl text-cream">Create a mandate</h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-fog">
              Define what Regent should accomplish and the boundaries it must respect. You can revoke at
              any time.
            </p>

            <div className="mt-8">
              <CreateMandateForm
                walletAddress={walletAddress}
                onCreate={createMandate}
                onAuthorize={authorizeMandate}
              />
            </div>
          </div>

          <aside className="space-y-5 lg:col-span-2" aria-label="How mandates work">
            <VeniceKeyCard />

            <section className="rounded-2xl border border-edge bg-raised p-6">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-cream">
                <Info className="h-3.5 w-3.5 text-brass" aria-hidden="true" /> New here? A mandate in one
                sentence
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-fog">
                A mandate is a signed permission slip with an expiry date: it tells Regent exactly what
                it&apos;s allowed to do — spend up to this much, accept at most this much slippage, stop by
                this time — and nothing else. Your wallet, your keys, and your money never leave your control;
                Regent only ever gets the narrow instructions you sign.
              </p>
            </section>

            <section className="rounded-2xl border border-edge bg-surface p-6">
              <h2 className="text-sm font-semibold text-cream">What Regent can never do</h2>
              <ul className="mt-4 space-y-4">
                {NEVER.map((item) => (
                  <li key={item.label} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-edge bg-raised">
                      <item.icon className="h-3.5 w-3.5 text-brass" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-cream">{item.label}</p>
                      <p className="tnum mt-0.5 font-mono text-xs text-fog">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-edge pt-4 text-xs leading-relaxed text-fog">
                Boundaries are enforced three times: in this interface, in the agent service, and by the{" "}
                <span className="font-mono text-cream">RegentMandate</span> contract on Base.
              </p>
            </section>

            <section className="rounded-2xl border border-edge bg-surface p-6">
              <h2 className="text-sm font-semibold text-cream">How authorization works</h2>
              <ol className="mt-3 space-y-2 text-sm leading-relaxed text-fog">
                <li>
                  <strong className="font-medium text-cream">1. Define</strong> — goal, budget, and limits
                  become the mandate clauses.
                </li>
                <li>
                  <strong className="font-medium text-cream">2. Sign</strong> — your wallet signs the
                  clauses as EIP-712 typed data. Nothing is custodied.
                </li>
                <li>
                  <strong className="font-medium text-cream">3. Delegate</strong> — Regent receives narrow
                  authority via your Smart Account, never your keys.
                </li>
              </ol>
              {!walletAddress && (
                <p className="mt-4 rounded-xl border border-brass/25 bg-brass-faint px-4 py-3 text-xs leading-relaxed text-brass-bright">
                  No wallet connected — the flow runs with a simulated signature.
                </p>
              )}
              <p className="mt-4 text-xs leading-relaxed text-dim">
                Regent is experimental, non-custodial software.{" "}
                <Link href="/legal" className="underline decoration-edge-strong underline-offset-4 hover:text-fog">
                  Read the risk disclosure
                </Link>{" "}
                before signing.
              </p>
            </section>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}

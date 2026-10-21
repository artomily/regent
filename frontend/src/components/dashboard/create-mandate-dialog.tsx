"use client"

import { Ban, Clock, Gauge, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, type ComponentProps } from "react"
import { CreateMandateForm } from "@/components/create-mandate-form"

type FormProps = ComponentProps<typeof CreateMandateForm>

interface CreateMandateDialogProps extends FormProps {
  open: boolean
  onClose: () => void
}

const NEVER = [
  { icon: Gauge, label: "Exceed the budget", code: "BudgetExceeded" },
  { icon: Ban, label: "Accept worse slippage", code: "SlippageExceeded" },
  { icon: Clock, label: "Act after expiry", code: "Expired" },
]

export function CreateMandateDialog({ open, onClose, ...formProps }: CreateMandateDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  // Keep the native dialog in step with `open` so Esc, focus trapping and the backdrop come for free.
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop lands on the dialog element itself.
        if (e.target === e.currentTarget) onClose()
      }}
      aria-labelledby="create-mandate-title"
      className="m-auto max-h-[92svh] w-[min(64rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-edge bg-canvas p-0 text-ink shadow-2xl backdrop:bg-ink/50 backdrop:backdrop-blur-sm"
    >
      {open && (
        <div className="flex max-h-[92svh] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-edge px-5 py-4 sm:px-7">
            <div>
              <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">New mandate</p>
              <h2 id="create-mandate-title" className="mt-1 font-display text-2xl font-light tracking-tight">
                Define the boundaries Regent must respect
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-edge bg-surface text-ink transition-colors hover:bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <div className="grid flex-1 gap-6 overflow-y-auto p-5 sm:p-7 lg:grid-cols-[1fr_17rem]">
            <CreateMandateForm {...formProps} />

            <aside aria-label="What Regent can never do" className="space-y-4">
              <section className="rounded-2xl border border-edge bg-panel-sage p-5">
                <h3 className="text-sm font-semibold">What Regent can never do</h3>
                <ul className="mt-4 space-y-3">
                  {NEVER.map((item) => (
                    <li key={item.code} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pure-white">
                        <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold">{item.label}</p>
                        <p className="font-mono text-[11px] text-muted">{item.code}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 border-t border-edge pt-3 text-xs leading-relaxed text-muted">
                  Enforced three times: this interface, the agent service, and the{" "}
                  <span className="font-mono text-ink">RegentMandate</span> contract.
                </p>
              </section>
              <section className="rounded-2xl border border-edge bg-surface p-5">
                <h3 className="text-sm font-semibold">How authorization works</h3>
                <ol className="mt-3 space-y-2 text-xs leading-relaxed text-muted">
                  <li>
                    <strong className="font-semibold text-ink">1. Define</strong> — goal, budget and limits.
                  </li>
                  <li>
                    <strong className="font-semibold text-ink">2. Sign</strong> — your Smart Account signs two
                    narrow ERC-7710 delegations (approve and swap).
                  </li>
                  <li>
                    <strong className="font-semibold text-ink">3. Delegate</strong> — Regent gets caveated
                    authority, never your keys.
                  </li>
                </ol>
                <p className="mt-4 text-xs leading-relaxed text-muted">
                  Experimental, non-custodial software.{" "}
                  <Link href="/legal" className="underline decoration-edge underline-offset-4 hover:text-ink">
                    Read the risk disclosure
                  </Link>
                  .
                </p>
              </section>
            </aside>
          </div>
        </div>
      )}
    </dialog>
  )
}

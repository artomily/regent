"use client"

import { ArrowLeft, ArrowRight, CheckCircle2, FileSignature, ScrollText } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import type { Hex } from "viem"
import { DEFAULT_SOURCE_ASSET, GOAL_PRESETS, TARGET_ASSET_PRESETS } from "@/lib/constants"
import { formatPercent, truncateMiddle } from "@/lib/format"
import type { Mandate } from "@/lib/types"

interface CreateMandateFormProps {
  walletAddress: Hex | null
  onCreate: (params: {
    goal: string
    budget: number
    maxSlippage: number
    targetAsset: string
    sourceAsset: string
    expiry: string
  }) => Promise<Mandate>
  onAuthorize: (id: string) => Promise<void>
}

type Step = "define" | "review" | "authorize" | "done"

const STEPS: { key: Step; label: string }[] = [
  { key: "define", label: "Define" },
  { key: "review", label: "Review" },
  { key: "authorize", label: "Authorize" },
]

export function CreateMandateForm({ walletAddress, onCreate, onAuthorize }: CreateMandateFormProps) {
  const [step, setStep] = useState<Step>("define")
  const [mandate, setMandate] = useState<Mandate | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [goal, setGoal] = useState<string>(GOAL_PRESETS[0].goal)
  const [budget, setBudget] = useState("20")
  const [maxSlippage, setMaxSlippage] = useState(2)
  const [targetAsset, setTargetAsset] = useState("ETH")
  const [sourceAsset, setSourceAsset] = useState(DEFAULT_SOURCE_ASSET)
  const [expiryHours, setExpiryHours] = useState(24)
  // Anchored when entering review so render stays pure; recomputed on create.
  const [expiryPreview, setExpiryPreview] = useState<Date | null>(null)

  const budgetNumber = Number(budget)
  const defineValid =
    goal.trim().length > 0 &&
    Number.isFinite(budgetNumber) &&
    budgetNumber > 0 &&
    targetAsset.trim().length > 0 &&
    targetAsset.trim().toUpperCase() !== sourceAsset.trim().toUpperCase()

  const handleCreate = async () => {
    setBusy(true)
    setError(null)
    try {
      const created = await onCreate({
        goal: goal.trim(),
        budget: budgetNumber,
        maxSlippage,
        targetAsset: targetAsset.trim().toUpperCase(),
        sourceAsset: sourceAsset.trim().toUpperCase(),
        expiry: new Date(Date.now() + expiryHours * 3_600_000).toISOString(),
      })
      setMandate(created)
      setStep("authorize")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create the mandate")
    } finally {
      setBusy(false)
    }
  }

  const handleAuthorize = async () => {
    if (!mandate) return
    setBusy(true)
    setError(null)
    try {
      await onAuthorize(mandate.id)
      setStep("done")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authorization failed")
    } finally {
      setBusy(false)
    }
  }

  if (step === "done") {
    return (
      <div className="rounded-2xl border border-positive/30 bg-surface p-8 text-center shadow-xs">
        <CheckCircle2 className="mx-auto h-10 w-10 text-positive" aria-hidden="true" />
        <h3 className="mt-4 font-display text-2xl font-light tracking-tight text-ink">Regent is authorized</h3>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted">
          The mandate is sealed. Activate the agent from the dashboard and watch it work within your
          boundaries.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink shadow-xs"
        >
          Open the dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-edge bg-surface shadow-xs">
      <nav aria-label="Progress" className="flex border-b border-edge bg-panel/30">
        {STEPS.map((s, i) => {
          const stepIndex = STEPS.findIndex((x) => x.key === step)
          const state = i < stepIndex ? "done" : i === stepIndex ? "current" : "next"
          return (
            <span
              key={s.key}
              aria-current={state === "current" ? "step" : undefined}
              className={`flex flex-1 items-center justify-center gap-2 px-3 py-3.5 text-xs font-semibold tracking-wide uppercase ${
                state === "current" ? "text-ink" : state === "done" ? "text-positive" : "text-muted"
              }`}
            >
              <span
                className={`tnum flex h-5 w-5 items-center justify-center rounded-full border font-mono text-[10px] ${
                  state === "current"
                    ? "border-ink bg-ink text-white"
                    : state === "done"
                      ? "border-positive bg-positive text-white"
                      : "border-edge bg-surface text-muted"
                }`}
                aria-hidden="true"
              >
                {state === "done" ? "✓" : i + 1}
              </span>
              {s.label}
            </span>
          )
        })}
      </nav>

      <div className="p-6">
        {step === "define" && (
          <div className="space-y-6">
            <div>
              <label htmlFor="mandate-goal" className="block text-xs font-semibold tracking-wide text-ink uppercase">
                Goal
              </label>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Goal presets">
                {GOAL_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setGoal(preset.goal)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                      goal === preset.goal
                        ? "border-ink bg-ink text-white shadow-2xs"
                        : "border-edge bg-surface text-muted hover:border-ink hover:text-ink"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <input
                id="mandate-goal"
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What should Regent accomplish?"
                className="mt-2 w-full rounded-xl border border-edge bg-panel/40 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-ink"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="mandate-budget" className="block text-xs font-semibold tracking-wide text-ink uppercase">
                  Budget
                </label>
                <div className="mt-2 flex rounded-xl border border-edge bg-panel/40 focus-within:outline-2 focus-within:outline-ink">
                  <input
                    id="mandate-budget"
                    type="number"
                    inputMode="decimal"
                    min={1}
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="tnum w-full rounded-l-xl bg-transparent px-3.5 py-2.5 font-mono text-sm text-ink focus:outline-none"
                  />
                  <input
                    type="text"
                    aria-label="Source asset"
                    value={sourceAsset}
                    onChange={(e) => setSourceAsset(e.target.value.toUpperCase())}
                    className="w-22 rounded-r-xl border-l border-edge bg-transparent px-3 py-2.5 font-mono text-sm text-muted uppercase focus:outline-none"
                  />
                </div>
                {!(budgetNumber > 0) && budget !== "" && (
                  <p className="mt-1.5 text-xs text-negative">Budget must be greater than 0</p>
                )}
              </div>

              <div>
                <label htmlFor="mandate-target" className="block text-xs font-semibold tracking-wide text-ink uppercase">
                  Target asset
                </label>
                <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Target asset presets">
                  {TARGET_ASSET_PRESETS.map((asset) => (
                    <button
                      key={asset}
                      type="button"
                      onClick={() => setTargetAsset(asset)}
                      className={`rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                        targetAsset === asset
                          ? "border-ink bg-ink text-white shadow-2xs"
                          : "border-edge bg-surface text-muted hover:border-ink hover:text-ink"
                      }`}
                    >
                      {asset}
                    </button>
                  ))}
                </div>
                <input
                  id="mandate-target"
                  type="text"
                  value={targetAsset}
                  onChange={(e) => setTargetAsset(e.target.value.toUpperCase())}
                  className="mt-2 w-full rounded-xl border border-edge bg-panel/40 px-3.5 py-2.5 font-mono text-sm uppercase text-ink focus-visible:outline-2 focus-visible:outline-ink"
                />
                {targetAsset.trim().toUpperCase() === sourceAsset.trim().toUpperCase() && (
                  <p className="mt-1.5 text-xs text-negative">Target must differ from the source asset</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="mandate-slippage" className="flex justify-between text-xs font-semibold tracking-wide text-ink uppercase">
                  Max slippage
                  <span className="tnum font-mono font-bold text-ink">{formatPercent(maxSlippage)}</span>
                </label>
                <input
                  id="mandate-slippage"
                  type="range"
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={maxSlippage}
                  onChange={(e) => setMaxSlippage(Number(e.target.value))}
                  className="mt-3 w-full"
                />
                <div className="tnum mt-1 flex justify-between font-mono text-[11px] text-muted">
                  <span>0.1%</span>
                  <span>10%</span>
                </div>
              </div>

              <div>
                <label htmlFor="mandate-expiry" className="flex justify-between text-xs font-semibold tracking-wide text-ink uppercase">
                  Expiry
                  <span className="tnum font-mono font-bold text-ink">
                    {expiryHours < 48 ? `${expiryHours}h` : `${Math.round(expiryHours / 24)}d`}
                  </span>
                </label>
                <input
                  id="mandate-expiry"
                  type="range"
                  min={1}
                  max={168}
                  step={1}
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(Number(e.target.value))}
                  className="mt-3 w-full"
                />
                <div className="tnum mt-1 flex justify-between font-mono text-[11px] text-muted">
                  <span>1h</span>
                  <span>7 days</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setExpiryPreview(new Date(Date.now() + expiryHours * 3_600_000))
                setStep("review")
              }}
              disabled={!defineValid}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40 shadow-xs"
            >
              Review the mandate <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-edge bg-panel/50 p-6 shadow-xs">
              <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-muted uppercase font-mono">
                <ScrollText className="h-3.5 w-3.5 text-ink" aria-hidden="true" /> Mandate of authority
              </p>
              <h3 className="mt-2 font-display text-xl font-light tracking-tight text-ink">{goal}</h3>
              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted text-xs uppercase tracking-wide">§1 Budget ceiling</dt>
                  <dd className="tnum font-mono font-medium text-ink">
                    {budgetNumber} {sourceAsset}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted text-xs uppercase tracking-wide">§2 Slippage ceiling</dt>
                  <dd className="tnum font-mono font-medium text-ink">{formatPercent(maxSlippage)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted text-xs uppercase tracking-wide">§3 Authority expires</dt>
                  <dd className="tnum font-mono font-medium text-ink">{expiryPreview?.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted text-xs uppercase tracking-wide">§4 Acquiring</dt>
                  <dd className="font-mono font-medium text-ink">{targetAsset}</dd>
                </div>
              </dl>
              <p className="mt-4 border-t border-edge pt-3 text-xs leading-relaxed text-muted">
                Regent may act only inside these clauses. Anything beyond them reverts — on-chain, in the
                agent, and in this interface.
              </p>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-negative/20 bg-negative/5 px-4 py-3 text-sm text-negative">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("define")}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-edge bg-surface px-5 text-sm font-medium text-ink transition-colors hover:bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
              </button>
              <button
                onClick={handleCreate}
                disabled={busy}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50 shadow-xs"
              >
                {busy ? "Creating…" : "Create mandate"}
              </button>
            </div>
          </div>
        )}

        {step === "authorize" && (
          <div className="space-y-6 text-center">
            <FileSignature className="mx-auto h-10 w-10 text-ink" aria-hidden="true" />
            <div>
              <h3 className="font-display text-2xl font-light tracking-tight text-ink">Grant authority</h3>
              <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted">
                {walletAddress ? (
                  <>
                    Sign the mandate boundaries with{" "}
                    <span className="font-mono font-medium text-ink">{truncateMiddle(walletAddress)}</span> (EIP-712).
                    Regent can never act outside what you sign.
                  </>
                ) : (
                  "No wallet connected — authorization will be simulated so you can try the full flow. Connect MetaMask for a real signature."
                )}
              </p>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-negative/20 bg-negative/5 px-4 py-3 text-sm text-negative">
                {error}
              </p>
            )}

            <button
              onClick={handleAuthorize}
              disabled={busy}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50 shadow-xs"
            >
              {busy ? "Authorizing…" : walletAddress ? "Sign & authorize Regent" : "Authorize Regent (simulated)"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

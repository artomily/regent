import type { MandateStatus } from "@/lib/types"

const STATUS: Record<MandateStatus, { label: string; dot: string; text: string }> = {
  pending: { label: "Pending", dot: "bg-muted", text: "text-muted" },
  authorized: { label: "Authorized", dot: "bg-ink", text: "text-ink" },
  active: { label: "Active", dot: "bg-positive animate-pulse-soft", text: "text-positive" },
  executing: { label: "Executing", dot: "bg-info animate-pulse-soft", text: "text-info" },
  completed: { label: "Completed", dot: "bg-positive", text: "text-positive" },
  rejected: { label: "Rejected", dot: "bg-negative", text: "text-negative" },
  revoked: { label: "Revoked", dot: "bg-negative", text: "text-negative" },
}

export function StatusChip({ status }: { status: MandateStatus }) {
  const s = STATUS[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-edge bg-surface px-2.5 py-0.5 font-mono text-[11px] font-medium tracking-wide uppercase shadow-2xs ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  )
}

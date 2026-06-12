export function formatAmount(value: number, maxDecimals = 6): string {
  if (!Number.isFinite(value)) return "—"
  const abs = Math.abs(value)
  const decimals = abs >= 1000 ? 2 : abs >= 1 ? 2 : maxDecimals
  return value.toLocaleString("en-US", {
    minimumFractionDigits: abs >= 1 ? 2 : 0,
    maximumFractionDigits: decimals,
  })
}

export function formatPercent(value: number): string {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`
}

export function truncateMiddle(value: string, lead = 6, tail = 4): string {
  if (value.length <= lead + tail + 1) return value
  return `${value.slice(0, lead)}…${value.slice(-tail)}`
}

export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 5) return "just now"
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function formatExpiry(expiry: string): string {
  const ms = new Date(expiry).getTime() - Date.now()
  if (ms <= 0) return "expired"
  const hours = Math.floor(ms / 3_600_000)
  if (hours < 1) return `${Math.max(1, Math.floor(ms / 60_000))}m left`
  if (hours < 48) return `${hours}h left`
  return `${Math.floor(hours / 24)}d left`
}

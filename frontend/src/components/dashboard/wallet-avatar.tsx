import type { Hex } from "viem"

interface WalletAvatarProps {
  address?: Hex | null
  className?: string
  size?: "sm" | "md" | "lg"
}

const GRADIENT_PRESETS = [
  "from-hero-amber via-lime to-hero-sun",
  "from-lime via-hero-sun to-panel-sage",
  "from-hero-sun via-hero-amber to-lime",
  "from-hero-amber via-lime to-canvas",
  "from-lime via-hero-amber to-hero-shade",
]

export function WalletAvatar({ address, className = "", size = "md" }: WalletAvatarProps) {
  const sizeClasses = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-11 w-11 text-sm",
  }[size]

  if (!address) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-full bg-panel-sage-dark text-ink ring-2 ring-edge/60 ${sizeClasses} ${className}`}
        aria-label="Unconnected wallet avatar"
      >
        <span className="font-mono font-medium text-muted">?</span>
      </div>
    )
  }

  // Derive deterministic parameters from address without any raw hex
  const clean = address.toLowerCase().replace(/^0x/, "")
  let hash = 0
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i)
    hash |= 0
  }
  const positiveHash = Math.abs(hash)
  const gradientClass = GRADIENT_PRESETS[positiveHash % GRADIENT_PRESETS.length]
  const initials = (clean.slice(0, 2)).toUpperCase()

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr ${gradientClass} text-ink ring-2 ring-edge/80 shadow-xs ${sizeClasses} ${className}`}
      title={address}
      aria-label={`Wallet identicon for ${address}`}
    >
      <div className="absolute inset-0 bg-ink/10 mix-blend-overlay" />
      <span className="relative z-10 font-mono font-bold tracking-tight text-ink">
        {initials}
      </span>
    </div>
  )
}

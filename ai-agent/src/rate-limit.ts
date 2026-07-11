interface Bucket {
  count: number
  resetAt: number
}

interface RateLimitRule {
  limit: number
  windowMs: number
}

// /evaluate and /execute trigger a Venice AI call and a 1Shot relayer submission
// respectively — both cost real money/quota, so they're limited tighter than
// /quotes, which only reads simulated or on-chain-free route data.
const RULES: Record<string, RateLimitRule> = {
  "/evaluate": { limit: 20, windowMs: 60_000 },
  "/execute": { limit: 20, windowMs: 60_000 },
  "/quotes": { limit: 60, windowMs: 60_000 },
}

const buckets = new Map<string, Bucket>()

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  retryAfterSeconds: number
}

export function checkRateLimit(clientId: string, pathname: string): RateLimitResult {
  const rule = RULES[pathname]
  if (!rule) return { allowed: true, limit: Infinity, remaining: Infinity, retryAfterSeconds: 0 }

  const key = `${clientId}:${pathname}`
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs })
    return { allowed: true, limit: rule.limit, remaining: rule.limit - 1, retryAfterSeconds: 0 }
  }

  if (bucket.count >= rule.limit) {
    return {
      allowed: false,
      limit: rule.limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    }
  }

  bucket.count += 1
  return { allowed: true, limit: rule.limit, remaining: rule.limit - bucket.count, retryAfterSeconds: 0 }
}

// Sweep expired buckets so long-running processes don't accumulate one entry
// per distinct IP forever.
setInterval(
  () => {
    const now = Date.now()
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key)
    }
  },
  5 * 60_000,
).unref()

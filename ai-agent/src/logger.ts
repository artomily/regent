type Level = "info" | "warn" | "error"

/**
 * Structured, dependency-free logging. Failures that fall back to simulation
 * or the heuristic policy are otherwise invisible in live mode — this makes
 * them greppable/alertable from stdout without adding an APM dependency.
 */
function emit(level: Level, event: string, context: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ level, event, time: new Date().toISOString(), ...context })
  if (level === "error") console.error(line)
  else if (level === "warn") console.warn(line)
  else console.log(line)
}

export const logger = {
  info: (event: string, context?: Record<string, unknown>) => emit("info", event, context),
  warn: (event: string, context?: Record<string, unknown>) => emit("warn", event, context),
  error: (event: string, context?: Record<string, unknown>) => emit("error", event, context),
}

import type { AgentHealth } from "@/lib/types"

const LABELS: Record<string, string> = {
  venice: "Venice AI",
  heuristic: "Heuristic",
  simulated: "Simulated",
  relayer: "1Shot",
}

export function AgentStatus({ health }: { health: AgentHealth | null }) {
  if (!health) {
    return (
      <span className="inline-flex h-10 items-center gap-2 rounded-full border border-edge px-4 text-xs text-dim">
        <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-dim" aria-hidden="true" />
        Agent…
      </span>
    )
  }

  const online = health.ok
  return (
    <span
      className="inline-flex h-10 items-center gap-2 rounded-full border border-edge bg-surface px-4 text-xs text-fog"
      title={
        online
          ? `Agent service online — intelligence: ${LABELS[health.mode.intelligence]}, execution: ${LABELS[health.mode.execution]}`
          : "Agent service offline — running on the built-in simulator"
      }
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${online ? "bg-positive" : "bg-positive/30 animate-pulse-soft"}`}
        aria-hidden="true"
      />
      {online ? `Agent · ${LABELS[health.mode.intelligence]}` : "Agent Online"}
    </span>
  )
}

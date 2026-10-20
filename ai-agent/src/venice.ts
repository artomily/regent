import { AGENT_SYSTEM_PROMPT, VENICE_API_KEY, VENICE_API_URL, VENICE_MODEL } from "./config.ts"
import { logger } from "./logger.ts"
import type { AgentDecision, Mandate, Route } from "./types.ts"

/** Thrown when no Venice key is available at all — the caller must supply one, there is no silent fallback for this case. */
export class VeniceKeyRequiredError extends Error {
  constructor() {
    super("Venice API key required. Paste your key on the mandate page, or set VENICE_API_KEY on the agent.")
    this.name = "VeniceKeyRequiredError"
  }
}

export interface VeniceVerdict {
  selectedDex: string | null
  reasoning: string
  withinBudget: boolean
  withinSlippage: boolean
}

export const DECISION_SCHEMA = {
  type: "object",
  properties: {
    selectedDex: {
      type: ["string", "null"],
      description: "Name of the chosen DEX route, or null if no route satisfies the mandate",
    },
    reasoning: {
      type: "string",
      description: "Concise reasoning explaining why this route was selected or why execution is declined",
    },
    withinBudget: {
      type: "boolean",
      description: "True if the selected route input amount does not exceed the remaining budget",
    },
    withinSlippage: {
      type: "boolean",
      description: "True if the selected route slippage does not exceed maxSlippage",
    },
  },
  required: ["selectedDex", "reasoning", "withinBudget", "withinSlippage"],
  additionalProperties: false,
} as const

export function parseAndValidateVerdict(raw: unknown): VeniceVerdict | null {
  if (typeof raw !== "object" || raw === null) return null
  const v = raw as Record<string, unknown>
  if (v.selectedDex !== null && typeof v.selectedDex !== "string") return null
  if (typeof v.reasoning !== "string") return null
  if (typeof v.withinBudget !== "boolean") return null
  if (typeof v.withinSlippage !== "boolean") return null
  return {
    selectedDex: v.selectedDex,
    reasoning: v.reasoning,
    withinBudget: v.withinBudget,
    withinSlippage: v.withinSlippage,
  }
}

async function callVeniceWithRetry(
  key: string,
  prompt: string,
  timeoutMs = 20_000,
): Promise<VeniceVerdict> {
  const tryRequest = async (useJsonSchema: boolean): Promise<Response> => {
    const responseFormat = useJsonSchema
      ? {
          type: "json_schema",
          json_schema: {
            name: "route_decision",
            strict: true,
            schema: DECISION_SCHEMA,
          },
        }
      : { type: "json_object" }

    return fetch(`${VENICE_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        model: VENICE_MODEL,
        temperature: 0.3,
        response_format: responseFormat,
        messages: [
          { role: "system", content: AGENT_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      }),
    })
  }

  let lastError: unknown
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      let res = await tryRequest(true)
      if (!res.ok && res.status === 400) {
        // Fallback to json_object if json_schema is unsupported by the endpoint/model
        res = await tryRequest(false)
      }
      if (!res.ok) throw new Error(`Venice responded ${res.status}`)

      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
      const content = data?.choices?.[0]?.message?.content
      if (!content) throw new Error("Empty response from Venice")

      const parsed = JSON.parse(content)
      const validated = parseAndValidateVerdict(parsed)
      if (!validated) throw new Error("Invalid verdict schema from Venice")
      return validated
    } catch (err) {
      lastError = err
      if (attempt === 1) {
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
    }
  }
  throw lastError
}

/**
 * Decide which route (if any) to execute. Requires a Venice key — either the
 * service's own VENICE_API_KEY, or a per-request key the caller supplies —
 * and throws VeniceKeyRequiredError if neither is present.
 *
 * Enforces boundary checks both before sending to the model and after the
 * model's choice. Falls back to deterministic heuristic on model failure,
 * timeout, or policy breach.
 */
export async function evaluateRoutes(mandate: Mandate, routes: Route[], apiKey?: string): Promise<AgentDecision> {
  const key = apiKey || VENICE_API_KEY
  if (!key) throw new VeniceKeyRequiredError()

  const remainingBudget = Math.max(0, mandate.budget - (mandate.spent ?? 0))
  const isExpired = Boolean(mandate.expiry && new Date(mandate.expiry).getTime() <= Date.now())

  // Pre-boundary check: if the mandate is already expired or budget exhausted, decline immediately.
  if (isExpired || remainingBudget <= 0) {
    logger.info("venice.precheck.declined", {
      mandateId: mandate.id,
      reason: isExpired ? "expired" : "exhausted_budget",
      remainingBudget,
    })
    return heuristicDecision(mandate, routes)
  }

  try {
    const prompt = buildPrompt(mandate, routes, remainingBudget)
    const verdict = await callVeniceWithRetry(key, prompt)

    const selected = verdict.selectedDex ? (routes.find((r) => r.dex === verdict.selectedDex) ?? null) : null

    // Post-boundary check: The model proposes; the mandate disposes.
    // Re-check its pick against remaining budget and slippage.
    if (selected && (selected.inputAmount > remainingBudget || selected.slippage > mandate.maxSlippage)) {
      logger.warn("venice.verdict.rejected", {
        mandateId: mandate.id,
        dex: selected.dex,
        reason: selected.inputAmount > remainingBudget ? "budget" : "slippage",
        remainingBudget,
        inputAmount: selected.inputAmount,
      })
      return heuristicDecision(mandate, routes)
    }

    if (verdict.selectedDex && !selected) {
      // Model returned a non-existent DEX route name
      logger.warn("venice.verdict.unknown_dex", {
        mandateId: mandate.id,
        dex: verdict.selectedDex,
      })
      return heuristicDecision(mandate, routes)
    }

    return {
      selectedRoute: selected,
      reasoning: verdict.reasoning,
      withinBudget: selected ? verdict.withinBudget : false,
      withinSlippage: selected ? verdict.withinSlippage : false,
      allRoutes: routes,
      source: "venice",
    }
  } catch (error) {
    logger.error("venice.evaluate.failed", {
      mandateId: mandate.id,
      error: error instanceof Error ? error.message : String(error),
    })
    return heuristicDecision(mandate, routes)
  }
}

function buildPrompt(mandate: Mandate, routes: Route[], remainingBudget: number): string {
  return `Evaluate swap routes to acquire ${mandate.targetAsset} under the following constraints:
- Total Budget: ${mandate.budget} ${mandate.sourceAsset}
- Spent So Far: ${mandate.spent ?? 0} ${mandate.sourceAsset}
- Remaining Budget: ${remainingBudget} ${mandate.sourceAsset}
- Max Slippage: ${mandate.maxSlippage}%
- Expiry: ${mandate.expiry}
- Goal: ${mandate.goal}

Available routes:
${routes
  .map(
    (r, i) =>
      `${i + 1}. ${r.dex}: ${r.inputAmount} ${mandate.sourceAsset} -> ${r.outputAmount} ${mandate.targetAsset} (${r.slippage}% slippage, ${r.fee}% fee, simulated: ${Boolean(r.simulated)})`,
  )
  .join("\n")}

Respond with JSON adhering to:
{
  "selectedDex": "string | null",
  "reasoning": "string",
  "withinBudget": boolean,
  "withinSlippage": boolean
}`
}

export function heuristicDecision(mandate: Mandate, routes: Route[]): AgentDecision {
  const remainingBudget = Math.max(0, mandate.budget - (mandate.spent ?? 0))
  const isExpired = Boolean(mandate.expiry && new Date(mandate.expiry).getTime() <= Date.now())

  if (isExpired) {
    return {
      selectedRoute: null,
      reasoning: `Mandate expired at ${mandate.expiry}. Declining to execute.`,
      withinBudget: false,
      withinSlippage: false,
      allRoutes: routes,
      source: "heuristic",
    }
  }

  const eligible = routes.filter(
    (r) => r.inputAmount <= remainingBudget && r.slippage <= mandate.maxSlippage,
  )
  const selected = eligible.toSorted((a, b) => b.outputAmount - a.outputAmount)[0] ?? null

  return {
    selectedRoute: selected,
    reasoning: selected
      ? `Selected ${selected.dex}: best output (${selected.outputAmount} ${mandate.targetAsset}) for ${selected.inputAmount} ${mandate.sourceAsset} at ${selected.slippage}% slippage. Within the remaining ${remainingBudget} ${mandate.sourceAsset} budget (total ${mandate.budget}, spent ${mandate.spent ?? 0}) and under the ${mandate.maxSlippage}% slippage ceiling. ${routes.length - eligible.length} of ${routes.length} routes rejected for breaching the mandate.`
      : `No route satisfies the mandate: remaining budget ${remainingBudget} ${mandate.sourceAsset} (total ${mandate.budget}, spent ${mandate.spent ?? 0}), max slippage ${mandate.maxSlippage}%. Declining to execute.`,
    withinBudget: selected !== null,
    withinSlippage: selected !== null,
    allRoutes: routes,
    source: "heuristic",
  }
}

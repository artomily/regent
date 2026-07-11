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

/**
 * Decide which route (if any) to execute. Requires a Venice key — either the
 * service's own VENICE_API_KEY, or a per-request key the caller supplies —
 * and throws VeniceKeyRequiredError if neither is present; the agent must
 * use the real model, it never silently swaps in the heuristic for a
 * missing key. Once a key is present, a failed/hallucinated Venice call
 * still falls back to the heuristic — that's a resilience safety net, not
 * a way to run without the model.
 */
export async function evaluateRoutes(mandate: Mandate, routes: Route[], apiKey?: string): Promise<AgentDecision> {
  const key = apiKey || VENICE_API_KEY
  if (!key) throw new VeniceKeyRequiredError()

  try {
    const response = await fetch(`${VENICE_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        model: VENICE_MODEL,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: AGENT_SYSTEM_PROMPT },
          { role: "user", content: buildPrompt(mandate, routes) },
        ],
      }),
    })

    if (!response.ok) throw new Error(`Venice responded ${response.status}`)

    const data = (await response.json()) as { choices: { message: { content: string } }[] }
    const verdict = JSON.parse(data.choices[0].message.content) as {
      selectedDex: string | null
      reasoning: string
      withinBudget: boolean
      withinSlippage: boolean
    }

    const selected = verdict.selectedDex ? (routes.find((r) => r.dex === verdict.selectedDex) ?? null) : null

    // The model proposes; the mandate disposes. Re-check its pick against the
    // hard boundaries so a hallucinated verdict can never authorize a spend.
    if (selected && (selected.inputAmount > mandate.budget || selected.slippage > mandate.maxSlippage)) {
      logger.warn("venice.verdict.rejected", {
        mandateId: mandate.id,
        dex: selected.dex,
        reason: selected.inputAmount > mandate.budget ? "budget" : "slippage",
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

function buildPrompt(mandate: Mandate, routes: Route[]): string {
  return `Evaluate swap routes to acquire ${mandate.targetAsset} with a budget of ${mandate.budget} ${mandate.sourceAsset} and max slippage of ${mandate.maxSlippage}%.

Goal: ${mandate.goal}

Available routes:
${routes
  .map(
    (r, i) =>
      `${i + 1}. ${r.dex}: ${r.inputAmount} ${mandate.sourceAsset} -> ${r.outputAmount} ${mandate.targetAsset} (${r.slippage}% slippage, ${r.fee}% fee)`,
  )
  .join("\n")}

Respond with JSON:
{
  "selectedDex": "string | null",
  "reasoning": "string",
  "withinBudget": boolean,
  "withinSlippage": boolean
}`
}

export function heuristicDecision(mandate: Mandate, routes: Route[]): AgentDecision {
  const eligible = routes.filter((r) => r.inputAmount <= mandate.budget && r.slippage <= mandate.maxSlippage)
  const selected = eligible.toSorted((a, b) => b.outputAmount - a.outputAmount)[0] ?? null

  return {
    selectedRoute: selected,
    reasoning: selected
      ? `Selected ${selected.dex}: best output (${selected.outputAmount} ${mandate.targetAsset}) for ${selected.inputAmount} ${mandate.sourceAsset} at ${selected.slippage}% slippage. Within the ${mandate.budget} ${mandate.sourceAsset} budget and under the ${mandate.maxSlippage}% slippage ceiling. ${routes.length - eligible.length} of ${routes.length} routes rejected for breaching the mandate.`
      : `No route satisfies the mandate: budget ${mandate.budget} ${mandate.sourceAsset}, max slippage ${mandate.maxSlippage}%. Declining to execute.`,
    withinBudget: selected !== null,
    withinSlippage: selected !== null,
    allRoutes: routes,
    source: "heuristic",
  }
}

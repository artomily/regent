import { AGENT_SYSTEM_PROMPT, VENICE_API_KEY, VENICE_API_URL, VENICE_MODEL } from "./config.ts"
import type { AgentDecision, Mandate, Route } from "./types.ts"

/**
 * Decide which route (if any) to execute. Uses Venice AI when a key is
 * configured; otherwise falls back to the same deterministic policy the
 * model is instructed to follow, so demo mode behaves identically.
 */
export async function evaluateRoutes(mandate: Mandate, routes: Route[]): Promise<AgentDecision> {
  if (!VENICE_API_KEY) return heuristicDecision(mandate, routes)

  try {
    const response = await fetch(`${VENICE_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VENICE_API_KEY}`,
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
  } catch {
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

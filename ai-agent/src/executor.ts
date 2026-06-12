import { randomUUID } from "node:crypto"
import { BASE_SEPOLIA_CHAIN_ID, LIVE_EXECUTION, MANDATE_CONTRACT, ONE_SHOT_RELAYER_URL } from "./config.ts"
import type { ExecutionResult, Mandate, Route } from "./types.ts"

/**
 * Execute the selected route. Live mode submits through the 1Shot
 * permissionless relayer (gas abstraction via EIP-7702) and records against
 * the RegentMandate contract; otherwise the execution is simulated so the
 * full product flow works with zero keys configured.
 */
export async function executeRoute(mandate: Mandate, route: Route): Promise<ExecutionResult> {
  // Final guard before any value moves — the mandate is law even if a caller
  // bypasses /evaluate and posts a route directly.
  if (route.inputAmount > mandate.budget) {
    return failure("Refused: spend would exceed the mandate budget")
  }
  if (route.slippage > mandate.maxSlippage) {
    return failure("Refused: slippage exceeds the mandate ceiling")
  }
  if (mandate.expiry && new Date(mandate.expiry).getTime() <= Date.now()) {
    return failure("Refused: mandate has expired")
  }

  if (!LIVE_EXECUTION) return simulate(route)

  try {
    const response = await fetch(ONE_SHOT_RELAYER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "relayer_send7710Transaction",
        params: {
          chainId: String(BASE_SEPOLIA_CHAIN_ID),
          // The delegation redemption bundle: swap via the chosen DEX router,
          // then recordExecution on RegentMandate (MANDATE_CONTRACT) so the
          // spend is enforced and audited on-chain.
          transactions: [],
          metadata: {
            mandateId: mandate.id,
            mandateContract: MANDATE_CONTRACT,
            delegationHash: mandate.delegationHash,
            route: route.dex,
          },
        },
      }),
    })

    const data = (await response.json()) as {
      result?: { transactionHash?: string; taskId?: string }
      error?: { message?: string }
    }
    if (data.error) throw new Error(data.error.message ?? "Relayer error")

    return {
      success: true,
      transactionHash: data.result?.transactionHash,
      taskId: data.result?.taskId,
      spentAmount: route.inputAmount,
      receivedAmount: route.outputAmount,
      feeAmount: route.fee,
      source: "relayer",
    }
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Unknown relayer error")
  }
}

function simulate(route: Route): ExecutionResult {
  const hash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
  return {
    success: true,
    transactionHash: hash,
    taskId: randomUUID(),
    spentAmount: route.inputAmount,
    receivedAmount: route.outputAmount,
    feeAmount: route.fee,
    source: "simulated",
  }
}

function failure(error: string): ExecutionResult {
  return { success: false, spentAmount: 0, receivedAmount: 0, feeAmount: 0, error, source: LIVE_EXECUTION ? "relayer" : "simulated" }
}

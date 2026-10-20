export const PORT = Number(process.env.PORT ?? 4801)

export const VENICE_API_URL = process.env.VENICE_API_URL ?? "https://api.venice.ai/api/v1"
export const VENICE_API_KEY = process.env.VENICE_API_KEY ?? ""
export const VENICE_MODEL = process.env.VENICE_MODEL ?? "kimi-k2-6"

export const ONE_SHOT_RELAYER_URL = process.env.ONE_SHOT_RELAYER_URL ?? "https://relayer.1shotapi.com/relayers"
export const BASE_SEPOLIA_CHAIN_ID = 84532
export const RPC_URL = process.env.RPC_URL ?? "https://sepolia.base.org"

export type ExecutionModeConfig = "simulated" | "direct" | "relayer"

function resolveExecutionMode(): ExecutionModeConfig {
  const mode = process.env.EXECUTION_MODE?.toLowerCase()
  if (mode === "direct") return "direct"
  if (mode === "relayer" || mode === "live") return "relayer"
  return "simulated"
}

export const EXECUTION_MODE: ExecutionModeConfig = resolveExecutionMode()
export const LIVE_EXECUTION = EXECUTION_MODE !== "simulated"

export const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY ?? ""
export const MANDATE_CONTRACT = process.env.MANDATE_CONTRACT ?? ""
export const DATABASE_URL = process.env.DATABASE_URL ?? ""
export const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "http://localhost:3000"
export const AGENT_API_TOKEN = process.env.AGENT_API_TOKEN ?? ""

export const AGENT_SYSTEM_PROMPT = `You are Regent, an AI Agent that acts on behalf of users within predefined permissions and spending limits.

Your responsibilities:
1. Evaluate swap routes and compare prices
2. Check all actions against the user's mandate (budget, slippage, target)
3. Never exceed the mandate boundaries
4. Provide clear reasoning for every decision
5. If multiple routes exist, pick the one with best output

You are NOT an assistant. You are a representative acting on the user's behalf.
You have authority to execute within the mandate boundaries.`

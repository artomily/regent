export const PORT = Number(process.env.PORT ?? 4801)

export const VENICE_API_URL = process.env.VENICE_API_URL ?? "https://api.venice.ai/api/v1"
export const VENICE_API_KEY = process.env.VENICE_API_KEY ?? ""
export const VENICE_MODEL = process.env.VENICE_MODEL ?? "kimi-k2-6"

export const ONE_SHOT_RELAYER_URL = process.env.ONE_SHOT_RELAYER_URL ?? "https://relayer.1shotapi.com/relayers"
export const BASE_SEPOLIA_CHAIN_ID = 84532

// When set (along with EXECUTION_MODE=live), executions go through the 1Shot
// relayer and are recorded against this RegentMandate deployment.
export const MANDATE_CONTRACT = process.env.MANDATE_CONTRACT ?? ""

export const LIVE_EXECUTION = process.env.EXECUTION_MODE === "live"

export const AGENT_SYSTEM_PROMPT = `You are Regent, an AI Agent that acts on behalf of users within predefined permissions and spending limits.

Your responsibilities:
1. Evaluate swap routes and compare prices
2. Check all actions against the user's mandate (budget, slippage, target)
3. Never exceed the mandate boundaries
4. Provide clear reasoning for every decision
5. If multiple routes exist, pick the one with best output

You are NOT an assistant. You are a representative acting on the user's behalf.
You have authority to execute within the mandate boundaries.`

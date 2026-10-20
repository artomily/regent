# ai-agent/

The Regent agent service: route discovery, Venice AI decision-making, and delegated execution on Base Sepolia, exposed over a small HTTP API. Built on Node 24+ with TypeScript, using `viem`, `@metamask/smart-accounts-kit`, and `@neondatabase/serverless`.

## Run

```bash
npm run dev --workspace ai-agent   # from repo root (or `npm run agent`)
# or inside this folder:
npm run dev                        # watch mode on http://localhost:4801
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Service status + which modes are live (`venice`/`heuristic`, `direct`/`relayer`/`simulated`) |
| GET | `/quotes?source=USDC&target=ETH&budget=20&maxSlippage=2` | DEX route quotes for a hypothetical mandate |
| POST | `/evaluate` | `{ mandate }` → `{ decision }` — fetches quotes, asks Venice AI to pick a route, re-validates the pick against the mandate |
| POST | `/execute` | `{ mandate, route }` → `{ result }` — final boundary check, then execution via direct transaction, 1Shot relayer, or simulation |

The frontend talks to this service through its `/api/agent/*` proxy routes and falls back to an in-process simulation when the service is down, so the demo never hard-fails.

## Configuration (`.env` or environment)

See `.env.example` for all configurable variables:

| Variable | Default | Effect |
|---|---|---|
| `PORT` | `4801` | Listen port |
| `VENICE_API_URL` | `https://api.venice.ai/api/v1` | Venice AI API base endpoint |
| `VENICE_API_KEY` | _empty_ | When set, decisions come from Venice AI; otherwise a deterministic heuristic with identical policy |
| `VENICE_MODEL` | `kimi-k2-6` | Venice model id |
| `EXECUTION_MODE` | `simulated` | `simulated` (default), `direct` (agent EOA sends redeem tx), or `relayer` (1Shot relayer submission) |
| `AGENT_PRIVATE_KEY` | _empty_ | Hex private key for agent account used in `direct` mode |
| `RPC_URL` | `https://sepolia.base.org` | Base Sepolia JSON-RPC endpoint |
| `MANDATE_CONTRACT` | _empty_ | Deployed `RegentMandate` address (see `contract/`) recorded with executions |
| `ONE_SHOT_RELAYER_URL` | `https://relayer.1shotapi.com/relayers` | 1Shot relayer endpoint |
| `DATABASE_URL` | _empty_ | Neon PostgreSQL connection string for decisions and executions logging |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `AGENT_API_TOKEN` | _empty_ | Optional shared secret header `authorization: Bearer <token>` or `x-agent-api-token` |

## Safety model

The model proposes; the mandate disposes. Venice's verdict is re-checked against budget/slippage in `venice.ts`, and `/execute` re-validates remaining budget, slippage, and expiry one last time before anything moves — a hallucinated or malicious payload cannot exceed the mandate.

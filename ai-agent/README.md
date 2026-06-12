# ai-agent/

The Regent agent service: route discovery, Venice AI decision-making, and 1Shot execution, exposed over a small HTTP API. Runs on Node 24+ with zero runtime dependencies (native TypeScript type stripping).

## Run

```bash
npm run dev --workspace ai-agent   # from repo root (or `npm run agent`)
# or inside this folder:
npm run dev                        # watch mode on http://localhost:4801
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Service status + which modes are live (`venice`/`heuristic`, `relayer`/`simulated`) |
| GET | `/quotes?source=USDC&target=ETH&budget=20&maxSlippage=2` | DEX route quotes for a hypothetical mandate |
| POST | `/evaluate` | `{ mandate }` → `{ decision }` — fetches quotes, asks Venice AI to pick a route, re-validates the pick against the mandate |
| POST | `/execute` | `{ mandate, route }` → `{ result }` — final boundary check, then relayer submission (or simulation) |

The frontend talks to this service through its `/api/agent/*` proxy routes and falls back to an in-process simulation when the service is down, so the demo never hard-fails.

## Configuration (`.env` or environment)

| Variable | Default | Effect |
|---|---|---|
| `PORT` | `4801` | Listen port |
| `VENICE_API_KEY` | _empty_ | When set, decisions come from Venice AI; otherwise a deterministic heuristic with identical policy |
| `VENICE_MODEL` | `kimi-k2-6` | Venice model id |
| `EXECUTION_MODE` | _unset_ | Set to `live` to submit through the 1Shot relayer instead of simulating |
| `ONE_SHOT_RELAYER_URL` | `https://relayer.1shotapi.com/relayers` | Relayer endpoint |
| `MANDATE_CONTRACT` | _empty_ | Deployed `RegentMandate` address (see `contract/`) recorded with live executions |

## Safety model

The model proposes; the mandate disposes. Venice's verdict is re-checked against budget/slippage in `venice.ts`, and `/execute` re-validates budget, slippage, and expiry one last time before anything moves — a hallucinated or malicious payload cannot exceed the mandate.

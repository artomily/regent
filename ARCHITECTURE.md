# Architecture

Regent is an agent-operated wallet: the user signs a **mandate** (goal + budget + slippage ceiling + expiry), and an AI agent executes within it. The system is three workspaces with one chain of authority — the interface drafts the mandate, the agent reasons about it, the contract enforces it.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                  USER                                    │
│              defines goal · budget · slippage · expiry                   │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │ signs (EIP-712, MetaMask)
                               ▼
┌─────────────────┐   /api/agent/* proxy    ┌─────────────────────────────┐
│   frontend/     │ ──────────────────────► │        ai-agent/            │
│   Next.js 16    │ ◄────────────────────── │  Node service  :4801        │
│   :3000         │   decision / result     │                             │
│                 │                         │  /quotes   DEX route quotes │
│  landing  page  │                         │  /evaluate Venice AI picks  │
│  dashboard      │                         │  /execute  1Shot relayer    │
│  mandate flow   │                         │            (or simulation)  │
└────────┬────────┘                         └──────────────┬──────────────┘
         │ createMandate / revoke                          │ recordExecution
         │ (viem, when configured)                         │ (via relayer)
         ▼                                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     contract/  ·  RegentMandate.sol                      │
│                        Base Sepolia (chain 84532)                        │
│   reverts: BudgetExceeded · SlippageExceeded · Expired · AlreadyRevoked  │
└──────────────────────────────────────────────────────────────────────────┘
```

## Workspaces

### `frontend/` — control surface
Next.js 16 (App Router, Tailwind v4). Three routes plus a server-side proxy:

- `/` — landing page with a dependency-free canvas 3D hero ([hero-3d.tsx](frontend/src/components/hero-3d.tsx))
- `/dashboard` — active mandate, live agent activity feed, route comparison, execution result, history
- `/mandate` — three-step flow: define → review → authorize (EIP-712 signature when a wallet is connected)
- `/api/agent/{health,evaluate,execute}` — proxy to the ai-agent with an in-process simulator fallback ([simulator.ts](frontend/src/lib/simulator.ts)), so the demo never hard-fails

State: mandates and the activity audit log persist in `localStorage` ([mandate-engine.ts](frontend/src/lib/mandate-engine.ts), [activity.ts](frontend/src/lib/activity.ts)); orchestration lives in [use-regent.ts](frontend/src/hooks/use-regent.ts).

### `ai-agent/` — decision engine
Zero-dependency Node 24 service (native TS type stripping). Pipeline per evaluation:

1. **Quotes** ([quotes.ts](ai-agent/src/quotes.ts)) — per-DEX routes (Aerodrome, Uniswap V3, SushiSwap, BaseSwap)
2. **Decision** ([venice.ts](ai-agent/src/venice.ts)) — Venice AI chat completion with a strict JSON verdict; *the model proposes, the mandate disposes*: the pick is re-validated against budget/slippage, and any hallucinated verdict falls back to the deterministic heuristic
3. **Execution** ([executor.ts](ai-agent/src/executor.ts)) — final boundary check (budget, slippage, expiry), then 1Shot relayer submission (`relayer_send7710Transaction`) or simulation

### `contract/` — law
`RegentMandate.sol`: on-chain mandate registry and spending guard. The owner registers boundaries and names the agent address; only that agent can `recordExecution`, and every call reverts unless **all** clauses hold (cumulative budget, slippage bps, expiry, not revoked). The owner can `revokeMandate` at any time — authority dies instantly. 11 Foundry tests cover the guard.

Production path: the swap itself routes through an ERC-7710 delegation from the user's MetaMask Smart Account with gas abstraction via EIP-7702 (1Shot); `RegentMandate` is the caveat enforcer and audit log.

## Mandate lifecycle

```
pending ──authorize──► authorized ──activate──► active ──► executing ──┬─► completed
   │                        │                                          └─► rejected
   └────────────────────────┴── revoke ──► revoked
```

Every transition is appended to the activity log with a timestamp and source tag (`venice` / `heuristic` / `simulated`, `relayer` / `simulated`) — the audit trail is part of the UX.

## Trust model — boundaries enforced three times

| Layer | Where | What it stops |
|---|---|---|
| Interface | `use-regent.ts` guards before execution | obvious breaches, instant feedback |
| Agent service | `venice.ts` re-check + `executor.ts` final check | hallucinated or malicious payloads to `/execute` |
| Contract | `RegentMandate.recordExecution` reverts | everything else — the agent's authority can never exceed the signature |

This redundancy is intentional. A bug or compromise in any one layer cannot move funds beyond the mandate.

## Modes

| Capability | Demo (default, zero config) | Live |
|---|---|---|
| Route quotes | simulated venues with realistic spreads | DEX router quotes (roadmap) |
| Decision | deterministic heuristic, same policy | Venice AI (`VENICE_API_KEY`) |
| Authorization | simulated, or real EIP-712 if a wallet is connected | EIP-712 + on-chain `createMandate` (`NEXT_PUBLIC_MANDATE_CONTRACT`) |
| Execution | simulated tx hash, clearly labeled | 1Shot relayer (`EXECUTION_MODE=live`) |
| Agent service down | frontend proxy falls back to in-process simulator | — |

## Ports

- frontend: **3000** (Next.js default)
- ai-agent: **4801** (`AGENT_URL` on the frontend side, `PORT` on the agent side)

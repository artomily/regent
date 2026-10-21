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

## Dual ERC-7710 Delegation Architecture

Regent implements standard MetaMask ERC-7710 delegations split into two distinct, narrowly scoped delegations signed by the user's Smart Account:

1. **`approveDelegation`**:
   - **Target**: USDC token address (`0x036CbD53842c5426634e7929541eC2318f3dCF7e` on Base Sepolia)
   - **Selector**: `approve(address,uint256)` (`0x095ea7b3`)
   - **Caveat Enforcers**:
     - `AllowedTargetsEnforcer`: Only USDC
     - `AllowedMethodsEnforcer`: Only `approve`
     - `AllowedCalldataEnforcer`: `startIndex: 4` locked to Uniswap `SwapRouter02` (`0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4`)
     - `LimitedCallsEnforcer`: Strictly capped execution allowance
   - **Salt**: Deterministic unique salt (`hash(mandateId, "approve")`)

2. **`swapDelegation`**:
   - **Target**: Uniswap `SwapRouter02` (`0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4`)
   - **Selector**: `exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))` (`0x04e45aaf`)
   - **Caveat Enforcers**:
     - `AllowedTargetsEnforcer`: Only SwapRouter02
     - `AllowedMethodsEnforcer`: Only `exactInputSingle`
     - `AllowedCalldataEnforcer` (3 terms):
       - Offset 4: `tokenIn` locked to USDC
       - Offset 36: `tokenOut` locked to WETH
       - Offset 100: `recipient` locked to user's Smart Account
     - `ERC20BalanceChangeEnforcer`: USDC spend cannot exceed mandate budget
     - `LimitedCallsEnforcer`: Strictly capped execution allowance
   - **Salt**: Deterministic unique salt (`hash(mandateId, "swap")`)

### Bundled Redemption & Execution Sequencing

When executing a swap route, the agent or relayer bundles both delegations into a single call to MetaMask `DelegationManager.redeemDelegations`:
- `delegations`: `[[approveDelegation], [swapDelegation]]`
- `modes`: `[ExecutionMode.SingleDefault, ExecutionMode.SingleDefault]`
- `executions`: `[[approveExecution], [swapExecution]]`

**Execution Order**:
1. `RegentMandate.recordExecution(onChainId, spendAmount, amountOutMinimum, slippageBps, routeRef)` is called first. If the spend exceeds remaining budget, breaches slippage, or the mandate has expired/revoked, the transaction reverts on-chain immediately.
2. `DelegationManager.redeemDelegations` is executed next. Even if an attacker attempted to bypass the agent service, the caveats on the Smart Account delegations reject any unauthorized spender, token, recipient, or balance change.

## API Authentication

Mutating `/api/mandates` endpoints (POST and PATCH) enforce cryptographic authentication:
- Every mutation request includes an EIP-191 `personal_sign` signature over canonical JSON:
  `{ action: "create" | "update", mandateId, owner, timestamp }`
- The server verifies:
  1. `timestamp` is within a 5-minute replay window (`|now - timestamp| <= 300_000ms`).
  2. Recovered address from `recoverMessageAddress` matches `mandate.owner` (401 on missing/invalid signature or timestamp, 403 on signer mismatch).
  3. When database persistence is configured, existing mandate ownership is verified before updates.

## Mandate lifecycle

```
pending ──authorize──► authorized ──activate──► active ──► executing ──┬─► completed
   │                        │                                          └─► rejected
   └────────────────────────┴── revoke ──► revoked
```

Every transition is appended to the activity log with a timestamp and source tag (`venice` / `heuristic` / `simulated`, `relayer` / `simulated`) — the audit trail is part of the UX.

## Trust Model & Residual Trust

| Layer | Where | What it stops |
|---|---|---|
| Interface | `use-regent.ts` guards before execution | Obvious breaches, client-side input validation |
| API Auth | `/api/mandates` EIP-191 verification | Unauthorized creation, tampering, or revocation of mandates |
| Agent service | `venice.ts` re-check + `executor.ts` boundary check | Hallucinated routes, bad quotes, out-of-budget payloads |
| Smart Account Delegation | `DelegationManager` + Caveat Enforcers | Unapproved targets, unexpected swap recipients, excessive token drains |
| Registry Contract | `RegentMandate.sol` | Cumulative budget breaches, slippage breaches, expired execution |

### Residual Trust Analysis
- **Can the agent steal funds?** No. The `approveDelegation` can only approve Uniswap `SwapRouter02`. The `swapDelegation` requires that recipient is the user's Smart Account (`AllowedCalldataEnforcer` offset 100) and that token decrease is bounded (`ERC20BalanceChangeEnforcer`).
- **Can the agent execute arbitrary trades?** No. `tokenIn` is constrained to USDC and `tokenOut` to WETH.
- **Can the agent overspend across multiple transactions?** No. `RegentMandate.sol` tracks cumulative spend across all executions against the mandate.
- **Can the agent act indefinitely?** No. `LimitedCallsEnforcer` limits call count, and `RegentMandate.expiry` terminates authority on-chain.

## Modes

| Capability | Demo (default, zero config) | Live Base Sepolia |
|---|---|---|
| Route quotes | Simulated venues with realistic spreads | Live Uniswap V3 quoter + fallback |
| Decision | Deterministic heuristic | Venice AI (`VENICE_API_KEY`) |
| Smart Account | Demo simulated account | MetaMask Smart Account (ERC-4337) |
| Delegation | Simulated deed authorization | Dual ERC-7710 delegations (approve + swap) |
| Enforcement | Interface boundary checks | `RegentMandate.sol` on-chain guard + caveat enforcers |
| Execution | Simulated tx hash, labeled in UI | Direct EOA execution or 1Shot relayer |
| Persistence | LocalStorage fallback | Authenticated Neon Postgres database |

## Ports

- frontend: **3000** (Next.js default)
- ai-agent: **4801** (`AGENT_URL` on the frontend side, `PORT` on the agent side)

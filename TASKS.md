# Tasks

Status board for Regent. Completed work is kept for context; unchecked items are the roadmap, roughly in priority order.

## Done

- [x] Monorepo restructure: `frontend/` + `ai-agent/` (npm workspaces) + `contract/` (Foundry)
- [x] `RegentMandate.sol` — on-chain mandate registry & spending guard (budget / slippage / expiry / revoke), 11 passing Foundry tests, ABI exported to `contract/abi/`
- [x] `ai-agent` service — quotes, Venice AI evaluation with heuristic fallback, 1Shot executor with simulation fallback, HTTP API (`/health`, `/quotes`, `/evaluate`, `/execute`)
- [x] Frontend `/api/agent/*` proxy with in-process simulator fallback (demo never hard-fails)
- [x] Brand system (`brand.md`, Tailwind v4 `@theme` tokens — warm near-black + brass, serif display)
- [x] Landing page with dependency-free canvas 3D hero (orb + mandate orbits + agent motes, reduced-motion safe)
- [x] Dashboard — mandate card with budget progress, live activity feed, route comparison with breach labeling, execution result, history
- [x] Mandate flow — define → review ("mandate of authority" deed) → authorize (EIP-712 via MetaMask when connected; simulated otherwise)
- [x] Wallet connect (Base Sepolia switch/add), revoke mandate, decision/result persistence across reloads
- [x] Wire real dual ERC-7710 delegation (approve + swap) via `@metamask/smart-accounts-kit` with narrow caveats (`AllowedCalldataEnforcer`, `ERC20BalanceChangeEnforcer`, `LimitedCallsEnforcer`, `AllowedTargetsEnforcer`)
- [x] ai-agent: dual delegation redemption via `SingleDefault` modes in a single transaction, with `recordExecution` enforced prior to redemption
- [x] Live DEX quotes via Uniswap V3 QuoterV2 on Base Sepolia with fallback
- [x] Cryptographic API authentication for `/api/mandates` via EIP-191 `personal_sign` and 5-minute replay window
- [x] Docs: CLAUDE.md, ARCHITECTURE.md, README, Base Sepolia runbook, per-workspace READMEs

## Next

- [ ] Deploy `RegentMandate` to Base Sepolia and commit the address (`script/deploy.sh`, then set `NEXT_PUBLIC_MANDATE_CONTRACT` + `MANDATE_CONTRACT`)
- [ ] Agent-side mandate store so the service can run autonomously on a schedule (today the frontend triggers evaluation)
- [ ] Read on-chain execution history (`executionAt`) into the dashboard activity feed when live
- [ ] Multi-mandate concurrency + per-mandate agent runs
- [ ] E2E test: create → authorize → run → completed (Playwright against demo mode)
- [ ] CI: forge test + tsc + next build on push

## Nice to have

- [ ] Streaming agent reasoning (SSE from `/evaluate`) into the activity feed
- [ ] Mandate templates (DCA, limit-order-style, payroll)
- [ ] Notifications on execution/refusal (web push)
- [ ] Mobile layout pass below 375px

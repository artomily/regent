@AGENTS.md

# Regent — project guide

An AI agent that acts on behalf of users within signed permissions and spending limits ("mandates"). You give the mandate; Regent executes — never beyond the boundaries.

## Monorepo layout

| Directory | What it is | Runtime |
|---|---|---|
| `frontend/` | Next.js 16 app — landing page, dashboard, mandate creation/authorization | Node, port 3000 |
| `ai-agent/` | Agent service — Venice AI route evaluation + 1Shot execution over HTTP | Node 24+ (zero deps), port 4801 |
| `contract/` | Foundry workspace — `RegentMandate` registry/spending guard on Base Sepolia | forge |

npm workspaces tie `frontend` and `ai-agent` together; `contract` is a Foundry project.

## Commands (from repo root)

```bash
npm install              # install all workspaces
npm run dev              # frontend on :3000
npm run agent            # ai-agent on :4801 (run alongside dev)
npm run build            # production build of the frontend
npm run lint             # eslint (frontend)
npm run contract:build   # forge build
npm run contract:test    # forge test (11 tests)
```

The app is fully functional with **no services and no keys** — every layer falls back to simulation (see ARCHITECTURE.md → Modes).

## Conventions

- **Wire types are duplicated intentionally**: `frontend/src/lib/types.ts` and `ai-agent/src/types.ts` must stay in sync (Mandate, Route, AgentDecision, ExecutionResult).
- **The ABI is generated, not hand-edited**: after changing `contract/src/RegentMandate.sol`, run `forge build` and regenerate `contract/abi/RegentMandate.json` (command in `contract/README.md`). The frontend imports that JSON directly.
- **Design tokens only**: colors/fonts come from `@theme` in `frontend/app/globals.css` (documented in `brand.md`). No raw hex in components, no `transition-all`, numbers always `font-mono` + `.tnum`.
- **Boundary checks are deliberately redundant** (UI, agent service, contract). Don't "clean up" a duplicate budget/slippage/expiry check — defense in depth is the product.
- **Port 4801** for the agent (3001 is commonly taken). The frontend proxy reads `AGENT_URL`.

## Environment variables

| Where | Variable | Purpose |
|---|---|---|
| `frontend/.env.local` | `AGENT_URL` | ai-agent base URL (default `http://localhost:4801`) |
| `frontend/.env.local` | `NEXT_PUBLIC_MANDATE_CONTRACT` | deployed RegentMandate address; unset = demo mode |
| `frontend/.env.local` | `NEXT_PUBLIC_AGENT_ADDRESS` | agent signer named in on-chain mandates |
| `ai-agent/.env` | `VENICE_API_KEY`, `VENICE_MODEL` | live Venice AI decisions |
| `ai-agent/.env` | `EXECUTION_MODE=live`, `MANDATE_CONTRACT` | 1Shot relayer execution |

## More docs

- `ARCHITECTURE.md` — system design, data flow, trust model
- `TASKS.md` — roadmap and status
- `brand.md` — palette, typography, voice
- `contract/README.md`, `ai-agent/README.md` — per-workspace details

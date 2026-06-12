# Regent

> You give the mandate. Regent executes.

An AI agent that acts on your behalf inside hard, signed boundaries — budget, slippage, expiry. Never beyond. Built on **MetaMask Smart Accounts** (delegation), **Venice AI** (intelligence), and the **1Shot relayer** (gas abstraction) on **Base Sepolia**.

## Quick start

```bash
npm install

# terminal 1 — the AI agent service (:4801)
npm run agent

# terminal 2 — the web app (:3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). **No keys or testnet funds needed** — demo mode simulates anything that isn't configured, and labels it honestly in the UI.

The full flow: give a mandate → review the clauses → authorize (real EIP-712 signature if MetaMask is connected) → activate Regent → watch it scan routes, reason, and execute within your boundaries — or refuse when a boundary would break.

## Structure

```
frontend/    Next.js 16 app — landing, dashboard, mandate flow, /api/agent proxy
ai-agent/    Agent service — Venice AI evaluation + 1Shot execution (Node 24, zero deps)
contract/    Foundry — RegentMandate.sol: on-chain budget/slippage/expiry guard (11 tests)
```

How they connect, and why every boundary is enforced three times: see [ARCHITECTURE.md](ARCHITECTURE.md). Roadmap: [TASKS.md](TASKS.md). Design system: [brand.md](brand.md).

## Going live

| Step | How |
|---|---|
| Venice AI decisions | `ai-agent/.env`: `VENICE_API_KEY=...` |
| Deploy the contract | `cd contract && PRIVATE_KEY=0x... ./script/deploy.sh` |
| On-chain mandates | `frontend/.env.local`: `NEXT_PUBLIC_MANDATE_CONTRACT=0x...` |
| 1Shot execution | `ai-agent/.env`: `EXECUTION_MODE=live`, `MANDATE_CONTRACT=0x...` |

```bash
npm run contract:test    # forge test — the mandate guard suite
npm run build            # production frontend build
```

## Hackathon tracks

- **Best Agent** — Regent *is* the agent: bounded delegation with an auditable decision trail
- **Best Use of Venice AI** — route evaluation and the decision engine (`ai-agent/src/venice.ts`)
- **Best Use of 1Shot Permissionless Relayer** — gas-abstracted delegated execution (`ai-agent/src/executor.ts`)

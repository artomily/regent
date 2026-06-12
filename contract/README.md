# contract/

On-chain layer for Regent: the `RegentMandate` registry and spending guard.

## What it does

`RegentMandate` turns a mandate into an enforceable on-chain object:

- `createMandate(agent, sourceToken, targetToken, budget, maxSlippageBps, expiry, goal)` — the owner registers the boundaries and names the agent address allowed to act.
- `recordExecution(id, spend, received, slippageBps, routeRef)` — only the agent can call it, and it reverts on anything outside the mandate: over budget (cumulative), over the slippage ceiling, after expiry, or after revocation.
- `revokeMandate(id)` — the owner pulls authority instantly.
- Views: `remainingBudget`, `isActive`, `executionCount`, `executionAt`, `mandatesByOwner`.

The contract is the source of truth for "the agent can never exceed what the owner signed." In the full production flow the swap itself routes through an ERC-7710 delegation from the owner's MetaMask Smart Account; this contract is the caveat enforcer and audit log.

## Layout

```
src/RegentMandate.sol      — the contract
test/RegentMandate.t.sol   — Foundry tests (no forge-std needed)
script/deploy.sh           — forge create deploy to Base Sepolia
abi/RegentMandate.json     — exported ABI, imported by frontend/ and ai-agent/
```

## Commands

```bash
forge build                # compile
forge test                 # run the 11-test suite
PRIVATE_KEY=0x... ./script/deploy.sh   # deploy to Base Sepolia

# regenerate the shared ABI after changing the contract:
jq '{abi: .abi}' out/RegentMandate.sol/RegentMandate.json > abi/RegentMandate.json
```

From the repo root you can also run `npm run contract:build` / `npm run contract:test`.

## Wiring the deployed address

| Consumer | Variable |
|---|---|
| `frontend/.env.local` | `NEXT_PUBLIC_MANDATE_CONTRACT=0x...` |
| `ai-agent/.env` | `MANDATE_CONTRACT=0x...` |

When unset, both run in demo mode and skip on-chain calls.

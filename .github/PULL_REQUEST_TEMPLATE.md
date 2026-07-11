## What does this PR do?

<!-- Short description of the change and why it's needed. -->

## Which part of Regent does this touch?

- [ ] `frontend/` (UI, mandate flow, dashboard)
- [ ] `ai-agent/` (Venice AI evaluation, 1Shot execution)
- [ ] `contract/` (RegentMandate.sol)
- [ ] Docs only

## Checklist

- [ ] I read [CONTRIBUTING.md](../CONTRIBUTING.md), especially the conventions around redundant boundary checks and duplicated wire types.
- [ ] `npm run lint` passes (if `frontend/` changed)
- [ ] `npm run build` passes (if `frontend/` changed)
- [ ] `npm run contract:test` passes and the ABI was regenerated (if `contract/` changed)
- [ ] `frontend/src/lib/types.ts` and `ai-agent/src/types.ts` are still in sync (if wire types changed)
- [ ] New env vars are documented in the README's *Environment variables* table

## Does this change any mandate boundary logic (budget / slippage / expiry / authorization)?

<!-- If yes, explain what could go wrong if this check were skipped or bypassed, and how you verified it can't be. If no, delete this section. -->

## Screenshots / transaction hashes (if applicable)

<!-- For UI changes or on-chain interactions. -->

# Contributing to Regent

Thanks for considering a contribution. Regent is an AI agent that acts within signed, bounded mandates — the boundaries are the product, so contributions that touch enforcement logic get extra scrutiny. That's not meant to discourage you, just to set expectations.

## Getting set up

```bash
git clone https://github.com/artomily/regent.git
cd regent
npm install
```

The app runs fully with **no services and no keys** — every layer (Venice AI decisions, 1Shot execution, on-chain contract) falls back to a clearly-labeled simulation. See [ARCHITECTURE.md](ARCHITECTURE.md) → *Modes* for details.

```bash
npm run dev              # frontend on :3000
npm run agent            # ai-agent on :4801 (run alongside dev)
npm run build            # production build of the frontend
npm run lint             # eslint (frontend)
npm run contract:build   # forge build
npm run contract:test    # forge test (11 tests)
```

Repo layout:

| Directory | What it is |
|---|---|
| `frontend/` | Next.js app — landing page, dashboard, mandate creation/authorization |
| `ai-agent/` | Agent service — Venice AI route evaluation + 1Shot execution over HTTP |
| `contract/` | Foundry workspace — `RegentMandate` registry/spending guard |

## Before you open a PR

1. **Read [CLAUDE.md](CLAUDE.md) and [ARCHITECTURE.md](ARCHITECTURE.md) first.** They cover conventions that aren't obvious from the code alone.
2. **Don't collapse the redundant boundary checks.** Budget/slippage/expiry are validated independently in the UI, the agent service, and the contract. If you see the same check three times, that's intentional defense in depth — not a cleanup target.
3. **Keep the wire types in sync.** `frontend/src/lib/types.ts` and `ai-agent/src/types.ts` duplicate `Mandate`, `Route`, `AgentDecision`, and `ExecutionResult` on purpose (no shared package between workspaces). If you change one, change the other.
4. **Don't hand-edit the ABI.** After changing `contract/src/RegentMandate.sol`, run `forge build` and regenerate `contract/abi/RegentMandate.json` per `contract/README.md`. The frontend imports that JSON directly.
5. **Design tokens only in the frontend.** Colors and fonts come from `@theme` in `frontend/app/globals.css` (documented in `brand.md`). No raw hex values in components, no `transition-all`, numbers always `font-mono` + `.tnum`.
6. **Run the relevant checks locally** before pushing: `npm run lint`, `npm run build`, and `npm run contract:test` if you touched the contract.

## Making changes

- **Small, focused PRs** are easier to review than large ones. If a change spans the frontend, agent, and contract, consider whether it can be split.
- **Explain the "why" in your PR description**, especially for anything touching mandate boundaries, execution logic, or the trust model. What could go wrong if this check is skipped or bypassed?
- **New env vars or config** should be documented in the README's *Environment variables* table and in the relevant workspace README.
- **Commit messages**: short, imperative, present tense (`fix: ...`, `feat: ...`, `docs: ...`). Look at `git log` for the existing style.

## Reporting bugs and proposing features

Open an issue: [github.com/artomily/regent/issues](https://github.com/artomily/regent/issues). Include repro steps, what you expected, and what happened — screenshots or a transaction hash help a lot if the issue is on-chain.

For anything that looks like a way to bypass a mandate boundary or move funds outside signed limits, please see [SECURITY.md](SECURITY.md) instead of opening a public issue.

## Code of conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md). Be respectful; disagreements about code are fine, disrespect toward people isn't.

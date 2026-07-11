# Security Policy

Regent is a non-custodial agent that acts within signed, bounded mandates. Boundary enforcement (budget, slippage, expiry) is the core security guarantee of the product, and it's checked redundantly in three places: the frontend, the agent service, and the on-chain contract (see [ARCHITECTURE.md](ARCHITECTURE.md) → *Trust model*).

We take reports that a boundary can be bypassed, or that funds could move outside a signed mandate, seriously.

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, report it privately:

- **Email**: vararakya@gmail.com — include a description, reproduction steps, and (if applicable) affected contract address / transaction hash / commit SHA.
- Alternatively, if enabled on the repo, use [GitHub's private vulnerability reporting](https://github.com/artomily/regent/security/advisories/new).

We'll acknowledge your report as soon as we can and follow up with next steps. Please give us a reasonable window to investigate and fix an issue before any public disclosure.

## Scope

In scope:

- `contract/src/RegentMandate.sol` — any way to exceed budget, slippage, or expiry boundaries, or to execute/revoke a mandate without proper authorization.
- `ai-agent/` — any way to get the agent to submit an execution that the contract shouldn't allow, or to bypass the agent's own pre-flight boundary checks.
- `frontend/` — signature/authorization flow issues (e.g., EIP-712 signing, mandate creation), or anything that could mislead a user about what a mandate actually authorizes.

Out of scope:

- Issues that only affect the simulation/demo fallback paths (no real funds or keys involved), unless they could mislead a user into thinking they're safe when they aren't.
- Third-party dependencies — please report those upstream, though we'd appreciate a heads-up if it affects Regent directly.

## Supported versions

Regent is a hackathon project under active development on `main`. There are no long-term-support branches — please report issues against the latest commit on `main`.

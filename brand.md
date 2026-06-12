# Brand — Regent

_Status: active_

**Concept:** A regent rules *on behalf of* the sovereign — power that is delegated, bounded, and revocable. The brand is dark, restrained, and quietly regal: near-black warmth, a single brass accent, serif display type. Authority without noise.

**Direction:** Warm Monochrome polish + Workstation Dense data panels. Dark-native (no light theme).

## Palette

Tokens live in `frontend/app/globals.css` under `@theme`. Use utilities (`bg-ink`, `text-brass`…), never raw hex in components.

| Token | Hex | Role |
|---|---|---|
| `ink` | `#0f0d0a` | page background (warm near-black, never pure `#000`) |
| `surface` | `#16130e` | cards / panels |
| `raised` | `#1e1a13` | nested surfaces, inputs |
| `overlay` | `#27221a` | tracks, deepest fills |
| `edge` | `rgb(236 230 217 / 0.08)` | default borders |
| `edge-strong` | `rgb(236 230 217 / 0.18)` | emphasized borders / hover |
| `cream` | `#ece6d9` | primary text |
| `fog` | `#a89e8a` | secondary text (AA on ink) |
| `dim` | `#7a7263` | tertiary — labels/decoration only, not body text |
| `brass` | `#c9a35e` | THE accent: primary actions, active states, logo |
| `brass-bright` | `#e2c280` | accent hover / emphasized accent text |
| `brass-faint` | `rgb(201 163 94 / 0.12)` | selected-state fills |
| `positive` | `#7ed09a` | success / completed (always paired with a label) |
| `negative` | `#e07a7a` | errors / rejected / revoked |
| `info` | `#8db8e8` | in-progress states |

Rule: brass is the only brand color. Green/red/blue are semantic outcomes only.

## Typography

| Face | Token | Use |
|---|---|---|
| Instrument Serif | `font-display` | headlines, mandate goals, the wordmark — the "regal" voice |
| Geist | `font-sans` | UI, body |
| Geist Mono | `font-mono` + `.tnum` | every number, address, hash, token symbol, timestamp |

3 weights max. Display sizes 3xl–7xl with tight leading; uppercase micro-labels at 11px with `tracking-[0.18em]`.

## Motion

- In-app micro-interactions: ≤200ms, color/transform only — never `transition-all`
- Landing entrances: `animate-rise` 700ms staggered ≤320ms
- Live/working states: `animate-pulse-soft`
- Everything gated by `prefers-reduced-motion` (the 3D hero renders a static frame)

## Voice

Measured, declarative, a little ceremonial. Mandates are written like deeds ("§1 Budget ceiling", "Mandate of authority"). Key lines:

> You give the mandate. Regent executes.
> The mandate is law.
> Delegate the work. Keep the throne.

Never exclamation marks, never "supercharge/unleash", no emoji in product UI (lucide icons only).

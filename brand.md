# Brand — Regent

_Status: active_

**Concept:** A regent rules *on behalf of* the sovereign — power that is delegated, bounded, and revocable. The brand is a light editorial system modeled on high-craft Swiss design (the Wellmo aesthetic): warm off-white canvas, near-black ink, crisp hairline dividers, subtle frosted glass, and chartreuse/lime accent used sparingly. Authority with architectural clarity.

**Direction:** Light Editorial + Hairline Architectural Grid + Frosted Glass Metrics.

## Palette

Tokens live in `frontend/app/globals.css` under `@theme`. Use semantic utilities (`bg-canvas`, `bg-panel`, `text-ink`, `border-edge`, `bg-lime`…), never raw hex in components.

| Token | Hex / Value | Role |
|---|---|---|
| `canvas` | `#F5F4EE` | default page background (warm off-white) |
| `panel` | `#EDECE5` | slightly darker warm panel, card backgrounds, nested sections |
| `surface` | `#FAF9F4` | elevated card and modal surface |
| `raised` | `#EDECE5` | nested surfaces, inputs |
| `overlay` | `#E4E3DB` | deeper fills, slider tracks |
| `ink` | `#111110` | primary text, dark pill buttons, wordmark |
| `muted` | `#8A8A85` | secondary text (AA compliant on light canvas/panel) |
| `dim` | `#A8A8A2` | tertiary labels and subtle micro-text |
| `edge` | `#DCDBD3` | 1px hairline grid dividers and default borders |
| `edge-strong` | `#C4C3B9` | emphasized borders, hover states |
| `lime` | `#E3E82A` | THE accent: chartreuse/lime for progress bars, status indicators, badges |
| `lime-faint` | `rgba(227, 232, 42, 0.18)` | faint accent washes and selected pills |
| `positive` | `#166534` | success / completed (paired with a label) |
| `negative` | `#DC2626` | errors / rejected / revoked |
| `info` | `#2563EB` | in-progress / executing states |

Rule: Lime (`#E3E82A`) is used sparingly for high-visibility progress indicators and status pills. Ink (`#111110`) anchors primary actions.

## Typography

| Face | Token | Use |
|---|---|---|
| DM Sans | `font-display` | headlines (weight 300 / light with tight tracking `tracking-tight`), wordmark `REGENT®` |
| DM Sans / Geist | `font-sans` | body text, form labels, general UI |
| Geist Mono | `font-mono` + `.tnum` | every number, address, hash, token symbol, timestamp |

Display sizes 3xl–7xl with tight leading and tracking (`tracking-[-0.03em]`); uppercase micro-labels at 10–11px with `tracking-[0.18em]` (e.g. `(01)`, `©2026`, `MANDATE #01`).

## Layout Language & Components

- **1px Hairline Grid Dividers:** Sections are framed by crisp 1px borders (`border-edge`) creating clean architectural rails and numbered columns.
- **Section Markers:** Numbered indices like `(01)`, `(02)` and copyright marks `©2026` in `font-mono text-muted text-xs`.
- **Circular Black Arrow CTA:** Round black buttons (`w-14 h-14 rounded-full bg-ink text-white`) with arrow up-right icons.
- **Pill Chips & Buttons:** Rounded-full pill buttons in solid ink (`bg-ink text-white`), clean white (`bg-white text-ink`), or hairline outline (`border border-edge bg-surface`).
- **Frosted-Glass Data Cards:** Translucent warm surfaces with `backdrop-blur-xl`, subtle 1px border (`border-white/20`), lime progress bars, and small status pills.

## Motion

- In-app micro-interactions: ≤200ms, color/transform only — never `transition-all`
- Landing entrances: `animate-rise` 700ms staggered ≤320ms
- Live/working states: `animate-pulse-soft`
- Everything gated by `prefers-reduced-motion` (the 3D canvas renders a static frame)

## Voice

Measured, declarative, a little ceremonial. Mandates are written like deeds ("§1 Budget ceiling", "Mandate of authority"). Key lines:

> You give the mandate. Regent executes.
> The mandate is law.
> Delegate the work. Keep the throne.

Never exclamation marks, never "supercharge/unleash", no emoji in product UI (lucide icons only).

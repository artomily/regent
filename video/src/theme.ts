// Regent brand tokens — mirrors frontend/app/globals.css @theme (see brand.md).
export const C = {
  ink: "#0f0d0a",
  surface: "#16130e",
  raised: "#1e1a13",
  overlay: "#27221a",
  edge: "rgba(236,230,217,0.08)",
  edgeStrong: "rgba(236,230,217,0.18)",
  cream: "#ece6d9",
  fog: "#a89e8a",
  dim: "#7a7263",
  brass: "#c9a35e",
  brassBright: "#e2c280",
  brassFaint: "rgba(201,163,94,0.12)",
  positive: "#7ed09a",
  negative: "#e07a7a",
  info: "#8db8e8",
};

// Faces — use system fallbacks so renders never depend on the network.
export const FONT_DISPLAY = "'Instrument Serif', Georgia, 'Times New Roman', serif";
export const FONT_SANS =
  "-apple-system, 'Geist', 'Helvetica Neue', Arial, sans-serif";
export const FONT_MONO = "'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace";

export const microLabel = {
  fontFamily: FONT_SANS,
  textTransform: "uppercase" as const,
  letterSpacing: "0.18em",
  fontSize: 22,
  color: C.dim,
  fontWeight: 500,
};

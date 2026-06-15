import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONT_DISPLAY, FONT_MONO, FONT_SANS, microLabel } from "./theme";

// Scene-level fade in/out so cuts breathe without a transition library.
export const useEnterExit = (durationInFrames: number, pad = 14) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, pad], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exit = interpolate(
    frame,
    [durationInFrames - pad, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return Math.min(enter, exit);
};

// Spring-driven rise with stagger. Returns {opacity, transform}.
export const useRise = (delay: number, distance = 28) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
    durationInFrames: 24,
  });
  return {
    opacity: p,
    transform: `translateY(${interpolate(p, [0, 1], [distance, 0])}px)`,
  };
};

export const Stage: React.FC<{
  index: number;
  total: number;
  caption: string;
  durationInFrames: number;
  children: React.ReactNode;
}> = ({ index, total, caption, durationInFrames, children }) => {
  const opacity = useEnterExit(durationInFrames);
  const frame = useCurrentFrame();
  // Slow brass glow drift for a living background.
  const glow = interpolate(frame % 240, [0, 120, 240], [0.5, 0.75, 0.5]);

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink, opacity }}>
      {/* warm radial glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(1200px 800px at 50% 38%, rgba(201,163,94,${
            0.1 * glow
          }), transparent 70%)`,
        }}
      />
      {/* vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(1400px 1400px at 50% 50%, transparent 55%, rgba(0,0,0,0.55))",
        }}
      />

      {/* top bar: wordmark + scene counter */}
      <div
        style={{
          position: "absolute",
          top: 56,
          left: 72,
          right: 72,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 34,
            color: C.brass,
            letterSpacing: "0.02em",
          }}
        >
          Regent
        </div>
        <div style={{ ...microLabel, fontSize: 18, color: C.dim }}>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>
      </div>

      {/* content area */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "150px 120px 220px",
        }}
      >
        {children}
      </AbsoluteFill>

      {/* caption bar (narration, for muted viewing) */}
      <Caption text={caption} />
    </AbsoluteFill>
  );
};

const Caption: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [6, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        bottom: 78,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: op,
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          textAlign: "center",
          fontFamily: FONT_SANS,
          fontSize: 30,
          lineHeight: 1.45,
          color: C.fog,
          padding: "0 40px",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const MicroLabel: React.FC<{
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}> = ({ children, color, style }) => (
  <div style={{ ...microLabel, ...(color ? { color } : {}), ...style }}>
    {children}
  </div>
);

export const Panel: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: boolean;
}> = ({ children, style, accent }) => (
  <div
    style={{
      backgroundColor: C.surface,
      border: `1px solid ${accent ? C.brass : C.edge}`,
      borderRadius: 18,
      boxShadow: accent
        ? `0 0 0 1px ${C.brassFaint}, 0 24px 60px rgba(0,0,0,0.45)`
        : "0 24px 60px rgba(0,0,0,0.4)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Mono: React.FC<{
  children: React.ReactNode;
  color?: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({ children, color = C.cream, size = 30, style }) => (
  <span
    style={{
      fontFamily: FONT_MONO,
      fontVariantNumeric: "tabular-nums",
      fontSize: size,
      color,
      ...style,
    }}
  >
    {children}
  </span>
);

export { C, FONT_DISPLAY, FONT_MONO, FONT_SANS };

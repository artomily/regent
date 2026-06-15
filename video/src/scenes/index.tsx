import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  C,
  FONT_DISPLAY,
  MicroLabel,
  Mono,
  Panel,
  Stage,
  useRise,
} from "../components";

export type SceneProps = {
  index: number;
  total: number;
  caption: string;
  durationInFrames: number;
};

const Display: React.FC<{
  children: React.ReactNode;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ children, size = 96, color = C.cream, style }) => (
  <div
    style={{
      fontFamily: FONT_DISPLAY,
      fontSize: size,
      lineHeight: 1.05,
      color,
      letterSpacing: "0.01em",
      ...style,
    }}
  >
    {children}
  </div>
);

/* ── Scene 1 — Hook ───────────────────────────────────────────── */
export const Scene1: React.FC<SceneProps> = (p) => {
  const frame = useCurrentFrame();
  const pulse = 1 + 0.04 * Math.sin((frame / 30) * Math.PI);
  const orbit = (frame / 90) * Math.PI * 2;
  const l1 = useRise(8);
  const l2 = useRise(26);
  return (
    <Stage {...p}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            position: "relative",
            width: 260,
            height: 260,
            margin: "0 auto 56px",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: `radial-gradient(circle at 50% 45%, ${C.brassBright}, ${C.brass} 38%, rgba(201,163,94,0.08) 70%, transparent 72%)`,
              transform: `scale(${pulse})`,
              boxShadow: `0 0 120px rgba(201,163,94,0.45)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: C.cream,
              top: 130 + Math.sin(orbit) * 150 - 9,
              left: 130 + Math.cos(orbit) * 150 - 9,
              boxShadow: "0 0 24px rgba(236,230,217,0.7)",
            }}
          />
        </div>
        <Display size={104} style={l1}>
          You spot the perfect trade.
        </Display>
        <Display size={72} color={C.fog} style={{ ...l2, marginTop: 18 }}>
          Then life gets in the way.
        </Display>
      </div>
    </Stage>
  );
};

/* ── Scene 2 — Two bad choices ────────────────────────────────── */
const BadCard: React.FC<{
  title: string;
  sub: string;
  delay: number;
}> = ({ title, sub, delay }) => {
  const r = useRise(delay);
  return (
    <Panel
      style={{
        width: 520,
        padding: "52px 48px",
        borderColor: "rgba(224,122,122,0.35)",
        ...r,
      }}
    >
      <div
        style={{
          fontSize: 56,
          color: C.negative,
          marginBottom: 22,
          lineHeight: 1,
        }}
      >
        ✕
      </div>
      <Display size={56}>{title}</Display>
      <div
        style={{
          marginTop: 16,
          fontSize: 30,
          color: C.fog,
          fontFamily: "inherit",
        }}
      >
        {sub}
      </div>
    </Panel>
  );
};

export const Scene2: React.FC<SceneProps> = (p) => {
  const head = useRise(6);
  return (
    <Stage {...p}>
      <div style={{ textAlign: "center", width: "100%" }}>
        <MicroLabel style={{ marginBottom: 18 }}>The choice today</MicroLabel>
        <Display size={88} style={head}>
          Two bad choices.
        </Display>
        <div
          style={{
            display: "flex",
            gap: 56,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 60,
          }}
        >
          <BadCard
            title="Miss it"
            sub="The moment passes while you sleep."
            delay={20}
          />
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 52, color: C.dim }}>
            or
          </div>
          <BadCard
            title="Hand over your keys"
            sub="Trust a script with full custody."
            delay={34}
          />
        </div>
      </div>
    </Stage>
  );
};

/* ── Scene 3 — Regent, a third way ────────────────────────────── */
export const Scene3: React.FC<SceneProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const word = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 26 });
  const rule = interpolate(frame, [22, 50], [0, 560], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tag = useRise(48);
  const micro = useRise(64);
  return (
    <Stage {...p}>
      <div style={{ textAlign: "center" }}>
        <MicroLabel style={{ marginBottom: 10, ...micro }}>A third way</MicroLabel>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 220,
            lineHeight: 1,
            color: C.brass,
            opacity: word,
            transform: `translateY(${interpolate(word, [0, 1], [40, 0])}px)`,
          }}
        >
          Regent
        </div>
        <div
          style={{
            height: 2,
            width: rule,
            margin: "26px auto 28px",
            background: C.brass,
          }}
        />
        <Display size={58} color={C.cream} style={tag}>
          You give the mandate.{" "}
          <span style={{ color: C.brass, fontStyle: "italic" }}>
            Regent executes.
          </span>
        </Display>
      </div>
    </Stage>
  );
};

/* ── Scene 4 — The mandate deed ───────────────────────────────── */
const Clause: React.FC<{
  n: string;
  label: string;
  value: string;
  delay: number;
}> = ({ n, label, value, delay }) => {
  const r = useRise(delay);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "26px 8px",
        borderBottom: `1px solid ${C.edge}`,
        ...r,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
        <Mono color={C.brass} size={26}>
          §{n}
        </Mono>
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 40,
            color: C.cream,
          }}
        >
          {label}
        </span>
      </div>
      <Mono color={C.brassBright} size={36}>
        {value}
      </Mono>
    </div>
  );
};

export const Scene4: React.FC<SceneProps> = (p) => {
  const head = useRise(6);
  const seal = useRise(76);
  return (
    <Stage {...p}>
      <div style={{ width: "100%", maxWidth: 980 }}>
        <Panel style={{ padding: "44px 52px", ...head }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <MicroLabel color={C.brass}>Mandate of Authority</MicroLabel>
            <Mono color={C.dim} size={20}>
              Base Sepolia · 84532
            </Mono>
          </div>
          <Clause n="1" label="Goal" value="Swap ETH → USDC" delay={22} />
          <Clause n="2" label="Budget ceiling" value="$500.00" delay={34} />
          <Clause n="3" label="Max slippage" value="1.0%" delay={46} />
          <Clause n="4" label="Expiry" value="24h" delay={58} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 28,
              ...seal,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: `radial-gradient(circle at 40% 35%, ${C.brassBright}, ${C.brass})`,
                boxShadow: "0 0 20px rgba(201,163,94,0.5)",
              }}
            />
            <Mono color={C.fog} size={26}>
              signed · 0xA1b2…9F3c · keys never leave your wallet
            </Mono>
          </div>
        </Panel>
      </div>
    </Stage>
  );
};

/* ── Scene 5 — Enforced three times ───────────────────────────── */
const LayerBar: React.FC<{
  n: string;
  label: string;
  note: string;
  delay: number;
}> = ({ n, label, note, delay }) => {
  const r = useRise(delay);
  return (
    <Panel
      style={{
        width: 880,
        padding: "24px 36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        ...r,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <Mono color={C.brass} size={30}>
          {n}
        </Mono>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 42, color: C.cream }}>
          {label}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <span style={{ fontSize: 24, color: C.fog }}>{note}</span>
        <span style={{ fontSize: 34, color: C.positive }}>✓</span>
      </div>
    </Panel>
  );
};

export const Scene5: React.FC<SceneProps> = (p) => {
  const frame = useCurrentFrame();
  const head = useRise(6);
  // breach attempt appears late and is reverted
  const breach = interpolate(frame, [p.durationInFrames - 150, p.durationInFrames - 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Stage {...p}>
      <div style={{ textAlign: "center" }}>
        <Display size={76} style={{ ...head, marginBottom: 40 }}>
          Enforced three times — independently.
        </Display>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
            alignItems: "center",
          }}
        >
          <LayerBar n="①" label="Interface" note="pre-flight check" delay={22} />
          <LayerBar n="②" label="Agent service" note="re-validates every decision" delay={36} />
          <LayerBar n="③" label="On-chain contract" note="recordExecution reverts" delay={50} />
        </div>
        <div
          style={{
            marginTop: 38,
            opacity: breach,
            display: "flex",
            justifyContent: "center",
            gap: 18,
            alignItems: "center",
          }}
        >
          <Mono color={C.fog} size={26}>
            attempt beyond mandate →
          </Mono>
          <span
            style={{
              fontFamily: "inherit",
              fontSize: 26,
              color: C.negative,
              border: `1px solid rgba(224,122,122,0.5)`,
              borderRadius: 8,
              padding: "6px 18px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Reverted
          </span>
        </div>
      </div>
    </Stage>
  );
};

/* ── Scene 6 — Scan, reason, execute ──────────────────────────── */
const RouteRow: React.FC<{
  venue: string;
  out: string;
  slip: string;
  best?: boolean;
  delay: number;
}> = ({ venue, out, slip, best, delay }) => {
  const r = useRise(delay);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 320px 200px 240px",
        alignItems: "center",
        padding: "20px 28px",
        borderRadius: 12,
        background: best ? C.brassFaint : "transparent",
        border: `1px solid ${best ? C.brass : C.edge}`,
        marginBottom: 12,
        ...r,
      }}
    >
      <span style={{ fontFamily: FONT_DISPLAY, fontSize: 38, color: C.cream }}>
        {venue}
      </span>
      <Mono size={30}>{out}</Mono>
      <Mono size={30} color={C.fog}>
        {slip}
      </Mono>
      <div style={{ textAlign: "right" }}>
        {best ? (
          <span
            style={{
              fontSize: 22,
              color: C.brass,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            ★ best · in mandate
          </span>
        ) : null}
      </div>
    </div>
  );
};

export const Scene6: React.FC<SceneProps> = (p) => {
  const frame = useCurrentFrame();
  const head = useRise(6);
  const exec = interpolate(frame, [p.durationInFrames - 220, p.durationInFrames - 190], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Stage {...p}>
      <div style={{ width: "100%", maxWidth: 1180 }}>
        <Display size={72} style={{ ...head, marginBottom: 28 }}>
          Scan. Reason. Execute.
        </Display>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px 200px 240px",
            padding: "0 28px 14px",
          }}
        >
          <MicroLabel>Venue</MicroLabel>
          <MicroLabel>Output USDC</MicroLabel>
          <MicroLabel>Slippage</MicroLabel>
          <span />
        </div>
        <RouteRow venue="Aerodrome" out="1,000.00" slip="0.42%" best delay={24} />
        <RouteRow venue="Uniswap v3" out="998.10" slip="0.61%" delay={36} />
        <RouteRow venue="SushiSwap" out="994.80" slip="0.94%" delay={48} />
        <RouteRow venue="BaseSwap" out="991.20" slip="1.18%" delay={60} />
        <div
          style={{
            marginTop: 30,
            opacity: exec,
            display: "flex",
            alignItems: "center",
            gap: 18,
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 34, color: C.positive }}>✓</span>
          <Mono color={C.positive} size={30}>
            Executed · 0x7f3c…a91 · via 1Shot relayer · gas abstracted
          </Mono>
        </div>
      </div>
    </Stage>
  );
};

/* ── Scene 7 — Refusal ────────────────────────────────────────── */
const BreachRow: React.FC<{
  venue: string;
  reason: string;
  delay: number;
}> = ({ venue, reason, delay }) => {
  const r = useRise(delay);
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: 820,
        padding: "18px 28px",
        borderRadius: 12,
        border: `1px solid rgba(224,122,122,0.3)`,
        marginBottom: 12,
        ...r,
      }}
    >
      <span style={{ fontFamily: FONT_DISPLAY, fontSize: 36, color: C.fog }}>
        {venue}
      </span>
      <Mono color={C.negative} size={26}>
        {reason}
      </Mono>
    </div>
  );
};

export const Scene7: React.FC<SceneProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = useRise(6);
  const stamp = spring({
    frame: frame - 46,
    fps,
    config: { damping: 12, mass: 0.8 },
    durationInFrames: 30,
  });
  return (
    <Stage {...p}>
      <div style={{ display: "flex", alignItems: "center", gap: 70 }}>
        <div>
          <Display size={64} style={{ ...head, marginBottom: 28 }}>
            And when nothing fits —
          </Display>
          <BreachRow venue="Best route" reason="slippage 2.3% > 1.0%" delay={22} />
          <BreachRow venue="Alt route" reason="cost $540 > $500 budget" delay={34} />
          <Mono color={C.fog} size={26} style={{ marginTop: 8 }}>
            No route within mandate. Reason logged.
          </Mono>
        </div>
        <div
          style={{
            transform: `rotate(-9deg) scale(${interpolate(stamp, [0, 1], [0.6, 1])})`,
            opacity: stamp,
            border: `4px solid ${C.negative}`,
            color: C.negative,
            borderRadius: 16,
            padding: "26px 44px",
            fontFamily: FONT_DISPLAY,
            fontSize: 92,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            boxShadow: "0 0 50px rgba(224,122,122,0.25)",
          }}
        >
          Refused
        </div>
      </div>
    </Stage>
  );
};

/* ── Scene 8 — CTA ────────────────────────────────────────────── */
const Chip: React.FC<{ label: string; delay: number }> = ({ label, delay }) => {
  const r = useRise(delay);
  return (
    <div
      style={{
        padding: "16px 28px",
        borderRadius: 999,
        border: `1px solid ${C.edgeStrong}`,
        background: C.surface,
        fontFamily: "inherit",
        fontSize: 26,
        color: C.cream,
        ...r,
      }}
    >
      {label}
    </div>
  );
};

export const Scene8: React.FC<SceneProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const word = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 28 });
  const tag = useRise(30);
  const micro = useRise(94);
  return (
    <Stage {...p}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 200,
            lineHeight: 1,
            color: C.brass,
            opacity: word,
            transform: `translateY(${interpolate(word, [0, 1], [40, 0])}px)`,
          }}
        >
          Regent
        </div>
        <Display size={52} style={{ ...tag, marginTop: 18 }}>
          You give the mandate.{" "}
          <span style={{ color: C.brass, fontStyle: "italic" }}>
            Regent executes.
          </span>
        </Display>
        <div
          style={{
            display: "flex",
            gap: 18,
            justifyContent: "center",
            marginTop: 56,
            flexWrap: "wrap",
            maxWidth: 1100,
          }}
        >
          <Chip label="MetaMask Smart Accounts" delay={40} />
          <Chip label="Venice AI" delay={52} />
          <Chip label="1Shot Relayer" delay={64} />
          <Chip label="Base Sepolia" delay={76} />
        </div>
        <MicroLabel style={{ marginTop: 44, ...micro }}>
          Bounded delegation · auditable · revocable
        </MicroLabel>
      </div>
    </Stage>
  );
};

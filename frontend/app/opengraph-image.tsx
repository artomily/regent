import { ImageResponse } from "next/og"

export const alt = "Regent — you give the mandate, Regent executes"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f0d0a",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 48,
            left: 48,
            right: 48,
            bottom: 48,
            border: "1px solid rgba(236,230,217,0.18)",
            borderRadius: 6,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 96,
            left: 88,
            fontSize: 13,
            letterSpacing: 3,
            color: "#7a7263",
            display: "flex",
          }}
        >
          MANDATE-BOUNDED AI AGENT
        </div>
        <div
          style={{
            position: "absolute",
            top: 96,
            right: 88,
            fontSize: 13,
            letterSpacing: 3,
            color: "#7a7263",
            display: "flex",
          }}
        >
          THE MANDATE IS LAW
        </div>
        <svg width="120" height="120" viewBox="0 0 140 140" style={{ marginBottom: 24 }}>
          <circle cx="70" cy="70" r="54" fill="none" stroke="#c9a35e" strokeWidth="1.5" />
          <rect
            x="52"
            y="52"
            width="36"
            height="36"
            fill="none"
            stroke="#c9a35e"
            strokeWidth="1.5"
            transform="rotate(45 70 70)"
          />
          <circle cx="70" cy="70" r="3" fill="#c9a35e" />
        </svg>
        <div style={{ fontSize: 116, color: "#c9a35e", display: "flex" }}>Regent</div>
        <div
          style={{
            fontSize: 20,
            letterSpacing: 3,
            color: "#a89e8a",
            marginTop: 16,
            display: "flex",
          }}
        >
          YOU GIVE THE MANDATE. REGENT EXECUTES.
        </div>
        <div
          style={{
            fontSize: 14,
            letterSpacing: 2,
            color: "#7a7263",
            marginTop: 48,
            display: "flex",
          }}
        >
          BASE SEPOLIA · VENICE AI · 1SHOT RELAYER · METAMASK SMART ACCOUNTS
        </div>
      </div>
    ),
    { ...size }
  )
}

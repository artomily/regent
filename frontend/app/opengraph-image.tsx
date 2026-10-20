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
          background: "#F5F4EE",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            right: 40,
            bottom: 40,
            border: "1px solid #DCDBD3",
            borderRadius: 16,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 70,
            left: 70,
            fontSize: 13,
            letterSpacing: 3,
            color: "#8A8A85",
            display: "flex",
            fontWeight: 600,
          }}
        >
          (01) MANDATE-BOUNDED AGENT
        </div>
        <div
          style={{
            position: "absolute",
            top: 70,
            right: 70,
            fontSize: 13,
            letterSpacing: 3,
            color: "#8A8A85",
            display: "flex",
            fontWeight: 600,
          }}
        >
          THE MANDATE IS LAW ©2026
        </div>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#E3E82A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            fontWeight: 700,
            color: "#111110",
            marginBottom: 20,
          }}
        >
          R
        </div>
        <div
          style={{
            fontSize: 104,
            fontWeight: 300,
            letterSpacing: -4,
            color: "#111110",
            display: "flex",
          }}
        >
          REGENT®
        </div>
        <div
          style={{
            fontSize: 22,
            letterSpacing: 2,
            color: "#8A8A85",
            marginTop: 16,
            display: "flex",
            fontWeight: 400,
          }}
        >
          YOU GIVE THE MANDATE. REGENT EXECUTES.
        </div>
        <div
          style={{
            fontSize: 13,
            letterSpacing: 2,
            color: "#111110",
            marginTop: 48,
            display: "flex",
            padding: "8px 24px",
            borderRadius: 9999,
            background: "#EDECE5",
            border: "1px solid #DCDBD3",
            fontWeight: 500,
          }}
        >
          BASE SEPOLIA · VENICE AI · 1SHOT RELAYER · METAMASK SMART ACCOUNTS
        </div>
      </div>
    ),
    { ...size }
  )
}

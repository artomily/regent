import type { Metadata } from "next"
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
})

const siteUrl = "https://regentai.vercel.app"
const title = "Regent — You give the mandate. Regent executes."
const description =
  "An AI agent that acts on your behalf inside hard, signed boundaries — budget, slippage, expiry. Built on MetaMask Smart Accounts, Venice AI, and the 1Shot relayer on Base."

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  icons: {
    icon: "/regent-logo.png",
    apple: "/regent-logo.png",
  },
  keywords: [
    "AI agent",
    "DeFi",
    "mandate",
    "MetaMask Smart Accounts",
    "Venice AI",
    "1Shot relayer",
    "Base Sepolia",
    "non-custodial",
  ],
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "Regent",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col font-sans">{children}</body>
    </html>
  )
}

import { renderToString } from "react-dom/server"
import { describe, expect, test } from "vitest"
import type { ActivityEvent, Mandate } from "@/lib/types"
import { DashboardHeader } from "./dashboard-header"
import { DashboardRail } from "./dashboard-rail"
import { DashboardTabs } from "./dashboard-tabs"
import { MetricCards } from "./metric-cards"
import { RightTiles } from "./right-tiles"
import { StatisticsPanel } from "./statistics-panel"
import { WalletAvatar } from "./wallet-avatar"

describe("Dashboard Components (Modeled on SaaS Reference)", () => {
  test("WalletAvatar generates deterministic identicon without raw hex", () => {
    const html = renderToString(<WalletAvatar address="0x1234567890abcdef1234567890abcdef12345678" />)
    expect(html).toContain("12")
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/)
  })

  test("DashboardRail renders Regent brand mark, navigation tabs, and wallet avatar", () => {
    const html = renderToString(
      <DashboardRail
        activeTab="overview"
        onSelectTab={() => {}}
        walletAddress="0x1234567890abcdef1234567890abcdef12345678"
      />,
    )
    expect(html).toContain("Regent Home")
    expect(html).toContain("Overview")
    expect(html).toContain("Mandates")
    expect(html).toContain("Activity")
    expect(html).toContain("Routes")
    expect(html).toContain("Agent")
  })

  test("DashboardHeader renders editorial headline with inline pills and create CTA", () => {
    const html = renderToString(<DashboardHeader />)
    expect(html).toContain("Managing")
    expect(html).toContain("your mandates")
    expect(html).toContain("and")
    expect(html).toContain("your agent")
    expect(html).toContain("Create a new mandate")
  })

  test("DashboardTabs renders pill buttons with active indicator", () => {
    const html = renderToString(
      <DashboardTabs
        activeTab="overview"
        onSelectTab={() => {}}
        mandatesCount={2}
        activityCount={5}
      />,
    )
    expect(html).toContain("Overview")
    expect(html).toContain("Mandates")
    expect(html).toContain("Activity")
    expect(html).toContain("Routes")
    expect(html).toContain("Agent")
  })

  test("MetricCards renders real metrics without fake limits or false claims", () => {
    const html = renderToString(
      <MetricCards
        activeMandate={null}
        mandates={[]}
        decision={null}
        executionResult={null}
        isAgentRunning={false}
      />,
    )
    expect(html).toContain("Budget spent")
    expect(html).toContain("Executions")
    expect(html).toContain("Venice decides the next route")
    expect(html).toContain("Run agent")
    // Should NOT contain false claims or invented limits
    expect(html).not.toContain("Zero-knowledge")
    expect(html).not.toContain("/ 5 total")
    expect(html).not.toContain("/ 500 USDC")
  })

  test("StatisticsPanel: empty data renders no filled bars and shows empty state message", () => {
    const html = renderToString(<StatisticsPanel activityLog={[]} mandates={[]} />)
    expect(html).toContain("Statistics")
    expect(html).toContain("Budget spent (USDC)")
    expect(html).toContain("Executions")
    // Empty state message and link that opens the create-mandate dialog
    expect(html).toContain("No executions yet - authorize a mandate and run the agent")
    expect(html).toContain('href="/dashboard?new=1"')
    // No filled bar capsules (no overflow-hidden bg-ink bars)
    expect(html).not.toContain("overflow-hidden bg-ink")
    // Only dashed empty capsules
    expect(html).toContain("border-dashed")
  })

  test("StatisticsPanel: given 2 executions on one day, the bar's spent value equals their sum", () => {
    const now = Date.now()
    const activityLog: ActivityEvent[] = [
      {
        id: "e1",
        mandateId: "m1",
        step: "confirming_transaction",
        message: "Confirmed. Spent 18.25 USDC, received 0.005 ETH.",
        timestamp: now,
        metadata: { spentAmount: 18.25 },
      },
      {
        id: "e2",
        mandateId: "m1",
        step: "confirming_transaction",
        message: "Confirmed. Spent 31.75 USDC, received 0.009 ETH.",
        timestamp: now,
        metadata: { spentAmount: 31.75 },
      },
    ]

    const html = renderToString(<StatisticsPanel activityLog={activityLog} mandates={[]} />)
    // 18.25 + 31.75 = 50.00 USDC
    expect(html).toContain("50.00 USDC")
    expect(html).toContain("2 execs")
    // Has filled bar for the execution day
    expect(html).toContain("overflow-hidden bg-ink")
  })

  test("StatisticsPanel: given 2 mandates with spent amounts on one day, spent equals their sum", () => {
    const now = Date.now()
    const mandates: Mandate[] = [
      {
        id: "m1",
        goal: "Acquire ETH",
        budget: 100,
        maxSlippage: 1,
        targetAsset: "ETH",
        sourceAsset: "USDC",
        expiry: new Date(now + 3600000).toISOString(),
        status: "completed",
        createdAt: now,
        spent: 42.5,
      },
      {
        id: "m2",
        goal: "Acquire WETH",
        budget: 100,
        maxSlippage: 1,
        targetAsset: "WETH",
        sourceAsset: "USDC",
        expiry: new Date(now + 3600000).toISOString(),
        status: "completed",
        createdAt: now,
        spent: 17.5,
      },
    ]

    const html = renderToString(<StatisticsPanel activityLog={[]} mandates={mandates} />)
    // 42.5 + 17.5 = 60.00 USDC
    expect(html).toContain("60.00 USDC")
  })

  test("RightTiles renders real agent mode without false Zero-Knowledge claims", () => {
    const html = renderToString(
      <RightTiles
        walletAddress="0x1234567890abcdef1234567890abcdef12345678"
        activeMandate={null}
        agentHealth={{
          ok: true,
          mode: {
            intelligence: "venice",
            execution: "relayer",
          },
        }}
      />,
    )
    expect(html).toContain("Smart Account")
    expect(html).toContain("Delegation")
    expect(html).toContain("Venice AI status")
    expect(html).toContain("venice")
    expect(html).toContain("Private inference via Venice AI")
    expect(html).not.toContain("Zero-Knowledge")
  })
})

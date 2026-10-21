import { renderToString } from "react-dom/server"
import { describe, expect, test } from "vitest"
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

  test("MetricCards renders segmented capsule progress and promo card", () => {
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
    expect(html).toContain("progressbar")
  })

  test("StatisticsPanel renders capsule bar chart, legend, and period selector", () => {
    const html = renderToString(<StatisticsPanel activityLog={[]} mandates={[]} />)
    expect(html).toContain("Statistics")
    expect(html).toContain("Budget spent")
    expect(html).toContain("Output volume")
    expect(html).toContain("Last 7 days")
  })

  test("RightTiles renders smart account, delegation, and contract info", () => {
    const html = renderToString(
      <RightTiles
        walletAddress="0x1234567890abcdef1234567890abcdef12345678"
        activeMandate={null}
        agentHealth={null}
      />,
    )
    expect(html).toContain("Smart Account")
    expect(html).toContain("Delegation")
    expect(html).toContain("Venice AI status")
    expect(html).toContain("RegentMandate")
    expect(html).toContain("Docs &amp; Legal")
  })
})

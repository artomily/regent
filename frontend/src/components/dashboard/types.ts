import type { Hex } from "viem"

export type DashboardTab = "overview" | "mandates" | "activity" | "routes" | "agent"

export interface DashboardNavProps {
  activeTab: DashboardTab
  onSelectTab: (tab: DashboardTab) => void
  walletAddress?: Hex | null
  onOpenSettings?: () => void
}

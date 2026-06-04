import type React from "react"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface KpiTile {
  label: string
  value: string
  hint?: string
}

export interface PortalDashboardProps {
  title: string
  description: string
  /** Governance tier badge, e.g. "District" or "State". */
  tierLabel?: string
  kpis: KpiTile[]
  /** Starter module entries surfaced for this portal. */
  modules: string[]
  children?: React.ReactNode
}

// Presentational starter dashboard shared by the stakeholder portals. Server-safe
// (no client hooks). KPI values are illustrative placeholders until each portal's
// modules are wired to live data via the integration adapters.
export function PortalDashboard({ title, description, tierLabel, kpis, modules, children }: PortalDashboardProps) {
  return (
    <Shell>
      <PageHeader>
        <div className="flex items-center gap-3">
          <PageHeaderHeading>{title}</PageHeaderHeading>
          {tierLabel ? <Badge variant="secondary">{tierLabel}</Badge> : null}
        </div>
        <PageHeaderDescription>{description}</PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              {kpi.hint ? <p className="text-xs text-muted-foreground mt-1">{kpi.hint}</p> : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => (
              <li key={m} className="rounded-md border bg-card px-3 py-2 text-sm">
                {m}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {children}
    </Shell>
  )
}

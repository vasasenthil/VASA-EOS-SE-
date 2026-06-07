import type React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface KpiTile {
  label: string
  value: string
  hint?: string
}

/** A portal module entry — either a plain label or a clickable link to a real route. */
export type ModuleEntry = string | { label: string; href: string }

export interface PortalDashboardProps {
  title: string
  description: string
  /** Governance tier badge, e.g. "District" or "State". */
  tierLabel?: string
  kpis: KpiTile[]
  /** Module entries surfaced for this portal (label, or {label, href} to navigate). */
  modules: ModuleEntry[]
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
            {modules.map((m) => {
              const label = typeof m === "string" ? m : m.label
              const href = typeof m === "string" ? null : m.href
              if (href) {
                return (
                  <li key={label}>
                    <Link
                      href={href}
                      className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <span>{label}</span>
                      <ArrowRight className="h-4 w-4 opacity-50" aria-hidden />
                    </Link>
                  </li>
                )
              }
              return (
                <li key={label} className="rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground">
                  {label}
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      {children}
    </Shell>
  )
}

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

export interface DashboardSignal {
  label: string
  value: string
  tone?: "good" | "watch" | "risk" | "neutral"
}

export interface PortalDashboardProps {
  title: string
  description: string
  /** Governance tier badge, e.g. "District" or "State". */
  tierLabel?: string
  kpis: KpiTile[]
  /** Module entries surfaced for this portal (label, or {label, href} to navigate). */
  modules: ModuleEntry[]
  /** Live operational signals derived by the page-level data adapter. */
  signals?: DashboardSignal[]
  /** Names the runtime datasets/stores that fed the page. */
  sourceSummary?: string
  children?: React.ReactNode
}

const SIGNAL_TONE: Record<NonNullable<DashboardSignal["tone"]>, string> = {
  good: "border-green-200 bg-green-50 text-green-800",
  watch: "border-amber-200 bg-amber-50 text-amber-800",
  risk: "border-red-200 bg-red-50 text-red-800",
  neutral: "border-slate-200 bg-slate-50 text-slate-800",
}

// Shared stakeholder portal shell. Server-safe (no client hooks). KPI values and
// operational signals are supplied by page-level live-data adapters.
export function PortalDashboard({ title, description, tierLabel, kpis, modules, signals = [], sourceSummary, children }: PortalDashboardProps) {
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

      {sourceSummary ? (
        <Card className="mb-6 border-blue-100 bg-blue-50/60">
          <CardContent className="pt-4 text-sm text-blue-900">
            <span className="font-medium">Live data binding:</span> {sourceSummary}
          </CardContent>
        </Card>
      ) : null}

      {signals.length ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Live Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {signals.map((signal) => (
                <div key={`${signal.label}-${signal.value}`} className={`rounded-md border px-3 py-2 text-sm ${SIGNAL_TONE[signal.tone ?? "neutral"]}`}>
                  <div className="text-xs font-medium opacity-80">{signal.label}</div>
                  <div className="font-semibold">{signal.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

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

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Radio, AlertTriangle, Activity } from "lucide-react"
import { listReadingsAction } from "./actions"
import { TelemetryFilters } from "./components/telemetry-filters"
import { IngestPanel } from "./components/ingest-panel"
import { alerts as computeAlerts, type Severity } from "@/lib/iot"
import { listReadings } from "@/lib/iot/store"
import { safeDate } from "@/lib/format-date"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const SEV_STYLE: Record<Severity, string> = {
  Normal: "bg-green-100 text-green-700",
  Warning: "bg-amber-100 text-amber-700",
  Critical: "bg-red-100 text-red-700",
}

interface SP { q?: string; category?: string; severity?: string; page?: string }

export default async function TelemetryPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listReadingsAction({ query: sp.q, category: sp.category, severity: sp.severity, page })
  const liveAlerts = computeAlerts(await listReadings()).slice(0, 5)
  const demo = !isSupabaseAdminConfigured()
  const s = result.summary

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>IoT Telemetry Mesh</PageHeaderHeading>
        <PageHeaderDescription>School environment, nutrition, infrastructure and biometric-attendance device readings, ingested and classified against safe-operating bounds. A breach — a hot classroom, a spoiling mid-day-meal store, an empty water tank, a power dip — alerts the moment it lands, not at the next inspection. Every ingest is audit-anchored.</PageHeaderDescription>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing representative <strong>demo telemetry</strong> — no database is configured. Provision Supabase and seed to manage live device data.
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {([
          { label: "Readings", value: s.total, color: "text-foreground", Icon: Activity },
          { label: "Devices", value: s.devices, color: "text-foreground", Icon: Radio },
          { label: "Normal", value: s.normal, color: "text-green-700", Icon: Activity },
          { label: "Warning", value: s.warning, color: s.warning > 0 ? "text-amber-700" : "text-muted-foreground", Icon: AlertTriangle },
          { label: "Critical", value: s.critical, color: s.critical > 0 ? "text-red-700" : "text-muted-foreground", Icon: AlertTriangle },
        ] as const).map(({ label, value, color, Icon }) => (
          <Card key={label}><CardContent className="p-4"><p className="flex items-center gap-1 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</p><p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      {liveAlerts.length > 0 ? (
        <Card className="mb-6 border-red-200">
          <CardContent className="p-4">
            <p className="mb-2 flex items-center gap-1 text-sm font-semibold text-red-700"><AlertTriangle className="h-4 w-4" />Active alerts ({liveAlerts.length})</p>
            <ul className="space-y-1 text-sm">
              {liveAlerts.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-2">
                  <Badge className={`${SEV_STYLE[a.severity]} border-0`}>{a.severity}</Badge>
                  <span className="font-medium">{a.metricLabel}</span>
                  <span className="text-muted-foreground">{a.value}{a.unit} · {a.deviceLabel} ({a.deviceId})</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="mb-6"><IngestPanel /></div>

      <TelemetryFilters />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Captured</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Reading</TableHead>
                <TableHead>Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.readings.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground"><Radio className="mx-auto mb-2 h-8 w-8" />No readings. Adjust filters, ingest one, or seed demo telemetry.</TableCell></TableRow>
              ) : (
                result.readings.map((r) => (
                  <TableRow key={r.id} className={r.severity === "Critical" ? "bg-red-50/40" : r.severity === "Warning" ? "bg-amber-50/30" : undefined}>
                    <TableCell className="whitespace-nowrap text-xs">{safeDate(r.capturedAt, "dd MMM HH:mm")}</TableCell>
                    <TableCell className="font-medium">{r.deviceLabel}<div className="text-xs text-muted-foreground">{r.deviceId}</div></TableCell>
                    <TableCell>{r.category}</TableCell>
                    <TableCell>{r.metricLabel}</TableCell>
                    <TableCell className="text-right whitespace-nowrap font-medium">{r.value}{r.unit}</TableCell>
                    <TableCell><Badge className={`${SEV_STYLE[r.severity]} border-0`}>{r.severity}</Badge></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="mt-4 text-sm text-muted-foreground">Showing {result.readings.length} of {result.total} reading{result.total === 1 ? "" : "s"} · page {result.page} of {result.totalPages}.</p>
    </Shell>
  )
}

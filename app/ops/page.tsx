import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { envReport } from "@/lib/env"
import { dbReady } from "@/lib/persistence"
import { buildReadiness, APP_VERSION } from "@/lib/readiness"
import { integrationStatuses, integrationSummary } from "@/lib/integrations/status"
import { integrations } from "@/lib/integrations"
import { getCounters } from "@/lib/metrics"

export const dynamic = "force-dynamic"

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  ready: "default",
  degraded: "secondary",
  unavailable: "destructive",
}

export default async function OpsPage() {
  const env = envReport()
  const readiness = buildReadiness({
    dbReady: dbReady(),
    envOk: env.ok,
    mode: env.mode,
    missingRequired: env.missingRequired,
    version: APP_VERSION,
    uptimeSec: process.uptime(),
  })
  const ports = integrationStatuses()
  const integ = integrationSummary(ports)
  const counters = [...getCounters()].sort((a, b) => b.value - a.value)
  const totalEvents = counters.reduce((s, c) => s + c.value, 0)
  // Live consumer of the EMIS port: pull the demo school's master-data snapshot.
  const emis = await integrations.emis.getSchoolData("33010100101")

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Operations &amp; System Health</PageHeaderHeading>
        <PageHeaderDescription>
          Live operability view — readiness, configuration, integration posture and in-process metrics. Machine
          endpoints: <code>/api/ready</code>, <code>/api/live</code>, <code>/api/health</code>, <code>/api/metrics</code>.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Readiness</CardTitle></CardHeader>
          <CardContent>
            <Badge variant={STATUS_VARIANT[readiness.status]}>{readiness.status}</Badge>
            <p className="mt-1 text-xs text-muted-foreground">{readiness.durablePersistence ? "durable DB" : "in-memory"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Mode</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold capitalize">{readiness.mode}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Version / uptime</CardTitle></CardHeader>
          <CardContent><div className="text-lg font-bold">{readiness.version}</div><p className="text-xs text-muted-foreground">{readiness.uptimeSec}s</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Integrations live</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{integ.live}<span className="text-base text-muted-foreground"> / {integ.total}</span></div><p className="text-xs text-muted-foreground">{integ.liveReady} live-ready</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
          <CardContent>
            {env.missingRequired.length > 0 ? (
              <p className="mb-3 text-sm text-destructive">Missing required: {env.missingRequired.join(", ")}</p>
            ) : null}
            <ul className="space-y-1.5 text-sm">
              {env.vars.map((v) => (
                <li key={v.name} className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs">{v.name}{v.required ? "" : " (optional)"}</span>
                  <Badge variant={v.present ? "default" : v.required ? "destructive" : "secondary"}>{v.present ? "set" : "unset"}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Metrics — audited events ({totalEvents})</CardTitle></CardHeader>
          <CardContent>
            {counters.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events recorded yet this instance. Exercise a module, then refresh.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Action</TableHead><TableHead className="text-right">Count</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {counters.slice(0, 20).map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{c.labels.action ?? c.name}</TableCell>
                      <TableCell className="text-right">{c.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            EMIS master-data (school 33010100101){" "}
            <Badge variant={emis.mode === "live" ? "default" : "secondary"}>{emis.mode}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emis.ok && emis.data ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div><div className="text-2xl font-bold">{emis.data.students}</div><div className="text-xs text-muted-foreground">Students</div></div>
              <div><div className="text-2xl font-bold">{emis.data.teachers}</div><div className="text-xs text-muted-foreground">Teachers</div></div>
              <div><div className="text-2xl font-bold">{emis.data.classrooms}</div><div className="text-xs text-muted-foreground">Classrooms</div></div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">EMIS unavailable: {emis.error ?? "no data"}</p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle>Integration posture</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Integration</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Live-ready</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ports.map((p) => (
                <TableRow key={p.key}>
                  <TableCell className="font-medium">{p.label}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.port}</TableCell>
                  <TableCell><Badge variant={p.mode === "live" ? "default" : "secondary"}>{p.mode}</Badge></TableCell>
                  <TableCell>{p.liveReady ? <Badge variant="default">yes</Badge> : <Badge variant="outline">needs config</Badge>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

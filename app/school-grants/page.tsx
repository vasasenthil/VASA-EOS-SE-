import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getGrantDashboard, backboneConnected } from "./actions"
import { AllocateGrantForm, GrantActions } from "./school-grants-client"

export const dynamic = "force-dynamic"

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function SchoolGrantsPage() {
  const connected = await backboneConnected()
  const d = await getGrantDashboard()
  const low = d?.low_utilisation ?? []
  const org = low[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Grant Utilisation</PageHeaderHeading>
        <PageHeaderDescription>
          Allocate school grants (composite · library · sports · maintenance) and book expenditure against them on
          the durable backbone. The cardinal invariant is <strong>no over-spend</strong> — cumulative expenditure
          can never exceed the allocation, enforced server-side. Money is in paise. Lifecycle: allocate → spend →
          close. Every button performs a real, persisted, audited operation.
        </PageHeaderDescription>
      </PageHeader>

      {!d ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Backbone not connected</AlertTitle>
          <AlertDescription>
            This module drives the durable Go backbone (platformd + PostgreSQL). Run the full stack and set{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">PLATFORM_URL</code> (e.g.{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">deploy/pilot/run-local.sh</code>), then every
            Allocate / Book / Close button performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {!connected && <DemoDataNote />}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Grants" value={d.grants} />
            <Stat label="Allocated" value={rupees(d.allocated_paise)} />
            <Stat label="Spent" value={rupees(d.spent_paise)} />
            <Stat label="Balance" value={rupees(d.balance_paise)} />
            <Stat label="Utilisation %" value={d.utilisation_pct.toFixed(0)} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">paise · durable · audited</p>
            </div>
          </section>

          {Object.keys(d.by_head_allocated).length > 0 && (
            <section className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Allocated by head:</span>
              {Object.entries(d.by_head_allocated).map(([h, p]) => (
                <Badge key={h} variant="outline" className="capitalize">{h} {rupees(p)}</Badge>
              ))}
            </section>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Low-utilisation grants ({"<"}50%)</CardTitle>
              <CardDescription>
                {low.length} grant(s) under-spent — book genuine expenditure or close. Cumulative spend can never
                exceed the allocation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {low.length === 0 ? (
                <p className="text-sm text-muted-foreground">No under-utilised grants.</p>
              ) : (
                <ul className="divide-y">
                  {low.map((g) => {
                    const pct = g.allocated_paise > 0 ? Math.round((g.spent_paise / g.allocated_paise) * 100) : 0
                    return (
                      <li key={g.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium capitalize">{g.head} · {g.org_unit}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {g.id} · {rupees(g.spent_paise)} of {rupees(g.allocated_paise)} ({pct}%) · bal {rupees(g.allocated_paise - g.spent_paise)}
                          </p>
                        </div>
                        <GrantActions id={g.id} status={g.status} />
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Allocate a grant</CardTitle>
              <CardDescription>Records a new grant allocation (status open) for the school.</CardDescription>
            </CardHeader>
            <CardContent>
              <AllocateGrantForm org={org} />
            </CardContent>
          </Card>
        </div>
      )}
    </Shell>
  )
}

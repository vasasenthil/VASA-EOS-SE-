import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { getTransportDashboard, getRoster, backboneConnected } from "./actions"
import { AllotForm, WithdrawButton, RegisterRouteForm } from "./school-transport-client"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function SchoolTransportPage() {
  const connected = await backboneConnected()
  const d = await getTransportDashboard()
  const routes = d?.routes_rollup ?? []
  const rosters = await Promise.all(routes.map((r) => getRoster(r.route_id)))

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Transport (route safety)</PageHeaderHeading>
        <PageHeaderDescription>
          Register bus routes and seat students against the durable backbone. Two hard safety invariants are
          enforced server-side: a route can never exceed its seating capacity, and no child may be allotted to an
          unserviceable vehicle (lapsed fitness certificate or driver licence). Every button performs a real,
          persisted, audited operation.
        </PageHeaderDescription>
      </PageHeader>

      {!connected || !d ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Backbone not connected</AlertTitle>
          <AlertDescription>
            This module drives the durable Go backbone (platformd + PostgreSQL). Run the full stack and set{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">PLATFORM_URL</code> (e.g.{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">deploy/pilot/run-local.sh</code>), then every
            Allot / Withdraw / Register button performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Routes" value={d.routes} />
            <Stat label="Capacity" value={d.total_capacity} />
            <Stat label="Seated" value={d.total_seated} />
            <Stat label="Utilisation" value={`${d.utilisation_pct.toFixed(1)}%`} />
            <Stat label="Unserviceable" value={(d.unserviceable_routes ?? []).length} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">durable · audited</p>
            </div>
          </section>

          <section className="space-y-3">
            {routes.map((r, i) => {
              const seats = rosters[i].filter((a) => a.status === "allotted")
              return (
                <Card key={r.route_id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between gap-2 text-base">
                      <span>{r.name || r.route_id}</span>
                      <span className="flex items-center gap-2 text-sm font-normal">
                        <Badge variant={r.seated >= r.capacity ? "destructive" : "default"}>{r.seated}/{r.capacity} seats</Badge>
                        {r.serviceable ? <Badge variant="default">serviceable</Badge> : <Badge variant="destructive">UNSERVICEABLE</Badge>}
                      </span>
                    </CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {r.route_id} · {r.vehicle_no}
                      {!r.serviceable && r.safety_reason && <span className="ml-1 font-medium text-destructive">— {r.safety_reason}</span>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {seats.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No students seated.</p>
                    ) : (
                      <ul className="divide-y">
                        {seats.map((a) => (
                          <li key={a.id} className="flex items-center justify-between gap-2 py-2">
                            <span className="text-sm">{a.student_id} · {a.stop}</span>
                            <WithdrawButton allotmentId={a.id} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Allot a seat</CardTitle>
                <CardDescription>Seats a student — the backbone refuses a full or unserviceable route.</CardDescription>
              </CardHeader>
              <CardContent>
                <AllotForm routes={routes.map((r) => ({ id: r.route_id, label: `${r.name || r.route_id} (${r.seated}/${r.capacity}${r.serviceable ? "" : " · unserviceable"})` }))} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Register a route</CardTitle>
                <CardDescription>Vehicle + driver with statutory validity dates.</CardDescription>
              </CardHeader>
              <CardContent>
                <RegisterRouteForm />
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getHostelDashboard, getHostels, backboneConnected } from "./actions"
import { RegisterHostelForm, AllotBedForm, VacateBedForm, CloseHostelForm } from "./hostel-client"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function HostelOccupancyPage() {
  const connected = await backboneConnected()
  const d = await getHostelDashboard()
  const hostels = await getHostels()
  const org = hostels[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Hostel Allocation &amp; Occupancy</PageHeaderHeading>
        <PageHeaderDescription>
          Residential welfare hostels (SC/ST/BC/tribal). The durable backbone enforces two hard rules: a
          hostel&rsquo;s occupancy can <strong>never exceed its capacity</strong> (no over-allocation), and a student
          can hold <strong>only one active bed statewide</strong> (a second placement is rejected). Every button
          performs a real, persisted, audited operation.
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
            control performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {!connected && <DemoDataNote />}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Hostels" value={d.hostels} />
            <Stat label="Capacity" value={d.capacity} />
            <Stat label="Occupied" value={d.occupied} />
            <Stat label="Occupancy %" value={d.occupancy_pct.toFixed(0)} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">capacity-gated · one-bed-per-student · durable</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Hostels</CardTitle>
              <CardDescription>{hostels.length} hostel(s) in scope. The badge flags ≥90% occupied.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {hostels.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hostels recorded.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-1 pr-3 font-medium">Id</th>
                      <th className="py-1 pr-3 font-medium">Name</th>
                      <th className="py-1 pr-3 font-medium">Type</th>
                      <th className="py-1 pr-3 font-medium">Occupancy</th>
                      <th className="py-1 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hostels.sort((a, b) => a.id.localeCompare(b.id)).map((h) => {
                      const occ = h.residents?.length ?? 0
                      const pct = h.capacity > 0 ? (occ / h.capacity) * 100 : 0
                      return (
                        <tr key={h.id} className="border-t">
                          <td className="py-1 pr-3 font-mono whitespace-nowrap">{h.id}</td>
                          <td className="py-1 pr-3">{h.name}</td>
                          <td className="py-1 pr-3">{h.type}</td>
                          <td className="py-1 pr-3 tabular-nums">
                            {occ}/{h.capacity}{" "}
                            <Badge variant={pct >= 90 ? "destructive" : "secondary"}>{pct.toFixed(0)}%</Badge>
                          </td>
                          <td className="py-1">
                            <Badge variant={h.status === "open" ? "default" : "secondary"}>{h.status}</Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Register a hostel</CardTitle>
                <CardDescription>Open a new residential hostel with a sanctioned capacity.</CardDescription>
              </CardHeader>
              <CardContent>
                <RegisterHostelForm org={org} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Allot / vacate / close</CardTitle>
                <CardDescription>Allot is blocked when a hostel is full or the student already holds a bed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <AllotBedForm />
                <div className="border-t pt-4">
                  <VacateBedForm />
                </div>
                <div className="border-t pt-4">
                  <CloseHostelForm />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

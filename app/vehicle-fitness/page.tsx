import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getVehicleFitnessDashboard, getVehicles, backboneConnected } from "./actions"
import { RegisterVehicleForm, RecordDocForm, ClearVehicleForm } from "./vehicle-client"

export const dynamic = "force-dynamic"

const REQUIRED = ["fitness", "insurance", "permit", "puc", "driver_licence"]

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function VehicleFitnessPage() {
  const connected = await backboneConnected()
  const d = await getVehicleFitnessDashboard()
  const vehicles = await getVehicles()
  const org = vehicles[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Vehicle Fitness &amp; Transport Safety</PageHeaderHeading>
        <PageHeaderDescription>
          Every school vehicle&rsquo;s statutory documents — fitness certificate, insurance, permit, PUC and driver
          licence. The backbone enforces two hard rules: a vehicle can be{" "}
          <strong>cleared for service only when every required document is valid</strong>, and lapsing a required
          document on a cleared vehicle <strong>auto-grounds it</strong> — no bus runs on an expired paper. Every
          button performs a real, persisted, audited operation.
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
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Stat label="Vehicles" value={d.vehicles} />
            <Stat label="Cleared for service" value={d.cleared} />
            <Stat label="Grounded" value={d.grounded} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">clearance-gated · auto-ground · durable</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Vehicles</CardTitle>
              <CardDescription>{vehicles.length} vehicle(s) in scope. ✓ = valid document; ✕ = lapsed/missing.</CardDescription>
            </CardHeader>
            <CardContent>
              {vehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No vehicles.</p>
              ) : (
                <div className="space-y-3">
                  {vehicles.sort((a, b) => a.id.localeCompare(b.id)).map((v) => {
                    const byKind = new Map((v.documents ?? []).map((doc) => [doc.kind, doc.valid]))
                    return (
                      <div key={v.id} className="rounded-lg border p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs">{v.id}</span>
                          <span className="text-sm font-medium">{v.reg_no}</span>
                          <Badge variant={v.status === "cleared" ? "default" : "destructive"}>{v.status}</Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {REQUIRED.map((kind) => {
                            const valid = byKind.get(kind) === true
                            return (
                              <span key={kind} className={`inline-flex items-center gap-1 rounded border px-2 py-1 ${!valid ? "border-destructive text-destructive" : ""}`}>
                                {valid ? "✓" : "✕"} {kind.replace(/_/g, " ")}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Register · record documents</CardTitle>
                <CardDescription>Register a vehicle, then record (or lapse) each statutory document.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <RegisterVehicleForm org={org} />
                <div className="border-t pt-4">
                  <RecordDocForm />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Clear for service</CardTitle>
                <CardDescription>Clearance is blocked while any of the five required documents is invalid.</CardDescription>
              </CardHeader>
              <CardContent>
                <ClearVehicleForm />
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

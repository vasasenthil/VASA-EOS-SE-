import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getCifmDashboard, getFacilities, backboneConnected } from "./actions"
import {
  RegisterFacilityForm,
  RaiseWorkOrderForm,
  CompleteWorkOrderForm,
  SetOperationalForm,
  CloseFacilityForm,
} from "./cifm-client"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

const STATUS_VARIANT: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
  operational: "default",
  under_maintenance: "destructive",
  closed: "secondary",
}

export default async function CampusFacilitiesPage() {
  const connected = await backboneConnected()
  const d = await getCifmDashboard()
  const facilities = await getFacilities()
  const org = facilities[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Campus Infrastructure &amp; Facilities Management (CIFM)</PageHeaderHeading>
        <PageHeaderDescription>
          The facilities-operations plane: every campus facility (building / lab / toilet / water / electrical /
          ground) with its condition, AMC and a work-order lifecycle. The backbone enforces a hard{" "}
          <strong>safety gate</strong>: a facility <strong>cannot return to operational while an open critical work
          order remains</strong>, and raising a critical work order <strong>auto-flips it to under-maintenance</strong>.
          Every button performs a real, persisted, audited operation.
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
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Facilities" value={d.facilities} />
            <Stat label="Under maintenance" value={d.under_maintenance} />
            <Stat label="Open work orders" value={d.open_work_orders} />
            <Stat label="Critical open" value={d.critical_open} />
            <div className="rounded-lg border p-4 sm:col-span-2">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">safety-gated · work-order lifecycle · durable</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Facilities</CardTitle>
              <CardDescription>{facilities.length} facility(ies) in scope.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {facilities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No facilities recorded.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-1 pr-3 font-medium">Id</th>
                      <th className="py-1 pr-3 font-medium">Name</th>
                      <th className="py-1 pr-3 font-medium">Category</th>
                      <th className="py-1 pr-3 font-medium">Condition</th>
                      <th className="py-1 pr-3 font-medium">Open WOs</th>
                      <th className="py-1 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facilities.sort((a, b) => a.id.localeCompare(b.id)).map((f) => {
                      const open = (f.work_orders ?? []).filter((w) => w.status !== "done")
                      const crit = open.some((w) => w.priority === "critical")
                      return (
                        <tr key={f.id} className="border-t">
                          <td className="py-1 pr-3 font-mono whitespace-nowrap">{f.id}</td>
                          <td className="py-1 pr-3">{f.name}</td>
                          <td className="py-1 pr-3">{f.category}</td>
                          <td className="py-1 pr-3">{f.condition}</td>
                          <td className="py-1 pr-3 tabular-nums">
                            {open.length}
                            {crit && <Badge variant="destructive" className="ml-1">critical</Badge>}
                          </td>
                          <td className="py-1">
                            <Badge variant={STATUS_VARIANT[f.status] ?? "outline"}>{f.status.replace("_", " ")}</Badge>
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
                <CardTitle className="text-base">Register a facility</CardTitle>
                <CardDescription>Add a campus facility with its AMC details.</CardDescription>
              </CardHeader>
              <CardContent>
                <RegisterFacilityForm org={org} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Work orders &amp; status</CardTitle>
                <CardDescription>Raise / complete work orders; return to operational (safety-gated); close.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <RaiseWorkOrderForm />
                <div className="border-t pt-4">
                  <CompleteWorkOrderForm />
                </div>
                <div className="border-t pt-4">
                  <SetOperationalForm />
                </div>
                <div className="border-t pt-4">
                  <CloseFacilityForm />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

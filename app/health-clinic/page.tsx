import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getClinicDashboard, getClinicVisits, backboneConnected } from "./actions"
import { OpenVisitForm, TreatForm, CloseVisitForm } from "./clinic-client"

export const dynamic = "force-dynamic"

const OUTCOME_VARIANT: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
  recovered: "default",
  referred: "destructive",
  sent_home: "secondary",
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function HealthClinicPage() {
  const connected = await backboneConnected()
  const d = await getClinicDashboard()
  const visits = await getClinicVisits()
  const org = visits[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Health Clinic (Sick Room)</PageHeaderHeading>
        <PageHeaderDescription>
          The day-to-day sick-room register: a student reports a complaint, the nurse records first-aid, and the
          visit is closed with an outcome. The backbone enforces three hard rules — a student can have{" "}
          <strong>only one open visit at a time</strong> (no double sick-room presence), a visit{" "}
          <strong>cannot be closed without an outcome</strong>, and a <strong>referral requires a destination</strong>{" "}
          (PHC/RBSK/hospital). Every button performs a real, persisted, audited operation.
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
            <Stat label="Visits" value={d.visits} />
            <Stat label="In sick room now" value={d.open_now} />
            <Stat label="Referrals" value={d.referrals} />
            <Stat label="Recovered" value={d.by_outcome?.recovered ?? 0} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">single-open · outcome-gated · referral-dest</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Visits</CardTitle>
              <CardDescription>{visits.length} visit(s) in scope. Open rows are students in the sick room now.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {visits.length === 0 ? (
                <p className="text-sm text-muted-foreground">No clinic visits.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-1 pr-3 font-medium">Id</th>
                      <th className="py-1 pr-3 font-medium">Student</th>
                      <th className="py-1 pr-3 font-medium">Complaint</th>
                      <th className="py-1 pr-3 font-medium">Treatments</th>
                      <th className="py-1 font-medium">Status / outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.sort((a, b) => a.id.localeCompare(b.id)).map((v) => (
                      <tr key={v.id} className="border-t">
                        <td className="py-1 pr-3 font-mono whitespace-nowrap">{v.id}</td>
                        <td className="py-1 pr-3 font-mono">{v.student_id}</td>
                        <td className="py-1 pr-3">{v.complaint}</td>
                        <td className="py-1 pr-3">{v.treatments?.length ?? 0}</td>
                        <td className="py-1">
                          {v.status === "open" ? (
                            <Badge>in sick room</Badge>
                          ) : (
                            <Badge variant={OUTCOME_VARIANT[v.outcome ?? ""] ?? "outline"}>
                              {v.outcome === "referred" ? `referred → ${v.destination}` : v.outcome?.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Open a visit · record treatment</CardTitle>
                <CardDescription>Open a sick-room visit, then record first-aid given.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <OpenVisitForm org={org} />
                <div className="border-t pt-4">
                  <TreatForm />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Close with an outcome</CardTitle>
                <CardDescription>Recovered, sent home, or referred (a referral needs a destination).</CardDescription>
              </CardHeader>
              <CardContent>
                <CloseVisitForm />
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

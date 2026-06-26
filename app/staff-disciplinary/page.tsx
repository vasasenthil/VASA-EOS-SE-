import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getDisciplinaryDashboard, getDisciplinaryCases, backboneConnected } from "./actions"
import { ChargeForm, InquiryForm, DecideForm, AppealForm, CloseCaseForm } from "./disciplinary-client"

export const dynamic = "force-dynamic"

const STAGE_VARIANT: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
  charge_issued: "outline",
  under_inquiry: "secondary",
  decided: "default",
  closed: "secondary",
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function StaffDisciplinaryPage() {
  const connected = await backboneConnected()
  const d = await getDisciplinaryDashboard()
  const cases = await getDisciplinaryCases()
  const org = cases[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Staff Disciplinary &amp; Vigilance</PageHeaderHeading>
        <PageHeaderDescription>
          Due-process disciplinary proceedings under the service rules (distinct from citizen grievances). A charge
          is issued, an inquiry is held, a penalty is decided and the official may appeal. The backbone encodes
          natural justice — a penalty <strong>cannot be imposed without an inquiry</strong>, the penalty must be
          from the <strong>sanctioned schedule</strong>, and an <strong>appeal lies only against a decided case</strong>.
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
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Cases" value={d.cases} />
            <Stat label="Pending inquiry" value={d.by_stage?.charge_issued ?? 0} />
            <Stat label="Decided" value={d.by_stage?.decided ?? 0} />
            <Stat label="Under appeal" value={d.under_appeal} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">inquiry-before-penalty · sanctioned · appealable</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Disciplinary cases</CardTitle>
              <CardDescription>{cases.length} case(s) in scope.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {cases.length === 0 ? (
                <p className="text-sm text-muted-foreground">No disciplinary cases.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-1 pr-3 font-medium">Id</th>
                      <th className="py-1 pr-3 font-medium">Employee</th>
                      <th className="py-1 pr-3 font-medium">Charge</th>
                      <th className="py-1 pr-3 font-medium">Penalty</th>
                      <th className="py-1 font-medium">Stage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.sort((a, b) => a.id.localeCompare(b.id)).map((c) => (
                      <tr key={c.id} className="border-t">
                        <td className="py-1 pr-3 font-mono whitespace-nowrap">{c.id}</td>
                        <td className="py-1 pr-3 font-mono">{c.employee_id}</td>
                        <td className="py-1 pr-3">{c.charge}</td>
                        <td className="py-1 pr-3">{c.penalty ? c.penalty.replace(/_/g, " ") : "—"}</td>
                        <td className="py-1">
                          <span className="inline-flex items-center gap-1">
                            <Badge variant={STAGE_VARIANT[c.stage] ?? "outline"}>{c.stage.replace(/_/g, " ")}</Badge>
                            {c.appealed && <Badge variant="destructive">appealed</Badge>}
                          </span>
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
                <CardTitle className="text-base">Charge · inquiry</CardTitle>
                <CardDescription>Issue a charge, then record the inquiry findings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ChargeForm org={org} />
                <div className="border-t pt-4">
                  <InquiryForm />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Decide · appeal · close</CardTitle>
                <CardDescription>Impose a penalty (after inquiry only), file an appeal, then close.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <DecideForm />
                <div className="border-t pt-4">
                  <AppealForm />
                </div>
                <div className="border-t pt-4">
                  <CloseCaseForm />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

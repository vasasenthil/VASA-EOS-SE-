import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getWaterDashboard, getWaterTests, backboneConnected } from "./actions"
import { RegisterSampleForm, RecordParamForm, ApproveWaterForm, FailWaterForm } from "./water-client"

export const dynamic = "force-dynamic"

const STATUS_VARIANT: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
  sampled: "outline",
  tested: "secondary",
  approved: "default",
  failed: "destructive",
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function WaterTestingPage() {
  const connected = await backboneConnected()
  const d = await getWaterDashboard()
  const tests = await getWaterTests()
  const org = tests[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Water Quality Testing</PageHeaderHeading>
        <PageHeaderDescription>
          Drinking-water safety for every school (Jal Jeevan / IS 10500). A sample is drawn, the lab records
          parameter readings (pH, turbidity, E.coli, TDS, residual chlorine), and the backbone enforces two
          symmetric gates: a source can be <strong>approved potable only when every critical parameter is in
          range</strong>, and can be <strong>marked unsafe only when a critical parameter is actually out of
          range</strong>. Every button performs a real, persisted, audited operation.
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
            <Stat label="Samples" value={d.samples} />
            <Stat label="Potable" value={d.potable} />
            <Stat label="Unsafe" value={d.unsafe} />
            <Stat label="Awaiting verdict" value={d.by_status?.tested ?? 0} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">potability-gated · evidence-backed · durable</p>
            </div>
          </section>

          {(d.unsafe_list?.length ?? 0) > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{d.unsafe_list!.length} unsafe source(s)</AlertTitle>
              <AlertDescription>
                {d.unsafe_list!.map((t) => `${t.id} (${t.source})`).join(" · ")}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Water samples</CardTitle>
              <CardDescription>{tests.length} sample(s) in scope. Out-of-range readings are flagged red.</CardDescription>
            </CardHeader>
            <CardContent>
              {tests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No water samples.</p>
              ) : (
                <div className="space-y-4">
                  {tests.sort((a, b) => a.id.localeCompare(b.id)).map((t) => (
                    <div key={t.id} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs">{t.id}</span>
                        <Badge variant="outline">{t.source.replace(/_/g, " ")}</Badge>
                        <Badge variant={STATUS_VARIANT[t.status] ?? "outline"}>{t.status}</Badge>
                        <span className="text-xs text-muted-foreground">sampled {t.sample_date}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {(t.parameters ?? []).map((p) => {
                          const inRange = p.value >= p.safe_min && p.value <= p.safe_max
                          return (
                            <span key={p.name} className={`inline-flex items-center gap-1 rounded border px-2 py-1 ${!inRange ? "border-destructive text-destructive" : ""}`}>
                              {p.critical && <span aria-hidden title="critical" className="text-amber-600">★</span>}
                              {p.name}
                              <span className="tabular-nums font-medium">{p.value}</span>
                              <span className="text-muted-foreground">[{p.safe_min}–{p.safe_max}]</span>
                            </span>
                          )
                        })}
                      </div>
                      {t.remarks && <p className="mt-2 text-xs text-muted-foreground">{t.remarks}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Register a sample · record readings</CardTitle>
                <CardDescription>Draw a sample, then record each lab parameter reading.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <RegisterSampleForm org={org} />
                <div className="border-t pt-4">
                  <RecordParamForm />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Approve · fail</CardTitle>
                <CardDescription>Approval needs all critical params in range; fail needs one out of range.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ApproveWaterForm />
                <div className="border-t pt-4">
                  <FailWaterForm />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

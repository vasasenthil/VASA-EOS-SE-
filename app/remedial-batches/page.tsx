import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getRemedialDashboard, getRemedialBatches, backboneConnected } from "./actions"
import { CreateBatchForm, EnrolForm, GraduateForm, CloseBatchForm } from "./remedial-client"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function RemedialBatchesPage() {
  const connected = await backboneConnected()
  const d = await getRemedialDashboard()
  const batches = await getRemedialBatches()
  const org = batches[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Diagnostic &amp; Remedial Learning (NIPUN FLN)</PageHeaderHeading>
        <PageHeaderDescription>
          Foundational Literacy &amp; Numeracy remediation: students diagnosed below the proficiency target are
          grouped into capped batches until they reach it. The backbone enforces four hard rules — a batch can{" "}
          <strong>never exceed capacity</strong>, only a student <strong>below the target is eligible</strong> to
          enrol, a student is <strong>enrolled at most once</strong>, and a student can only{" "}
          <strong>graduate once re-assessed at or above the target</strong>. Every button performs a real,
          persisted, audited operation.
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
            <Stat label="Batches" value={d.batches} />
            <Stat label="Active learners" value={d.active} />
            <Stat label="Graduated" value={d.graduated} />
            <Stat label="Graduation %" value={d.graduate_pct.toFixed(0)} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">capacity · eligibility · proficiency-gated</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Remedial batches</CardTitle>
              <CardDescription>{batches.length} batch(es) in scope. The bar shows active enrolment vs capacity.</CardDescription>
            </CardHeader>
            <CardContent>
              {batches.length === 0 ? (
                <p className="text-sm text-muted-foreground">No remedial batches.</p>
              ) : (
                <div className="space-y-3">
                  {batches.sort((a, b) => a.id.localeCompare(b.id)).map((b) => {
                    const active = (b.enrollments ?? []).filter((e) => !e.exited).length
                    const graduated = (b.enrollments ?? []).filter((e) => e.exited).length
                    const pct = b.capacity > 0 ? Math.round((active / b.capacity) * 100) : 0
                    return (
                      <div key={b.id} className="rounded-lg border p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs">{b.id}</span>
                          <Badge variant="outline">{b.subject}</Badge>
                          <Badge variant="secondary">target L{b.target_level}</Badge>
                          <Badge variant={b.status === "open" ? "default" : "secondary"}>{b.status}</Badge>
                          {graduated > 0 && <span className="text-xs text-green-600">{graduated} graduated</span>}
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <Progress value={pct} className="h-2 max-w-xs" />
                          <span className="text-xs tabular-nums text-muted-foreground">{active}/{b.capacity} active</span>
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
                <CardTitle className="text-base">Open a batch · enrol</CardTitle>
                <CardDescription>Open a remedial batch, then enrol below-target students.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <CreateBatchForm org={org} />
                <div className="border-t pt-4">
                  <EnrolForm />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Graduate · close</CardTitle>
                <CardDescription>Graduate a now-proficient student (≥ target); close the batch.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <GraduateForm />
                <div className="border-t pt-4">
                  <CloseBatchForm />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getExamDashboard, backboneConnected } from "./actions"
import { EnterMarksForm, SheetLifecycle } from "./exam-results-client"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  published: "default",
  submitted: "secondary",
  open: "outline",
  returned: "destructive",
}

export default async function ExamResultsPage() {
  const connected = await backboneConnected()
  const d = await getExamDashboard()
  const sheets = d?.per_sheet ?? []
  const editable = sheets.filter((s) => s.status === "open" || s.status === "returned")

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Examinations &amp; Results</PageHeaderHeading>
        <PageHeaderDescription>
          Run the marks lifecycle against the durable backbone: a sheet moves <strong>open → submitted →
          published</strong> (or is returned for correction). Entering and submitting marks needs an authorised
          teacher; <strong>moderation needs the head teacher</strong> — a teacher who can enter marks cannot
          publish them (separation of duties, enforced by the unified PDP). Grades and pass/fail are computed when
          a sheet is locked at submission. Every button performs a real, persisted, audited operation.
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
            Enter-marks / Submit / Publish button performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {!connected && <DemoDataNote />}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Sheets" value={d.sheets} />
            <Stat label="Results recorded" value={d.results_recorded} />
            <Stat label="Overall pass" value={d.overall_pass} />
            <Stat label="Pass %" value={d.overall_pass_pct.toFixed(0)} />
            <Stat label="Published" value={d.by_status["published"] ?? 0} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">PDP-gated · durable · audited</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Marks sheets</CardTitle>
              <CardDescription>Per-sheet status, analytics, and the lifecycle controls for its stage.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {sheets.map((s) => (
                  <li key={s.exam_id} className="py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {s.subject} · {s.class}{" "}
                          <Badge variant={STATUS_VARIANT[s.status] ?? "outline"} className="ml-1 capitalize">{s.status}</Badge>
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">{s.exam_id} · {s.org_unit}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {s.stats.entered} entered · {s.status === "open" ? "grades pending lock" : `pass ${s.stats.pass}/${s.stats.entered} (${s.stats.pass_pct.toFixed(0)}%)`}
                          {" · "}mean {s.stats.mean_marks.toFixed(1)} · high {s.stats.highest}
                        </p>
                        {s.status !== "open" && Object.keys(s.stats.grade_distribution).length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {Object.entries(s.stats.grade_distribution).sort().map(([g, n]) => (
                              <Badge key={g} variant="outline" className="text-xs">{g}: {n}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <SheetLifecycle examId={s.exam_id} status={s.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Enter marks</CardTitle>
              <CardDescription>Records a student's marks on an open/returned sheet (PDP-gated).</CardDescription>
            </CardHeader>
            <CardContent>
              <EnterMarksForm sheets={editable.map((s) => ({ id: s.exam_id, label: `${s.subject} · ${s.class} (${s.status})` }))} />
            </CardContent>
          </Card>
        </div>
      )}
    </Shell>
  )
}

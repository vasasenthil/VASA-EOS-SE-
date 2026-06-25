import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getLessonPlanDashboard, backboneConnected } from "./actions"
import { CreateLessonPlanForm, LessonPlanActions } from "./lesson-plan-client"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function LessonPlanPage() {
  const connected = await backboneConnected()
  const d = await getLessonPlanDashboard()
  const drafts = d?.draft_worklist ?? []
  const org = drafts[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Lesson Plans</PageHeaderHeading>
        <PageHeaderDescription>
          Author durable, reusable lesson plans — topic, learning objectives, FLN/NEP mapping and resources —
          against the backbone. A plan can be <strong>published only once it carries learning objectives</strong>{" "}
          (a quality gate, enforced server-side). Published plans are the ones a lesson-delivery / period-attendance
          record references. Lifecycle: draft → published → archived. Every button performs a real, persisted,
          audited operation.
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
            Create / Publish / Archive button performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {!connected && <DemoDataNote />}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Plans" value={d.total} />
            <Stat label="Published" value={d.published} />
            <Stat label="Draft" value={d.by_status["draft"] ?? 0} />
            <Stat label="Archived" value={d.by_status["archived"] ?? 0} />
            <div className="rounded-lg border p-4 sm:col-span-2">
              <div className="flex flex-wrap gap-1">
                {Object.entries(d.by_subject).map(([s, n]) => (
                  <Badge key={s} variant="outline" className="text-xs">{s} {n}</Badge>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">live · {d.scope} · durable · audited</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Draft plans (awaiting publish)</CardTitle>
              <CardDescription>
                {drafts.length} draft(s). A plan without learning objectives cannot be published — add objectives,
                then publish.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {drafts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No drafts pending.</p>
              ) : (
                <ul className="divide-y">
                  {drafts.map((l) => (
                    <li key={l.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {l.subject} · {l.topic}
                          {!l.objectives && <Badge variant="destructive" className="ml-2">no objectives</Badge>}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">{l.id} · {l.class} · {l.teacher_id} · {l.periods}p</p>
                        {l.tags && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {l.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                              <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <LessonPlanActions id={l.id} status={l.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Author a lesson plan</CardTitle>
              <CardDescription>Creates a draft; add learning objectives to make it publishable.</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateLessonPlanForm org={org} />
            </CardContent>
          </Card>
        </div>
      )}
    </Shell>
  )
}

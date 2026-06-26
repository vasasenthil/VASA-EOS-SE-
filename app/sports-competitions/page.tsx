import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getCompetitionDashboard, getCompetitions, backboneConnected } from "./actions"
import { CreateCompetitionForm, EnterForm, ResultForm, AdvanceForm, CloseForm } from "./competitions-client"

export const dynamic = "force-dynamic"

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" }

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function SportsCompetitionsPage() {
  const connected = await backboneConnected()
  const d = await getCompetitionDashboard()
  const comps = await getCompetitions()
  const org = comps[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Co-curricular &amp; Sports Competitions</PageHeaderHeading>
        <PageHeaderDescription>
          Sports meets and co-curricular contests on the school-games ladder (school → block → district → state →
          national). The backbone enforces three hard rules: a student can be <strong>entered only once</strong> per
          competition, each <strong>podium position (1st/2nd/3rd) is awarded once</strong>, and{" "}
          <strong>only podium finishers advance</strong> to the next level (a national result is terminal). Every
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
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Competitions" value={d.total} />
            <Stat label="Entries" value={d.entries} />
            <Stat label="Podium finishers" value={d.podium} />
            <Stat label="Advanced" value={d.advanced} />
            <Stat label="Open" value={d.by_status?.open ?? 0} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">unique-entry · podium-unique · ladder</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Competitions</CardTitle>
              <CardDescription>{comps.length} competition(s) in scope.</CardDescription>
            </CardHeader>
            <CardContent>
              {comps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No competitions.</p>
              ) : (
                <div className="space-y-4">
                  {comps.sort((a, b) => a.id.localeCompare(b.id)).map((c) => {
                    const podium = (c.entries ?? []).filter((e) => e.position >= 1 && e.position <= 3).sort((a, b) => a.position - b.position)
                    return (
                      <div key={c.id} className="rounded-lg border p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs">{c.id}</span>
                          <span className="text-sm font-medium">{c.name}</span>
                          <Badge variant="outline">{c.discipline.replace(/_/g, " ")}</Badge>
                          <Badge variant="secondary">{c.level}</Badge>
                          <Badge variant={c.status === "open" ? "default" : "secondary"}>{c.status}</Badge>
                          <span className="text-xs text-muted-foreground">{c.entries?.length ?? 0} entries</span>
                        </div>
                        {podium.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            {podium.map((e) => (
                              <span key={e.student_id} className="inline-flex items-center gap-1 rounded border px-2 py-1">
                                <span aria-hidden>{MEDAL[e.position]}</span>
                                <span className="font-mono">{e.student_id}</span>
                                {e.advanced && <Badge className="ml-1">advanced</Badge>}
                              </span>
                            ))}
                          </div>
                        )}
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
                <CardTitle className="text-base">Open a competition · enter students</CardTitle>
                <CardDescription>Create a competition, then enter students (each at most once).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <CreateCompetitionForm org={org} />
                <div className="border-t pt-4">
                  <EnterForm />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Record results · advance · close</CardTitle>
                <CardDescription>Award unique podium places, advance a finisher, or close the event.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ResultForm />
                <div className="border-t pt-4">
                  <AdvanceForm />
                </div>
                <div className="border-t pt-4">
                  <CloseForm />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

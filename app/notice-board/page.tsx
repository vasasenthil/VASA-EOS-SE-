import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getCircularDashboard, getCirculars, backboneConnected } from "./actions"
import { CreateCircularForm, PublishForm, AckForm, ArchiveForm } from "./notice-client"

export const dynamic = "force-dynamic"

const STATUS_VARIANT: Record<string, "secondary" | "default" | "outline"> = {
  draft: "outline",
  published: "default",
  archived: "secondary",
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function NoticeBoardPage() {
  const connected = await backboneConnected()
  const d = await getCircularDashboard()
  const circulars = await getCirculars()
  const org = circulars[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Notice Board &amp; Circulars</PageHeaderHeading>
        <PageHeaderDescription>
          Official circulars issued to a defined audience, with tracked read-receipts. The backbone enforces three
          hard rules: a recipient cannot acknowledge a circular that is <strong>not yet published</strong>, cannot
          acknowledge <strong>more than once</strong>, and a circular cannot be <strong>archived until every
          targeted recipient has acknowledged</strong> it. Every button performs a real, persisted, audited
          operation.
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
            <Stat label="Circulars" value={d.circulars} />
            <Stat label="Published" value={d.by_status?.published ?? 0} />
            <Stat label="Acknowledgements" value={`${d.acks}/${d.targets}`} />
            <Stat label="Ack rate %" value={d.ack_pct.toFixed(0)} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">publish-then-ack · unique · archive-gated</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Circulars</CardTitle>
              <CardDescription>{circulars.length} circular(s) in scope. The bar shows acknowledgement progress.</CardDescription>
            </CardHeader>
            <CardContent>
              {circulars.length === 0 ? (
                <p className="text-sm text-muted-foreground">No circulars.</p>
              ) : (
                <div className="space-y-3">
                  {circulars.sort((a, b) => a.id.localeCompare(b.id)).map((c) => {
                    const acked = c.acks?.length ?? 0
                    const pct = c.target_count > 0 ? Math.round((acked / c.target_count) * 100) : 0
                    return (
                      <div key={c.id} className="rounded-lg border p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs">{c.id}</span>
                          <span className="text-sm font-medium">{c.title}</span>
                          <Badge variant="outline">{c.category}</Badge>
                          <Badge variant={STATUS_VARIANT[c.status] ?? "outline"}>{c.status}</Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <Progress value={pct} className="h-2 max-w-xs" />
                          <span className="text-xs tabular-nums text-muted-foreground">{acked}/{c.target_count} acknowledged</span>
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
                <CardTitle className="text-base">Draft &amp; publish</CardTitle>
                <CardDescription>Draft a circular for a target audience, then publish it.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <CreateCircularForm org={org} />
                <div className="border-t pt-4">
                  <PublishForm />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Acknowledge &amp; archive</CardTitle>
                <CardDescription>Acknowledge a published circular; archive once everyone has.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <AckForm />
                <div className="border-t pt-4">
                  <ArchiveForm />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

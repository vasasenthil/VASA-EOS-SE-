import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { getGrievanceCases, backboneConnected } from "./actions"
import { FileForm, ActButtons } from "./grievance-cases-client"

export const dynamic = "force-dynamic"

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "secondary",
  escalated: "destructive",
  resolved: "default",
  rejected: "outline",
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function GrievanceCasesPage() {
  const connected = await backboneConnected()
  const cases = await getGrievanceCases()
  const today = new Date().toISOString().slice(0, 10)
  const counts = cases.reduce<Record<string, number>>((a, c) => ((a[c.status] = (a[c.status] ?? 0) + 1), a), {})
  const open = cases.filter((c) => c.status === "open" || c.status === "escalated")
  const breached = open.filter((c) => (c.due_at ?? "").slice(0, 10) < today).length

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Grievance Redressal (durable, SLA-tracked)</PageHeaderHeading>
        <PageHeaderDescription>
          File and handle grievances against the durable backbone. Each category opens a tiered escalation chain
          under an SLA; an officer can resolve, reject, or escalate to the next authority, and an SLA breach
          auto-escalates. Every button performs a real, persisted, audited operation.
        </PageHeaderDescription>
      </PageHeader>

      {!connected ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Backbone not connected</AlertTitle>
          <AlertDescription>
            This module drives the durable Go backbone (platformd + PostgreSQL). Run the full stack and set{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">PLATFORM_URL</code> (e.g.{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">deploy/pilot/run-local.sh</code>), then every
            File / Resolve / Escalate / Reject button performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Cases" value={cases.length} />
            <Stat label="Open" value={(counts.open ?? 0) + (counts.escalated ?? 0)} />
            <Stat label="Resolved" value={counts.resolved ?? 0} />
            <Stat label="SLA breached" value={breached} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · backbone</Badge>
              <p className="mt-1 text-xs text-muted-foreground">durable · audited</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Open cases (escalation worklist)</CardTitle>
              <CardDescription>{open.length} case(s) awaiting action across the tiered chain.</CardDescription>
            </CardHeader>
            <CardContent>
              {open.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open grievances.</p>
              ) : (
                <ul className="divide-y">
                  {open.map((c) => {
                    const tierRole = c.escalation_chain[c.current_tier]?.role ?? "officer"
                    const overdue = (c.due_at ?? "").slice(0, 10) < today
                    return (
                      <li key={c.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{c.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.id} · {c.category} · by {c.complainant} · SLA {c.due_at?.slice(0, 10)}
                            {overdue && <span className="ml-1 font-semibold text-destructive">· BREACHED</span>}
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-1 text-xs">
                            {c.escalation_chain.map((s, i) => (
                              <span key={i} className={`rounded px-1.5 py-0.5 ${i === c.current_tier ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                {s.role}{s.decision ? ` ✓` : ""}
                              </span>
                            ))}
                          </p>
                        </div>
                        <ActButtons caseId={c.id} role={tierRole} />
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">File a grievance</CardTitle>
                <CardDescription>The category sets the escalation chain (safety → HEAD_TEACHER · DEO · DIRECTOR).</CardDescription>
              </CardHeader>
              <CardContent>
                <FileForm />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Closed cases</CardTitle>
                <CardDescription>Resolved / rejected.</CardDescription>
              </CardHeader>
              <CardContent>
                {cases.filter((c) => c.status === "resolved" || c.status === "rejected").length === 0 ? (
                  <p className="text-sm text-muted-foreground">None yet.</p>
                ) : (
                  <ul className="divide-y">
                    {cases.filter((c) => c.status === "resolved" || c.status === "rejected").slice(0, 12).map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-2 py-2">
                        <span className="truncate text-sm">{c.subject}</span>
                        <Badge variant={STATUS_VARIANT[c.status] ?? "secondary"}>{c.status}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

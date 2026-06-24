import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { getCalendarDashboard, getPendingEntries, backboneConnected } from "./actions"
import { AddEntryForm, DecideControls } from "./events-calendar-client"

export const dynamic = "force-dynamic"

const ORG = process.env.PLATFORM_DEFAULT_ORG ?? "TN-DIST-Chennai"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

const TYPE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  exam: "default",
  holiday: "secondary",
}

export default async function EventsCalendarPage() {
  const connected = await backboneConnected()
  const d = await getCalendarDashboard()
  const pending = await getPendingEntries()
  const upcoming = d?.upcoming ?? []
  // discover a real tenancy node (a school UDISE) from existing entries so new drafts size their chain correctly
  const org = upcoming[0]?.org_unit ?? pending[0]?.org_unit ?? ORG

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Academic Calendar &amp; Approvals</PageHeaderHeading>
        <PageHeaderDescription>
          Plan the academic year — terms, exams, holidays, PTMs and events — as durable, jurisdiction-scoped
          entries that move through a <strong>dynamic multi-tier approval chain</strong>. The number of approval
          levels is derived from the entry type and the tenancy level of its org unit; each decision is{" "}
          <strong>fail-closed</strong> (the approver must hold the tier's role and scope). Every button performs a
          real, persisted, audited operation.
        </PageHeaderDescription>
      </PageHeader>

      {!connected || !d ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Backbone not connected</AlertTitle>
          <AlertDescription>
            This module drives the durable Go backbone (platformd + PostgreSQL). Run the full stack and set{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">PLATFORM_URL</code> (e.g.{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">deploy/pilot/run-local.sh</code>), then every
            Add / Approve / Reject button performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Entries" value={d.total} />
            <Stat label="Published" value={d.published} />
            <Stat label="Pending approval" value={d.pending_approvals} />
            <Stat label={`AY ${d.academic_year}`} value={Object.keys(d.by_type).length + " types"} />
            <div className="rounded-lg border p-4 sm:col-span-2">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">multi-tier · fail-closed · durable · audited</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Approval inbox</CardTitle>
              <CardDescription>
                {pending.length} entry(ies) awaiting a decision at their current tier. Each card shows the exact
                governance level acting; Approve advances to the next tier (or publishes on the last), Reject stops
                the chain.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pending.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing awaiting approval.</p>
              ) : (
                <ul className="divide-y">
                  {pending.map((e) => {
                    const chain = e.approval_chain ?? []
                    const step = chain[e.current_step]
                    return (
                      <li key={e.id} className="py-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {e.title} <Badge variant={TYPE_VARIANT[e.type] ?? "outline"} className="ml-1 capitalize">{e.type}</Badge>
                            </p>
                            <p className="font-mono text-xs text-muted-foreground">
                              {e.id} · {e.start_date}{e.end_date !== e.start_date && `–${e.end_date}`} · step {e.current_step + 1}/{chain.length}
                            </p>
                          </div>
                          {step && (
                            <DecideControls entryId={e.id} role={step.approver_role} scope={step.required_scope} />
                          )}
                        </div>
                        {/* the full approval route, current tier highlighted */}
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          {chain.map((s, i) => (
                            <Badge
                              key={s.tier + i}
                              variant={s.decision === "approved" ? "default" : i === e.current_step ? "secondary" : "outline"}
                              className="text-xs"
                            >
                              {s.tier} {s.approver_role}
                              {s.decision === "approved" && " ✓"}
                              {i === e.current_step && " ←"}
                            </Badge>
                          ))}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Upcoming (published)</CardTitle>
                <CardDescription>Approved entries live on the calendar, soonest first.</CardDescription>
              </CardHeader>
              <CardContent>
                {upcoming.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No published upcoming entries.</p>
                ) : (
                  <ul className="divide-y">
                    {upcoming.map((e) => (
                      <li key={e.id} className="flex items-center justify-between gap-2 py-2">
                        <div>
                          <p className="text-sm font-medium">{e.title}</p>
                          <p className="font-mono text-xs text-muted-foreground">{e.start_date} · {e.type}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">published</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add a calendar entry</CardTitle>
                <CardDescription>Creates a draft and routes it into its approval chain.</CardDescription>
              </CardHeader>
              <CardContent>
                <AddEntryForm org={org} />
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

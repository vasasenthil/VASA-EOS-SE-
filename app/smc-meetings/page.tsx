import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { getSMCDashboard, getSMCMeetings, backboneConnected } from "./actions"
import {
  ScheduleSMCForm,
  ConveneSMCForm,
  ResolveSMCForm,
  CompleteResolutionForm,
  CloseSMCForm,
} from "./smc-meetings-client"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

const STATUS_VARIANT: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
  scheduled: "outline",
  convened: "default",
  closed: "secondary",
}

export default async function SMCMeetingsPage() {
  const connected = await backboneConnected()
  const d = await getSMCDashboard()
  const meetings = await getSMCMeetings()
  const org = meetings[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>SMC Meetings &amp; Resolutions</PageHeaderHeading>
        <PageHeaderDescription>
          School Management Committee governance under <strong>RTE §21–22</strong>. The backbone enforces two hard
          rules: a committee cannot be constituted unless <strong>three-fourths of its members are parents</strong>{" "}
          (RTE §21(2)), and a meeting can only be <strong>convened</strong> — and resolutions only passed — when a{" "}
          <strong>majority quorum</strong> is present. Resolutions are durable action items with an open→done
          lifecycle. Every button performs a real, persisted, audited operation.
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
            control performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Meetings" value={d.meetings} />
            <Stat label="Convened" value={d.convened} />
            <Stat label="Quorate rate %" value={d.quorate_rate.toFixed(0)} />
            <Stat label="Resolutions" value={d.resolutions} />
            <Stat label="Open actions" value={d.open_actions} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">RTE-composition · quorum · durable</p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Open action items</CardTitle>
                <CardDescription>Resolutions still pending across governed schools.</CardDescription>
              </CardHeader>
              <CardContent>
                {(d.action_list ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No open action items.</p>
                ) : (
                  <ul className="divide-y text-sm">
                    {(d.action_list ?? []).map((r) => {
                      const meetingId = r.id.replace(/-R\d+$/, "")
                      return (
                        <li key={r.id} className="flex items-center justify-between gap-2 py-2">
                          <div>
                            <p className="font-medium">{r.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              <span className="font-mono">{r.id}</span> · owner {r.owner || "—"} · due {r.due_date || "—"}
                            </p>
                          </div>
                          <CompleteResolutionForm meetingId={meetingId} resolutionId={r.id} />
                        </li>
                      )
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Status mix</CardTitle>
                <CardDescription>Meetings by lifecycle state.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {Object.entries(d.by_status).sort().map(([k, v]) => (
                    <li key={k} className="flex items-center justify-between">
                      <Badge variant={STATUS_VARIANT[k] ?? "outline"}>{k}</Badge>
                      <span className="tabular-nums">{v}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Meetings</CardTitle>
              <CardDescription>{meetings.length} meeting(s) in scope.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {meetings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No meetings recorded.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-1 pr-3 font-medium">Id</th>
                      <th className="py-1 pr-3 font-medium">Title</th>
                      <th className="py-1 pr-3 font-medium">Date</th>
                      <th className="py-1 pr-3 font-medium">Composition</th>
                      <th className="py-1 pr-3 font-medium">Present</th>
                      <th className="py-1 pr-3 font-medium">Resolutions</th>
                      <th className="py-1 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meetings.sort((a, b) => a.id.localeCompare(b.id)).map((m) => {
                      const open = (m.resolutions ?? []).filter((r) => r.status === "open").length
                      const done = (m.resolutions ?? []).length - open
                      return (
                        <tr key={m.id} className="border-t align-top">
                          <td className="py-1 pr-3 font-mono whitespace-nowrap">{m.id}</td>
                          <td className="py-1 pr-3">{m.title}</td>
                          <td className="py-1 pr-3 whitespace-nowrap">{m.scheduled_date}</td>
                          <td className="py-1 pr-3 tabular-nums">{m.parent_members}/{m.total_members} parents</td>
                          <td className="py-1 pr-3 tabular-nums">{m.status === "scheduled" ? "—" : `${m.present_count}/${m.total_members}`}</td>
                          <td className="py-1 pr-3 tabular-nums">{done} done · {open} open</td>
                          <td className="py-1">
                            <Badge variant={STATUS_VARIANT[m.status] ?? "outline"}>{m.status}</Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Schedule a meeting</CardTitle>
                <CardDescription>Constitute an SMC meeting (RTE composition enforced).</CardDescription>
              </CardHeader>
              <CardContent>
                <ScheduleSMCForm org={org} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Convene &amp; resolve</CardTitle>
                <CardDescription>Convene with quorum, then record resolutions; close when done.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ConveneSMCForm />
                <div className="border-t pt-4">
                  <ResolveSMCForm />
                </div>
                <div className="border-t pt-4">
                  <CloseSMCForm />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

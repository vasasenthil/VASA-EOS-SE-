import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getVisitorDashboard, getVisitorPasses, backboneConnected } from "./actions"
import { CheckInForm, CheckOutForm } from "./gate-client"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function VisitorGatePage() {
  const connected = await backboneConnected()
  const d = await getVisitorDashboard()
  const passes = await getVisitorPasses()
  const org = passes[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Visitor &amp; Gate Management</PageHeaderHeading>
        <PageHeaderDescription>
          The school gate register: every visitor is checked in on entry and checked out on exit, so the register
          always answers <strong>&ldquo;who is on campus right now?&rdquo;</strong>. The backbone enforces two hard
          rules: a visitor can hold <strong>only one open pass at a time</strong> (no phantom presence), and a pass
          that is already checked out <strong>cannot be checked out again</strong>. Every button performs a real,
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
            <Stat label="Passes" value={d.total} />
            <Stat label="On premises now" value={d.on_premises} />
            <Stat label="Checked out" value={d.checked_out} />
            <Stat label="Parent meetings" value={d.by_purpose?.parent_meeting ?? 0} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">single-open-pass · no double check-out · durable</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Gate register</CardTitle>
              <CardDescription>{passes.length} pass(es) in scope. Checked-in rows are on campus now.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {passes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No visitor passes.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-1 pr-3 font-medium">Pass</th>
                      <th className="py-1 pr-3 font-medium">Visitor</th>
                      <th className="py-1 pr-3 font-medium">Purpose</th>
                      <th className="py-1 pr-3 font-medium">Host</th>
                      <th className="py-1 pr-3 font-medium">In / Out</th>
                      <th className="py-1 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passes.sort((a, b) => a.id.localeCompare(b.id)).map((v) => (
                      <tr key={v.id} className="border-t">
                        <td className="py-1 pr-3 font-mono whitespace-nowrap">{v.id}</td>
                        <td className="py-1 pr-3 font-mono">{v.visitor_id}</td>
                        <td className="py-1 pr-3">{v.purpose.replace(/_/g, " ")}</td>
                        <td className="py-1 pr-3 font-mono">{v.host}</td>
                        <td className="py-1 pr-3 tabular-nums whitespace-nowrap">
                          {(v.check_in_at || "").slice(11, 16)}
                          {v.check_out_at ? ` → ${v.check_out_at.slice(11, 16)}` : " → —"}
                        </td>
                        <td className="py-1">
                          <Badge variant={v.status === "checked_in" ? "default" : "secondary"}>
                            {v.status === "checked_in" ? "on campus" : "left"}
                          </Badge>
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
                <CardTitle className="text-base">Check in a visitor</CardTitle>
                <CardDescription>Register an entry — blocked if the visitor already holds an open pass.</CardDescription>
              </CardHeader>
              <CardContent>
                <CheckInForm org={org} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Check out</CardTitle>
                <CardDescription>Record an exit — a pass cannot be checked out twice.</CardDescription>
              </CardHeader>
              <CardContent>
                <CheckOutForm />
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

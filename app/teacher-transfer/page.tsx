import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getTransferDashboard, getTransferList, backboneConnected } from "./actions"
import { RequestTransferForm, ApproveTransferForm, PostTransferForm, RejectTransferForm } from "./teacher-transfer-client"

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
  requested: "outline",
  approved: "default",
  posted: "secondary",
  rejected: "destructive",
}

export default async function TeacherTransferPage() {
  const connected = await backboneConnected()
  const d = await getTransferDashboard()
  const list = await getTransferList()
  const toOrg = list[0]?.to_org ?? "33030004181"
  const fromOrg = list[0]?.from_org ?? "33040006271"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Teacher Transfer &amp; Posting</PageHeaderHeading>
        <PageHeaderDescription>
          Teacher transfer requests decided through a real workflow (requested → approved → posted, or rejected). A
          teacher may hold <strong>only one active request</strong>, and the backbone enforces a{" "}
          <strong>cross-module vacancy gate</strong>: a transfer can only be approved into a destination school that
          has a <strong>sanctioned vacancy in the teacher&rsquo;s cadre</strong> — checked live against the
          Establishment register. Every button performs a real, persisted, audited operation.
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
            <Stat label="Requests" value={d.total} />
            <Stat label="Posted" value={d.posted} />
            <Stat label="Pending" value={d.pending_work?.length ?? 0} />
            <div className="rounded-lg border p-4 sm:col-span-2">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">vacancy-gated · establishment-linked · durable</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Transfer requests (by destination)</CardTitle>
              <CardDescription>{list.length} request(s) in scope.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {list.length === 0 ? (
                <p className="text-sm text-muted-foreground">No transfer requests.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-1 pr-3 font-medium">Id</th>
                      <th className="py-1 pr-3 font-medium">Employee</th>
                      <th className="py-1 pr-3 font-medium">Cadre</th>
                      <th className="py-1 pr-3 font-medium">From → To</th>
                      <th className="py-1 pr-3 font-medium">Reason</th>
                      <th className="py-1 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.sort((a, b) => a.id.localeCompare(b.id)).map((t) => (
                      <tr key={t.id} className="border-t">
                        <td className="py-1 pr-3 font-mono whitespace-nowrap">{t.id}</td>
                        <td className="py-1 pr-3 font-mono">{t.employee_id}</td>
                        <td className="py-1 pr-3">{t.cadre}</td>
                        <td className="py-1 pr-3 font-mono whitespace-nowrap">{t.from_org} → {t.to_org}</td>
                        <td className="py-1 pr-3">{t.reason}</td>
                        <td className="py-1">
                          <Badge variant={STATUS_VARIANT[t.status] ?? "outline"}>{t.status}</Badge>
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
                <CardTitle className="text-base">Request a transfer</CardTitle>
                <CardDescription>Raise a new transfer request for a teacher.</CardDescription>
              </CardHeader>
              <CardContent>
                <RequestTransferForm toOrg={toOrg} fromOrg={fromOrg} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Decide</CardTitle>
                <CardDescription>Approve (vacancy-gated), post, or reject a request.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ApproveTransferForm />
                <div className="border-t pt-4">
                  <PostTransferForm />
                </div>
                <div className="border-t pt-4">
                  <RejectTransferForm />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

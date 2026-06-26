import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getBonafideDashboard, getBonafideList, backboneConnected } from "./actions"
import { RequestBonafideForm, IssueBonafideForm, RevokeBonafideForm } from "./bonafide-register-client"

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
  issued: "default",
  revoked: "destructive",
}

export default async function BonafideRegisterPage() {
  const connected = await backboneConnected()
  const d = await getBonafideDashboard()
  const list = await getBonafideList()
  const org = list[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Bonafide Certificate Register</PageHeaderHeading>
        <PageHeaderDescription>
          A durable, serial-numbered register for study / bonafide certificates. The backbone enforces a{" "}
          <strong>cross-module rule</strong>: a certificate <strong>cannot be issued for a student who has an active
          transfer certificate</strong> (they are no longer on rolls here) — this register reads the live TC module.
          Each issued certificate is stamped with a <strong>monotonic per-school serial</strong>. Every button
          performs a real, persisted, audited operation.
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
            <Stat label="Certificates" value={d.total} />
            <Stat label="Issued" value={d.issued} />
            <Stat label="Pending" value={d.pending_work?.length ?? 0} />
            <div className="rounded-lg border p-4 sm:col-span-2">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">TC-gated · serial register · durable</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Register</CardTitle>
              <CardDescription>{list.length} certificate(s) in scope.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {list.length === 0 ? (
                <p className="text-sm text-muted-foreground">No certificates recorded.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-1 pr-3 font-medium">Id</th>
                      <th className="py-1 pr-3 font-medium">Student</th>
                      <th className="py-1 pr-3 font-medium">Purpose</th>
                      <th className="py-1 pr-3 font-medium">Serial</th>
                      <th className="py-1 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.sort((a, b) => a.id.localeCompare(b.id)).map((b) => (
                      <tr key={b.id} className="border-t">
                        <td className="py-1 pr-3 font-mono whitespace-nowrap">{b.id}</td>
                        <td className="py-1 pr-3 font-mono">{b.student_id}</td>
                        <td className="py-1 pr-3">{b.purpose}</td>
                        <td className="py-1 pr-3 font-mono text-muted-foreground">{b.serial || "—"}</td>
                        <td className="py-1">
                          <Badge variant={STATUS_VARIANT[b.status] ?? "outline"}>{b.status}</Badge>
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
                <CardTitle className="text-base">Request a certificate</CardTitle>
                <CardDescription>Raise a new bonafide request for a student.</CardDescription>
              </CardHeader>
              <CardContent>
                <RequestBonafideForm org={org} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Issue &amp; revoke</CardTitle>
                <CardDescription>Issue stamps a serial (blocked if the student has an active TC); revoke voids an issued certificate.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <IssueBonafideForm />
                <div className="border-t pt-4">
                  <RevokeBonafideForm />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

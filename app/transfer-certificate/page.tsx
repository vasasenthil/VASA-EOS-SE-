import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { getTCDashboard, backboneConnected } from "./actions"
import { RequestTCForm, TCActions } from "./transfer-certificate-client"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function TransferCertificatePage() {
  const connected = await backboneConnected()
  const d = await getTCDashboard()
  const pending = d?.pending ?? []
  const org = pending[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Transfer Certificates</PageHeaderHeading>
        <PageHeaderDescription>
          Raise, issue and cancel Transfer Certificates for leaving students against the durable backbone. A
          student can hold at most <strong>one active TC</strong> at a school at a time — the no-duplicate invariant
          is enforced server-side. Lifecycle: requested → issued (with a serial number) → cancelled if raised in
          error. Every button performs a real, persisted, audited operation.
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
            Raise / Issue / Cancel button performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Total TCs" value={d.total} />
            <Stat label="Issued" value={d.issued} />
            <Stat label="Pending" value={d.by_status["requested"] ?? 0} />
            <Stat label="Cancelled" value={d.by_status["cancelled"] ?? 0} />
            <div className="rounded-lg border p-4 sm:col-span-2">
              <div className="flex flex-wrap gap-1">
                {Object.entries(d.by_reason).map(([r, n]) => (
                  <Badge key={r} variant="outline" className="capitalize">{r} {n}</Badge>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">live · {d.scope} · durable · audited</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pending TCs (awaiting issue)</CardTitle>
              <CardDescription>
                {pending.length} requested certificate(s). Issue with a serial number, or cancel if raised in error.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pending.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending TCs.</p>
              ) : (
                <ul className="divide-y">
                  {pending.map((t) => (
                    <li key={t.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {t.student_id} <Badge variant="outline" className="ml-1 capitalize">{t.reason}</Badge>
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">{t.id} · {t.org_unit} · requested {t.requested_on}</p>
                      </div>
                      <TCActions id={t.id} status={t.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Raise a Transfer Certificate</CardTitle>
              <CardDescription>Opens a TC (status requested) for a leaving student.</CardDescription>
            </CardHeader>
            <CardContent>
              <RequestTCForm org={org} />
            </CardContent>
          </Card>
        </div>
      )}
    </Shell>
  )
}

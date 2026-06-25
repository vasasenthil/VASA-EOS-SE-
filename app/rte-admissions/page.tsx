import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getAdmissionDashboard, backboneConnected } from "./actions"
import { ApplyForm, FinaliseButtons } from "./rte-admissions-client"

export const dynamic = "force-dynamic"

const STAGE_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  admitted: "default",
  "pending-approval": "secondary",
  denied: "destructive",
  residency: "destructive",
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function RteAdmissionsPage() {
  const connected = await backboneConnected()
  const d = await getAdmissionDashboard()
  const pending = (d?.applications ?? []).filter((a) => a.stage === "pending-approval")

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>RTE Admissions &amp; Enrolment</PageHeaderHeading>
        <PageHeaderDescription>
          Process admissions against the durable backbone. RTE rules are policy-as-code (OPA/Rego): rejecting an
          EWS/DG applicant while the 25% quota is unmet is held for BEO/DEO review (RTE §12(1)(c)) — a real
          human-in-the-loop approval, persisted and audited. Every button performs a real operation.
        </PageHeaderDescription>
      </PageHeader>

      {!d ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Backbone not connected</AlertTitle>
          <AlertDescription>
            This module drives the durable Go backbone (platformd + PostgreSQL + OPA). Run the full stack and set{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">PLATFORM_URL</code> (e.g.{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">deploy/pilot/run-local.sh</code>), then every
            button below performs a real, persisted, policy-checked operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {!connected && <DemoDataNote />}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Applications" value={d.total} />
            <Stat label="Admitted" value={d.admitted} />
            <Stat label="Pending review" value={d.pending_review} />
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">By category</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {Object.entries(d.by_category).map(([k, v]) => `${k}:${v}`).join(" · ") || "—"}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.tenant}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">durable backbone</p>
            </div>
          </section>

          {/* the HITL approval inbox — the multi-level review showcase */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pending BEO/DEO review (HITL)</CardTitle>
              <CardDescription>{pending.length} application(s) held under RTE §12(1)(c) awaiting an officer decision.</CardDescription>
            </CardHeader>
            <CardContent>
              {pending.length === 0 ? (
                <p className="text-sm text-muted-foreground">No applications awaiting review.</p>
              ) : (
                <ul className="divide-y">
                  {pending.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 py-3">
                      <div>
                        <p className="text-sm font-medium">{a.id} · {a.category} · age {a.age}</p>
                        <p className="text-xs text-muted-foreground">
                          requested <strong>{a.decision}</strong> · {a.reasons || "RTE-EWS-QUOTA"} · request {a.request_id}
                        </p>
                      </div>
                      {a.request_id ? <FinaliseButtons requestId={a.request_id} /> : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Process an application</CardTitle>
                <CardDescription>Admit or reject a child — RTE policy is enforced on the backbone.</CardDescription>
              </CardHeader>
              <CardContent>
                <ApplyForm />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Register</CardTitle>
                <CardDescription>All persisted applications, by stage.</CardDescription>
              </CardHeader>
              <CardContent>
                {d.applications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No applications yet.</p>
                ) : (
                  <ul className="divide-y">
                    {d.applications.slice(0, 12).map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-2 py-2">
                        <span className="text-sm">{a.id} · {a.category}</span>
                        <Badge variant={STAGE_VARIANT[a.stage] ?? "secondary"}>{a.stage}</Badge>
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

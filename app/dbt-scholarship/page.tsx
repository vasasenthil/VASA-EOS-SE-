import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getDbtDashboard, getDisbursements, backboneConnected } from "./actions"
import { FileForm, SanctionButtons, DisburseButton, ReconcileButtons } from "./dbt-scholarship-client"

export const dynamic = "force-dynamic"

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  sanctioned: "outline",
  disbursed: "default",
  reconciled: "default",
  flagged: "destructive",
  rejected: "destructive",
}

const inr = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function DbtScholarshipPage() {
  const connected = await backboneConnected()
  const d = await getDbtDashboard()
  const all = await getDisbursements()
  const pending = all.filter((c) => c.status === "pending")
  const sanctioned = all.filter((c) => c.status === "sanctioned")
  const disbursed = all.filter((c) => c.status === "disbursed")

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Scholarship / DBT</PageHeaderHeading>
        <PageHeaderDescription>
          File scholarship disbursements and walk them through an amount-driven sanction chain (PFMS/GFR:
          HEAD_TEACHER · BEO, +DEO over ₹50k, +directorate over ₹2L), disburse with a payment reference, and
          reconcile against the rail — an unmatched payment is flagged as leakage. Money is in paise; every
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
            File / Sanction / Disburse / Reconcile button performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {!connected && <DemoDataNote />}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Cases" value={d.total} />
            <Stat label="Pending sanction" value={d.pending_sanction} />
            <Stat label="Disbursed" value={`₹${d.disbursed_rupees.toLocaleString("en-IN")}`} />
            <Stat label="Leakage flags" value={d.flagged_leakage} />
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">By status</p>
              <p className="mt-1 text-xs text-muted-foreground">{Object.entries(d.by_status).map(([k, v]) => `${k}:${v}`).join(" · ") || "—"}</p>
            </div>
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">durable · audited</p>
            </div>
          </section>

          {/* the DBT pipeline: pending sanction → sanctioned (disburse) → disbursed (reconcile) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pending sanction (approval chain)</CardTitle>
              <CardDescription>{pending.length} disbursement(s) moving through the tiered sanction chain.</CardDescription>
            </CardHeader>
            <CardContent>
              {pending.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing pending sanction.</p>
              ) : (
                <ul className="divide-y">
                  {pending.map((c) => {
                    const tierRole = c.approval_chain[c.current_step]?.role ?? "officer"
                    return (
                      <li key={c.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium">{c.student_id} · {c.scheme} · {inr(c.amount_paise)}</p>
                          <p className="mt-1 flex flex-wrap items-center gap-1 text-xs">
                            {c.approval_chain.map((s, i) => (
                              <span key={i} className={`rounded px-1.5 py-0.5 ${i === c.current_step ? "bg-primary text-primary-foreground" : s.decision === "approved" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                                {s.role}{s.decision === "approved" ? " ✓" : ""}
                              </span>
                            ))}
                          </p>
                        </div>
                        <SanctionButtons caseId={c.id} role={tierRole} />
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
                <CardTitle className="text-base">Ready to disburse</CardTitle>
                <CardDescription>{sanctioned.length} sanctioned case(s).</CardDescription>
              </CardHeader>
              <CardContent>
                {sanctioned.length === 0 ? <p className="text-sm text-muted-foreground">None.</p> : (
                  <ul className="divide-y">
                    {sanctioned.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-2 py-2">
                        <span className="text-sm">{c.student_id} · {inr(c.amount_paise)}</span>
                        <DisburseButton caseId={c.id} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Disbursed — reconcile vs rail</CardTitle>
                <CardDescription>{disbursed.length} awaiting reconciliation.</CardDescription>
              </CardHeader>
              <CardContent>
                {disbursed.length === 0 ? <p className="text-sm text-muted-foreground">None.</p> : (
                  <ul className="divide-y">
                    {disbursed.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-2 py-2">
                        <span className="text-sm">{c.student_id} · {inr(c.amount_paise)} · ref {c.payment_ref}</span>
                        <ReconcileButtons caseId={c.id} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">File a disbursement</CardTitle>
              <CardDescription>The amount sizes the sanction chain.</CardDescription>
            </CardHeader>
            <CardContent>
              <FileForm />
            </CardContent>
          </Card>
        </div>
      )}
    </Shell>
  )
}

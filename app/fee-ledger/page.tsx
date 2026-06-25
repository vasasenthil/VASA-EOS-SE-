import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getFeeDashboard, backboneConnected } from "./actions"
import { RaiseDemandForm, CollectPaymentForm, WaiveButton } from "./fee-ledger-client"

export const dynamic = "force-dynamic" // always read live from the durable backbone

const inr = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function FeeLedgerPage() {
  const connected = await backboneConnected()
  const d = await getFeeDashboard()

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Fee &amp; Finance Ledger</PageHeaderHeading>
        <PageHeaderDescription>
          Raise fee demands, collect payments and grant waivers against the durable backbone. Money is in paise;
          the no-overpayment invariant (a payment can never take the collected total above the amount demanded)
          is enforced server-side in PostgreSQL and audited — every button here performs a real, persisted
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
            Raise / Collect / Waive button below performs a real persisted operation. In demo mode (no backbone)
            the writes are intentionally inert.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {!connected && <DemoDataNote />}
          {/* realtime collection summary (paise → rupees) */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Demands" value={d.demands} />
            <Stat label="Demanded" value={inr(d.demanded_paise)} />
            <Stat label="Collected" value={inr(d.collected_paise)} />
            <Stat label="Outstanding" value={inr(d.outstanding_paise)} />
            <Stat label="Collection %" value={`${d.collection_pct.toFixed(1)}%`} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">durable backbone</p>
            </div>
          </section>

          {/* defaulter roster (open demands past due) with a working Waive */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Defaulters (open demands past due)</CardTitle>
              <CardDescription>{(d.defaulters ?? []).length} students with overdue balances as of {d.as_of}.</CardDescription>
            </CardHeader>
            <CardContent>
              {(d.defaulters ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No defaulters — all demands are current.</p>
              ) : (
                <ul className="divide-y">
                  {(d.defaulters ?? []).map((f) => (
                    <li key={f.demand_id} className="flex items-center justify-between gap-2 py-2">
                      <div>
                        <p className="text-sm font-medium">{f.student_id} · {f.category}</p>
                        <p className="font-mono text-xs text-muted-foreground">{f.demand_id} · due {f.due_on}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-destructive">{inr(f.outstanding_paise)}</span>
                        <WaiveButton demandId={f.demand_id} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* working write forms */}
          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Collect a payment</CardTitle>
                <CardDescription>
                  Collects against an open demand. Try paying more than the outstanding balance — the backbone
                  rejects it with the exact remaining-vs-tendered figures (the no-overpayment guard).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CollectPaymentForm
                  demands={(d.defaulters ?? []).map((f) => ({ id: f.demand_id, label: `${f.demand_id} — ${f.student_id} (${inr(f.outstanding_paise)} due)` }))}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Raise a fee demand</CardTitle>
                <CardDescription>Creates a demand against a student (exam / hostel / special fee).</CardDescription>
              </CardHeader>
              <CardContent>
                <RaiseDemandForm />
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

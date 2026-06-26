import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getGovernmentOrderDashboard, getGovernmentOrders, backboneConnected } from "./actions"
import { DraftGOForm, AdvanceGOForm, WithdrawGOForm } from "./go-client"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  published: "default",
  issued: "secondary",
  approved: "outline",
  vetted: "outline",
  drafted: "outline",
  withdrawn: "destructive",
}

export default async function GovernmentOrderPage() {
  const connected = await backboneConnected()
  const d = await getGovernmentOrderDashboard()
  const orders = await getGovernmentOrders()
  const org = orders[0]?.org_unit ?? "33030004181"
  const financialValue = d ? (d.financial_value_paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 }) : "0"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Government Orders (GO) — State Secretariat</PageHeaderHeading>
        <PageHeaderDescription>
          Every TN scheme, sanction, posting and policy is enacted through a numbered Government Order. The
          backbone runs the GO lifecycle as a multi-tier approval workflow and enforces three hard rules: a GO
          advances <strong>drafted → vetted → approved → issued → published one step at a time</strong> (no stage
          skipped), it <strong>cannot be issued without a unique gazette number</strong> (no duplicate live
          numbers), and a <strong>withdrawn order is terminal</strong>. Issuing a financial GO is gated by
          Policy-as-Code (PFMS sanction-first). Every button performs a real, persisted, audited operation.
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
            <Stat label="Orders" value={d.orders} />
            <Stat label="Published" value={d.by_status?.published ?? 0} />
            <Stat label="In-flight" value={d.in_flight?.length ?? 0} />
            <Stat label="Financial ₹" value={financialValue} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">linear · unique-number · terminal-withdrawal</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Government Orders</CardTitle>
              <CardDescription>{orders.length} order(s) in scope.</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders.</p>
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => (
                    <div key={o.id} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs">{o.id}</span>
                        {o.number && <Badge variant="secondary" className="font-mono">{o.number}</Badge>}
                        <Badge variant="outline">{o.category}</Badge>
                        <Badge variant={STATUS_VARIANT[o.status] ?? "outline"}>{o.status}</Badge>
                        {o.amount_paise > 0 && <Badge variant="outline">₹{(o.amount_paise / 100).toLocaleString("en-IN")}</Badge>}
                      </div>
                      <p className="mt-1 text-sm">{o.subject}</p>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                        <span>{o.department}</span>
                        {o.vetted_by && <span>· vetted {o.vetted_by}</span>}
                        {o.approved_by && <span>· approved {o.approved_by}</span>}
                        {o.reason && <span>· withdrawn: {o.reason}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Draft a Government Order</CardTitle>
                <CardDescription>Open a new draft; the secretariat then vets, approves, issues and publishes it.</CardDescription>
              </CardHeader>
              <CardContent>
                <DraftGOForm org={org} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Advance · withdraw</CardTitle>
                <CardDescription>Move a GO one stage forward, or rescind it with a reason.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <AdvanceGOForm />
                <div className="border-t pt-4">
                  <WithdrawGOForm />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

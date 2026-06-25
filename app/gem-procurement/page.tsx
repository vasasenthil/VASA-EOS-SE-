import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getProcurementDashboard, getPurchaseOrders, backboneConnected } from "./actions"
import { CreatePOForm, ReceiveForm, PayForm, ClosePOForm } from "./gem-client"

export const dynamic = "force-dynamic"

const inr = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function GemProcurementPage() {
  const connected = await backboneConnected()
  const d = await getProcurementDashboard()
  const pos = await getPurchaseOrders()
  const org = pos[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Procurement &amp; GeM Purchase Orders</PageHeaderHeading>
        <PageHeaderDescription>
          School procurement via the Government e-Marketplace (GeM). The backbone enforces two{" "}
          <strong>GFR controls</strong> (money in paise): goods received can <strong>never exceed the ordered
          quantity</strong> (no over-receipt), and payment can <strong>never exceed the value of goods actually
          received</strong> (no paying for undelivered goods). Every button performs a real, persisted, audited
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
            control performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {!connected && <DemoDataNote />}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Purchase orders" value={d.pos} />
            <Stat label="Ordered value" value={inr(d.ordered_value_paise)} />
            <Stat label="Received value" value={inr(d.received_value_paise)} />
            <Stat label="Paid" value={inr(d.paid_paise)} />
            <Stat label="Outstanding" value={inr(d.outstanding_paise)} />
          </section>
          <div className="rounded-lg border p-3">
            <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
            <span className="ml-2 text-xs text-muted-foreground">GFR-gated · no over-receipt · no over-payment · durable</span>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Purchase orders</CardTitle>
              <CardDescription>{pos.length} PO(s) in scope. Outstanding = received value − paid.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {pos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No purchase orders.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-1 pr-3 font-medium">Id</th>
                      <th className="py-1 pr-3 font-medium">Item</th>
                      <th className="py-1 pr-3 font-medium">Vendor</th>
                      <th className="py-1 pr-3 font-medium">Received</th>
                      <th className="py-1 pr-3 font-medium">Paid / Received-value</th>
                      <th className="py-1 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pos.sort((a, b) => a.id.localeCompare(b.id)).map((po) => {
                      const recVal = po.received_qty * po.unit_price_paise
                      return (
                        <tr key={po.id} className="border-t">
                          <td className="py-1 pr-3 font-mono whitespace-nowrap">{po.id}</td>
                          <td className="py-1 pr-3">{po.item}</td>
                          <td className="py-1 pr-3 font-mono">{po.vendor}</td>
                          <td className="py-1 pr-3 tabular-nums">{po.received_qty}/{po.ordered_qty}</td>
                          <td className="py-1 pr-3 tabular-nums">{inr(po.paid_paise)} / {inr(recVal)}</td>
                          <td className="py-1">
                            <Badge variant={po.status === "closed" ? "secondary" : "default"}>{po.status}</Badge>
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
                <CardTitle className="text-base">Raise a purchase order</CardTitle>
                <CardDescription>Create a new GeM PO with quantity and unit price.</CardDescription>
              </CardHeader>
              <CardContent>
                <CreatePOForm org={org} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Receive · pay · close</CardTitle>
                <CardDescription>Receive (no over-receipt), pay (no over-payment beyond goods received), close.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ReceiveForm />
                <div className="border-t pt-4">
                  <PayForm />
                </div>
                <div className="border-t pt-4">
                  <ClosePOForm />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

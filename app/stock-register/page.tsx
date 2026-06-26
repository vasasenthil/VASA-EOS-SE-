import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getInventoryDashboard, getStockItems, backboneConnected } from "./actions"
import { AddItemForm, ReceiveStockForm, IssueStockForm, CloseItemForm } from "./stock-client"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function StockRegisterPage() {
  const connected = await backboneConnected()
  const d = await getInventoryDashboard()
  const items = await getStockItems()
  const org = items[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Stores &amp; Inventory Register</PageHeaderHeading>
        <PageHeaderDescription>
          The school stock register for consumables and materials (stationery, lab, sports, MDM provisions). The
          backbone maintains a running on-hand balance and enforces two hard rules: an issue can{" "}
          <strong>never exceed the quantity on hand</strong> (no negative stock), and an item can only be{" "}
          <strong>retired at a zero balance</strong>. Items at or below their reorder level surface as a low-stock
          worklist. Every button performs a real, persisted, audited operation.
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
            <Stat label="Items" value={d.items} />
            <Stat label="On hand" value={d.on_hand} />
            <Stat label="Received (cum.)" value={d.received} />
            <Stat label="Issued (cum.)" value={d.issued} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">no-negative-stock · reorder-gated · durable</p>
            </div>
          </section>

          {(d.low_stock?.length ?? 0) > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{d.low_stock!.length} item(s) at or below reorder level</AlertTitle>
              <AlertDescription>
                {d.low_stock!.map((it) => `${it.name} (${it.on_hand}/${it.reorder_level})`).join(" · ")}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Stock register</CardTitle>
              <CardDescription>{items.length} item(s) in scope. Rows at/below reorder level are flagged.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No stock items.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-1 pr-3 font-medium">Id</th>
                      <th className="py-1 pr-3 font-medium">Item</th>
                      <th className="py-1 pr-3 font-medium">Unit</th>
                      <th className="py-1 pr-3 font-medium">On hand</th>
                      <th className="py-1 pr-3 font-medium">Reorder</th>
                      <th className="py-1 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.sort((a, b) => a.id.localeCompare(b.id)).map((it) => {
                      const low = it.status === "active" && it.on_hand <= it.reorder_level
                      return (
                        <tr key={it.id} className="border-t">
                          <td className="py-1 pr-3 font-mono whitespace-nowrap">{it.id}</td>
                          <td className="py-1 pr-3">{it.name}</td>
                          <td className="py-1 pr-3">{it.unit}</td>
                          <td className="py-1 pr-3 tabular-nums">
                            {it.on_hand}{" "}
                            {low && <Badge variant="destructive">low</Badge>}
                          </td>
                          <td className="py-1 pr-3 tabular-nums">{it.reorder_level}</td>
                          <td className="py-1">
                            <Badge variant={it.status === "active" ? "default" : "secondary"}>{it.status}</Badge>
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
                <CardTitle className="text-base">Add an item</CardTitle>
                <CardDescription>Open a new stock line with opening balance and reorder level.</CardDescription>
              </CardHeader>
              <CardContent>
                <AddItemForm org={org} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Receive · issue · close</CardTitle>
                <CardDescription>Issue is blocked beyond on-hand; close needs a zero balance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ReceiveStockForm />
                <div className="border-t pt-4">
                  <IssueStockForm />
                </div>
                <div className="border-t pt-4">
                  <CloseItemForm />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

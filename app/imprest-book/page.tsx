import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getImprestDashboard, getImprestBooks, backboneConnected } from "./actions"
import { OpenImprestForm, SpendForm, ReplenishForm, SettleForm } from "./imprest-client"

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

export default async function ImprestBookPage() {
  const connected = await backboneConnected()
  const d = await getImprestDashboard()
  const books = await getImprestBooks()
  const org = books[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Petty Cash / Imprest Book</PageHeaderHeading>
        <PageHeaderDescription>
          The school petty-cash float under GFR (money in paise). The backbone enforces three hard rules: a voucher
          can <strong>never exceed the cash on hand</strong> (no negative cash), a replenishment can{" "}
          <strong>never push cash above the sanctioned float</strong> (you reimburse only what was spent), and a
          book can only be <strong>settled when cash equals the sanctioned float</strong> — every rupee reconciled.
          Every button performs a real, persisted, audited operation.
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
            <Stat label="Books" value={d.books} />
            <Stat label="Sanctioned float" value={inr(d.sanctioned_paise)} />
            <Stat label="Cash on hand" value={inr(d.cash_paise)} />
            <Stat label="Unreimbursed" value={inr(d.unreimbursed_paise)} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">no-overspend · imprest-ceiling · settle-gate</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Imprest books</CardTitle>
              <CardDescription>{books.length} book(s) in scope. Unreimbursed = sanctioned − cash on hand.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {books.length === 0 ? (
                <p className="text-sm text-muted-foreground">No imprest books.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-1 pr-3 font-medium">Id</th>
                      <th className="py-1 pr-3 font-medium">Sanctioned</th>
                      <th className="py-1 pr-3 font-medium">Cash on hand</th>
                      <th className="py-1 pr-3 font-medium">Vouchers</th>
                      <th className="py-1 pr-3 font-medium">Unreimbursed</th>
                      <th className="py-1 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.sort((a, b) => a.id.localeCompare(b.id)).map((b) => {
                      const unreimbursed = b.sanctioned_paise - b.cash_paise
                      return (
                        <tr key={b.id} className="border-t">
                          <td className="py-1 pr-3 font-mono whitespace-nowrap">{b.id}</td>
                          <td className="py-1 pr-3 tabular-nums">{inr(b.sanctioned_paise)}</td>
                          <td className="py-1 pr-3 tabular-nums">{inr(b.cash_paise)}</td>
                          <td className="py-1 pr-3 tabular-nums">{b.vouchers?.length ?? 0}</td>
                          <td className="py-1 pr-3 tabular-nums">
                            {inr(unreimbursed)}{" "}
                            {unreimbursed > 0 && <Badge variant="destructive">due</Badge>}
                          </td>
                          <td className="py-1">
                            <Badge variant={b.status === "open" ? "default" : "secondary"}>{b.status}</Badge>
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
                <CardTitle className="text-base">Open a float · book a voucher</CardTitle>
                <CardDescription>Open an imprest float, then book contingent-expense vouchers against it.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <OpenImprestForm org={org} />
                <div className="border-t pt-4">
                  <SpendForm />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Replenish · settle</CardTitle>
                <CardDescription>Replenish up to the float; settle only when the book balances.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ReplenishForm />
                <div className="border-t pt-4">
                  <SettleForm />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

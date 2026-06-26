import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getLibraryFineDashboard, getFineLedgers, backboneConnected } from "./actions"
import { OpenLedgerForm, AccrueForm, PayForm, WaiveForm, BorrowForm } from "./fines-client"

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

function outstandingOf(fines?: { amount_paise: number; paid_paise: number; status: string }[]): number {
  return (fines ?? []).filter((f) => f.status === "open").reduce((s, f) => s + (f.amount_paise - f.paid_paise), 0)
}

export default async function LibraryFinesPage() {
  const connected = await backboneConnected()
  const d = await getLibraryFineDashboard()
  const ledgers = await getFineLedgers()
  const org = ledgers[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Library Fine Ledger</PageHeaderHeading>
        <PageHeaderDescription>
          Overdue-fine ledgers per library member (money in paise). The backbone enforces three hard rules: a
          payment can <strong>never exceed a fine&rsquo;s outstanding amount</strong> (no overpay), a fine already
          paid or waived <strong>cannot be re-settled</strong>, and a member whose dues exceed the{" "}
          <strong>block threshold is barred from borrowing</strong> until they clear up. Every button performs a
          real, persisted, audited operation.
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
            <Stat label="Ledgers" value={d.ledgers} />
            <Stat label="Outstanding" value={inr(d.outstanding_paise)} />
            <Stat label="Collected" value={inr(d.collected_paise)} />
            <Stat label="Blocked members" value={d.blocked} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">no-overpay · no-re-settle · borrow-block</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Member ledgers</CardTitle>
              <CardDescription>{ledgers.length} ledger(s) in scope. Blocked = outstanding above the threshold.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {ledgers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No fine ledgers.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-1 pr-3 font-medium">Ledger</th>
                      <th className="py-1 pr-3 font-medium">Member</th>
                      <th className="py-1 pr-3 font-medium">Fines</th>
                      <th className="py-1 pr-3 font-medium">Outstanding / Threshold</th>
                      <th className="py-1 font-medium">Borrow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgers.sort((a, b) => a.id.localeCompare(b.id)).map((m) => {
                      const outstanding = outstandingOf(m.fines)
                      const blocked = outstanding > m.block_threshold_paise
                      return (
                        <tr key={m.id} className="border-t">
                          <td className="py-1 pr-3 font-mono whitespace-nowrap">{m.id}</td>
                          <td className="py-1 pr-3 font-mono">{m.member_id}</td>
                          <td className="py-1 pr-3 tabular-nums">{m.fines?.length ?? 0}</td>
                          <td className="py-1 pr-3 tabular-nums">{inr(outstanding)} / {inr(m.block_threshold_paise)}</td>
                          <td className="py-1">
                            <Badge variant={blocked ? "destructive" : "default"}>{blocked ? "blocked" : "eligible"}</Badge>
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
                <CardTitle className="text-base">Open ledger · accrue · borrow</CardTitle>
                <CardDescription>Open a member ledger, accrue an overdue fine, or test the borrow-block gate.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <OpenLedgerForm org={org} />
                <div className="border-t pt-4">
                  <AccrueForm />
                </div>
                <div className="border-t pt-4">
                  <BorrowForm />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pay · waive</CardTitle>
                <CardDescription>Collect a fine (no overpay) or waive it; either clears the dues.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <PayForm />
                <div className="border-t pt-4">
                  <WaiveForm />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

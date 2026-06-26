import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getSavingsDashboard, getSavingsAccounts, backboneConnected } from "./actions"
import { OpenAccountForm, DepositForm, WithdrawForm, FreezeForm, CloseAccountForm } from "./savings-client"

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

export default async function StudentSavingsPage() {
  const connected = await backboneConnected()
  const d = await getSavingsDashboard()
  const accounts = await getSavingsAccounts()
  const org = accounts[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Bank / Student Savings</PageHeaderHeading>
        <PageHeaderDescription>
          A financial-literacy savings passbook for each student (money in paise). The backbone enforces three hard
          rules: a withdrawal can <strong>never exceed the balance</strong> (no negative balance), <strong>no
          transaction is allowed on a frozen or closed account</strong>, and an account can only be{" "}
          <strong>closed once its balance is zero</strong>. Every button performs a real, persisted, audited
          operation, and every deposit/withdrawal is recorded in the passbook ledger.
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
            <Stat label="Passbooks" value={d.accounts} />
            <Stat label="Total balance" value={inr(d.balance_paise)} />
            <Stat label="Deposits (cum.)" value={inr(d.deposits_paise)} />
            <Stat label="Frozen" value={d.frozen} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">no-negative · frozen-hold · zero-close</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Passbooks</CardTitle>
              <CardDescription>{accounts.length} account(s) in scope.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No savings accounts.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-1 pr-3 font-medium">Id</th>
                      <th className="py-1 pr-3 font-medium">Student</th>
                      <th className="py-1 pr-3 font-medium">Balance</th>
                      <th className="py-1 pr-3 font-medium">Txns</th>
                      <th className="py-1 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.sort((a, b) => a.id.localeCompare(b.id)).map((a) => (
                      <tr key={a.id} className="border-t">
                        <td className="py-1 pr-3 font-mono whitespace-nowrap">{a.id}</td>
                        <td className="py-1 pr-3 font-mono">{a.student_id}</td>
                        <td className="py-1 pr-3 tabular-nums">{inr(a.balance_paise)}</td>
                        <td className="py-1 pr-3 tabular-nums">{a.transactions?.length ?? 0}</td>
                        <td className="py-1">
                          <span className="inline-flex items-center gap-1">
                            <Badge variant={a.status === "active" ? "default" : "secondary"}>{a.status}</Badge>
                            {a.frozen && <Badge variant="destructive">frozen</Badge>}
                          </span>
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
                <CardTitle className="text-base">Open · deposit · withdraw</CardTitle>
                <CardDescription>Open a passbook, then record deposits and withdrawals (no overdraw).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <OpenAccountForm org={org} />
                <div className="border-t pt-4">
                  <DepositForm />
                </div>
                <div className="border-t pt-4">
                  <WithdrawForm />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Freeze · close</CardTitle>
                <CardDescription>Place a guardian hold, or close a zero-balance passbook.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <FreezeForm />
                <div className="border-t pt-4">
                  <CloseAccountForm />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

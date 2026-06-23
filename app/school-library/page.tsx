import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { getLibraryDashboard, backboneConnected } from "./actions"
import { IssueForm, LoanActions } from "./school-library-client"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function SchoolLibraryPage() {
  const connected = await backboneConnected()
  const d = await getLibraryDashboard()
  const overdue = d?.overdue_loans ?? []
  const org = overdue[0]?.org_unit ?? ""

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Library (circulation)</PageHeaderHeading>
        <PageHeaderDescription>
          Issue, return, renew and write off book copies against the durable backbone. A single physical copy can
          be on loan to at most one member at a time — the one-copy-one-borrower invariant is enforced
          server-side (a SQL existence check plus a partial unique index). Every button performs a real,
          persisted, audited operation.
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
            Issue / Return / Renew / Lost button performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Active loans" value={d.active_loans} />
            <Stat label="Overdue" value={d.overdue} />
            <Stat label="Lost" value={d.lost} />
            <Stat label="Members" value={d.members} />
            <Stat label="Titles" value={d.titles} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">durable · audited</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Overdue loans</CardTitle>
              <CardDescription>{overdue.length} copy(ies) past their due date as of {d.as_of}.</CardDescription>
            </CardHeader>
            <CardContent>
              {overdue.length === 0 ? (
                <p className="text-sm text-muted-foreground">No overdue loans.</p>
              ) : (
                <ul className="divide-y">
                  {overdue.map((l) => (
                    <li key={l.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium">{l.title || l.book_id}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {l.copy_id} · {l.member_id} · due {l.due_on}
                          {l.renewals > 0 && <span> · renewed {l.renewals}×</span>}
                        </p>
                      </div>
                      <LoanActions loanId={l.id} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Issue a copy</CardTitle>
              <CardDescription>Lends a physical copy to a member.</CardDescription>
            </CardHeader>
            <CardContent>
              <IssueForm org={org} />
            </CardContent>
          </Card>
        </div>
      )}
    </Shell>
  )
}

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getIndentDashboard, getIndents, backboneConnected } from "./actions"
import { RaiseIndentForm, ApproveForm, SupplyForm, RejectForm } from "./indent-client"

export const dynamic = "force-dynamic"

const STATUS_VARIANT: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
  raised: "outline",
  approved: "default",
  supplied: "secondary",
  rejected: "destructive",
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function TextbookIndentPage() {
  const connected = await backboneConnected()
  const d = await getIndentDashboard()
  const indents = await getIndents()
  const org = indents[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Textbook &amp; Uniform Indent</PageHeaderHeading>
        <PageHeaderDescription>
          Free-supply indents — a school requests free textbooks/uniforms against its{" "}
          <strong>sanctioned entitlement</strong> (from enrolment), a higher office approves a quantity, and the
          supply is delivered against the approval. The backbone enforces three hard rules: the indented quantity{" "}
          <strong>can never exceed the entitlement</strong>, the approved quantity <strong>can never exceed the
          indent</strong>, and cumulative supply <strong>can never exceed the approval</strong>. Every button
          performs a real, persisted, audited operation.
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
            <Stat label="Indents" value={d.indents} />
            <Stat label="Pending approval" value={d.by_status?.raised ?? 0} />
            <Stat label="Approved qty" value={d.approved_qty} />
            <Stat label="Supplied qty" value={d.supplied_qty} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">no-over-indent · approval-cap · no-over-supply</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Indents</CardTitle>
              <CardDescription>{indents.length} indent(s) in scope. The bar shows supply against the approval.</CardDescription>
            </CardHeader>
            <CardContent>
              {indents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No indents.</p>
              ) : (
                <div className="space-y-3">
                  {indents.sort((a, b) => a.id.localeCompare(b.id)).map((in_) => {
                    const pct = in_.approved_qty > 0 ? Math.round((in_.supplied_qty / in_.approved_qty) * 100) : 0
                    return (
                      <div key={in_.id} className="rounded-lg border p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs">{in_.id}</span>
                          <Badge variant="outline">{in_.item.replace(/_/g, " ")}</Badge>
                          <Badge variant={STATUS_VARIANT[in_.status] ?? "outline"}>{in_.status}</Badge>
                          <span className="text-xs text-muted-foreground">
                            indented {in_.indented_qty}/{in_.entitled_qty} · approved {in_.approved_qty}
                          </span>
                        </div>
                        {in_.approved_qty > 0 && (
                          <div className="mt-2 flex items-center gap-3">
                            <Progress value={pct} className="h-2 max-w-xs" />
                            <span className="text-xs tabular-nums text-muted-foreground">{in_.supplied_qty}/{in_.approved_qty} supplied</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Raise · supply</CardTitle>
                <CardDescription>Raise an indent against entitlement, then record supply against the approval.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <RaiseIndentForm org={org} />
                <div className="border-t pt-4">
                  <SupplyForm />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Approve · reject</CardTitle>
                <CardDescription>A higher office approves a quantity (≤ indent) or rejects the request.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ApproveForm />
                <div className="border-t pt-4">
                  <RejectForm />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

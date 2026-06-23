import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { getEntitlementDashboard, backboneConnected } from "./actions"
import { IssueForm, GrantForm } from "./free-supply-client"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function FreeSupplyPage() {
  const connected = await backboneConnected()
  const d = await getEntitlementDashboard()
  const shortfall = d?.shortfall ?? []

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Free-Supply Entitlement Distribution</PageHeaderHeading>
        <PageHeaderDescription>
          Grant and distribute free-supply entitlements (textbooks, uniforms, …) against the durable backbone. A
          student can never be issued more than their entitlement — the over-issue / leakage gate is enforced
          server-side, atomically with the pending → partial → fulfilled status. Every button performs a real,
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
            Grant / Issue button performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Students" value={d.students} />
            <Stat label="Items" value={d.items.length} />
            <Stat label="Shortfall" value={shortfall.length} />
            <div className="rounded-lg border p-4 sm:col-span-2 lg:col-span-2">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">durable · audited</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Fulfilment by item</CardTitle>
              <CardDescription>Entitled vs issued across the cohort.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {d.items.map((it) => (
                  <li key={it.item} className="flex items-center justify-between gap-2 py-2">
                    <div>
                      <p className="text-sm font-medium capitalize">{it.item}</p>
                      <p className="text-xs text-muted-foreground">issued {it.issued_qty}/{it.entitled_qty} · {it.fulfilled_students} fulfilled · {it.pending_students} pending</p>
                    </div>
                    <Badge variant={it.fulfilment_pct >= 90 ? "default" : it.fulfilment_pct >= 50 ? "secondary" : "destructive"}>
                      {it.fulfilment_pct.toFixed(0)}%
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Issue a distribution</CardTitle>
                <CardDescription>Distribute against an entitlement with a remaining balance.</CardDescription>
              </CardHeader>
              <CardContent>
                <IssueForm entitlements={shortfall.map((s) => ({ id: s.entitlement_id, label: `${s.student_id} · ${s.item} (${s.remaining} remaining)` }))} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Grant an entitlement</CardTitle>
                <CardDescription>Sets a student&apos;s entitled quantity for an item (the hard ceiling).</CardDescription>
              </CardHeader>
              <CardContent>
                <GrantForm />
              </CardContent>
            </Card>
          </section>

          {shortfall.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Shortfall worklist</CardTitle>
                <CardDescription>{shortfall.length} entitlement(s) not yet fulfilled.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y text-sm">
                  {shortfall.slice(0, 16).map((s) => (
                    <li key={s.entitlement_id} className="flex items-center justify-between gap-2 py-1.5">
                      <span>{s.student_id} · {s.item}</span>
                      <Badge variant="destructive">{s.remaining} short</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </Shell>
  )
}

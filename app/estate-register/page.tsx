import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getInfraDashboard, getAssetTickets, backboneConnected } from "./actions"
import { RegisterAssetForm, RaiseTicketForm, TicketActions, AssetActions } from "./estate-register-client"
import type { PlatformTicket } from "@/lib/platform-client"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

const SEV_VARIANT: Record<string, "destructive" | "secondary" | "outline"> = {
  critical: "destructive",
  high: "destructive",
  medium: "secondary",
  low: "outline",
}

function TicketRow({ t }: { t: PlatformTicket }) {
  return (
    <li className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm">
          <span className="font-mono text-xs">{t.id}</span> · {t.issue}
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          {t.status}
          {t.assignee && <span> · {t.assignee}</span>}
          {t.resolved_on && <span> · resolved {t.resolved_on}</span>} · raised {t.raised_on}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={SEV_VARIANT[t.severity] ?? "outline"} className="uppercase">{t.severity}</Badge>
        <TicketActions ticketId={t.id} status={t.status} />
      </div>
    </li>
  )
}

export default async function EstateRegisterPage() {
  const connected = await backboneConnected()
  const d = await getInfraDashboard()
  const needs = d?.needs_attention ?? []
  const org = needs[0]?.org_unit ?? ""

  // Per-asset ticket history for the needs-attention roster (live, durable).
  const ticketsByAsset = await Promise.all(needs.map((a) => getAssetTickets(a.id)))

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Estate &amp; Asset Register</PageHeaderHeading>
        <PageHeaderDescription>
          The durable infrastructure register: assets, condition grading, and the maintenance-ticket lifecycle
          (raise → assign → resolve → close) against the Go backbone. A <strong>critical</strong> ticket auto-flips
          its asset to <code>under_maintenance</code>; an asset can never be decommissioned or returned to service
          while it carries an open ticket — that invariant is enforced server-side. Every button performs a real,
          persisted, audited operation.
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
            Register / Raise / Assign / Resolve / Close / Decommission button performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {!connected && <DemoDataNote />}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Assets" value={d.assets} />
            <Stat label="Under maintenance" value={d.under_maintenance} />
            <Stat label="Decommissioned" value={d.decommissioned} />
            <Stat label="Open tickets" value={d.open_tickets} />
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">Condition</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {Object.entries(d.by_condition).map(([c, n]) => (
                  <Badge key={c} variant="outline" className="text-xs">{c} {n}</Badge>
                ))}
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">durable · audited</p>
            </div>
          </section>

          {Object.keys(d.open_by_severity).length > 0 && (
            <section className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Open backlog by severity:</span>
              {Object.entries(d.open_by_severity).map(([s, n]) => (
                <Badge key={s} variant={SEV_VARIANT[s] ?? "outline"} className="uppercase">{s} {n}</Badge>
              ))}
            </section>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Needs attention</CardTitle>
              <CardDescription>
                {needs.length} asset(s) unusable, under maintenance, or carrying a critical open ticket. Walk each
                ticket through its lifecycle, then return the asset to service or decommission it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {needs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No assets need attention.</p>
              ) : (
                <ul className="divide-y">
                  {needs.map((a, i) => {
                    const tickets = ticketsByAsset[i] ?? []
                    const hasOpen = tickets.some((t) => t.status === "open" || t.status === "in_progress")
                    return (
                      <li key={a.id} className="py-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium">{a.name}</p>
                            <p className="font-mono text-xs text-muted-foreground">
                              {a.id} · {a.category} · {a.condition} · {a.status}
                            </p>
                          </div>
                          <AssetActions assetId={a.id} status={a.status} hasOpenTicket={hasOpen} />
                        </div>
                        {tickets.length > 0 && (
                          <ul className="mt-2 divide-y rounded-md border bg-muted/30 px-3">
                            {tickets.map((t) => <TicketRow key={t.id} t={t} />)}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Register an asset</CardTitle>
                <CardDescription>Adds an asset to the estate register.</CardDescription>
              </CardHeader>
              <CardContent>
                <RegisterAssetForm org={org} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Raise a maintenance ticket</CardTitle>
                <CardDescription>Opens a ticket against an asset by id.</CardDescription>
              </CardHeader>
              <CardContent>
                <RaiseTicketForm org={org} assets={needs.map((a) => ({ id: a.id, name: a.name }))} />
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

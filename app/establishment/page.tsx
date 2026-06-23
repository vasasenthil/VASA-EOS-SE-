import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { getEstablishmentDashboard, getRoster, backboneConnected } from "./actions"
import { SanctionForm, AppointForm, VacateButton } from "./establishment-client"

export const dynamic = "force-dynamic" // always read live from the durable backbone

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function EstablishmentPage() {
  const connected = await backboneConnected()
  const d = await getEstablishmentDashboard()
  // pre-fetch every cadre's roster in parallel (server components can't render an async .map directly)
  const cadres = d?.strength ?? []
  const rosters = await Promise.all(cadres.map((c) => getRoster(c.establishment_id)))

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Staff Establishment &amp; Sanctioned Posts</PageHeaderHeading>
        <PageHeaderDescription>
          Sanction posts, appoint and vacate staff against the durable backbone. The over-appointment invariant
          (filled can never exceed sanctioned) is enforced server-side in PostgreSQL and audited — every button
          here performs a real, persisted operation.
        </PageHeaderDescription>
      </PageHeader>

      {!connected || !d ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Backbone not connected</AlertTitle>
          <AlertDescription>
            This module drives the durable Go backbone (platformd + PostgreSQL). Run the full stack and set{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">PLATFORM_URL</code> (e.g.{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">deploy/pilot/docker-compose.yml</code>), then
            every Add / Appoint / Vacate button below performs a real persisted operation. In demo mode (no
            backbone) the writes are intentionally inert.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {/* realtime, jurisdiction-scoped staffing summary */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Cadres" value={d.cadres} />
            <Stat label="Sanctioned" value={d.sanctioned} />
            <Stat label="Filled" value={d.filled} />
            <Stat label="Vacant" value={d.vacant} />
            <Stat label="Vacancy %" value={`${d.vacancy_pct.toFixed(1)}%`} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">durable backbone</p>
            </div>
          </section>

          {/* per-cadre strength + roster with working vacate */}
          <section className="space-y-3">
            {cadres.map((c, i) => {
              const filled = rosters[i].filter((a) => a.status === "filled")
              return (
                <Card key={c.establishment_id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between gap-2 text-base">
                      <span>{c.cadre}</span>
                      <span className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                        <Badge variant={c.vacant > 0 ? "destructive" : "default"}>
                          {c.filled}/{c.sanctioned} filled
                        </Badge>
                        {c.vacant > 0 && <span>{c.vacant} vacant</span>}
                      </span>
                    </CardTitle>
                    <CardDescription className="font-mono text-xs">{c.establishment_id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filled.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No staff appointed — all {c.sanctioned} posts vacant.</p>
                    ) : (
                      <ul className="divide-y">
                        {filled.map((a) => (
                          <li key={a.id} className="flex items-center justify-between gap-2 py-2">
                            <div>
                              <p className="text-sm font-medium">{a.name || a.employee_id}</p>
                              <p className="font-mono text-xs text-muted-foreground">{a.employee_id} · since {a.appointed_on}</p>
                            </div>
                            <VacateButton appointmentId={a.id} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </section>

          {/* the working write forms */}
          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Appoint staff</CardTitle>
                <CardDescription>
                  Fills a sanctioned post. Try appointing to a full cadre — the backbone rejects it with the exact
                  reason (the over-appointment guard), proving this is a real persisted operation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AppointForm cadres={(d.strength ?? []).map((c) => ({ id: c.establishment_id, label: `${c.cadre} (${c.filled}/${c.sanctioned})` }))} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sanction a new post line</CardTitle>
                <CardDescription>Creates a cadre with a sanctioned strength (the hard ceiling for appointments).</CardDescription>
              </CardHeader>
              <CardContent>
                <SanctionForm />
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

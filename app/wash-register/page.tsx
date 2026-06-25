import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getWashDashboard, getWashRegisters, backboneConnected } from "./actions"
import { RegisterWashForm, RecordFacilityForm, CertifySwachhForm } from "./wash-client"

export const dynamic = "force-dynamic"

const CRITICAL = new Set(["girls_toilet", "drinking_water", "handwash_station"])
const CAT_LABEL: Record<string, string> = {
  girls_toilet: "Girls' toilet",
  boys_toilet: "Boys' toilet",
  cwsn_toilet: "CWSN toilet",
  drinking_water: "Drinking water",
  handwash_station: "Handwash station",
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function lineStatus(sanctioned: number, functional: number): { label: string; variant: "default" | "secondary" | "destructive" } {
  if (functional <= 0) return { label: "non-functional", variant: "destructive" }
  if (functional >= sanctioned) return { label: "functional", variant: "default" }
  return { label: "partial", variant: "secondary" }
}

export default async function WashRegisterPage() {
  const connected = await backboneConnected()
  const d = await getWashDashboard()
  const registers = await getWashRegisters()
  const org = registers[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Sanitation &amp; WASH Register</PageHeaderHeading>
        <PageHeaderDescription>
          Every school&rsquo;s WASH (Water, Sanitation &amp; Hygiene) facilities — separate toilets for girls, boys
          and CWSN, drinking water and handwash stations. The backbone enforces two hard rules: functional units can{" "}
          <strong>never exceed sanctioned units</strong> (no over-report), and a school cannot be certified{" "}
          <strong>Swachh / ODF</strong> while any <strong>critical</strong> facility (girls&rsquo; toilet, drinking
          water, handwash) is not fully functional — recording a regression auto-revokes an existing certificate.
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
            <Stat label="Schools" value={d.schools} />
            <Stat label="Swachh certified" value={d.certified} />
            <Stat label="Facility units" value={`${d.functional_units}/${d.sanctioned_units}`} />
            <Stat label="Functional %" value={d.functional_pct.toFixed(0)} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">no-over-report · Swachh-gated · durable</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">WASH registers</CardTitle>
              <CardDescription>
                {registers.length} school(s) in scope. A school is Swachh-eligible only when every critical line
                (girls&rsquo; toilet, drinking water, handwash) is fully functional.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {registers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No WASH registers.</p>
              ) : (
                <div className="space-y-4">
                  {registers.sort((a, b) => a.id.localeCompare(b.id)).map((reg) => (
                    <div key={reg.id} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs">{reg.id}</span>
                        <span className="text-sm font-medium">{reg.school_name}</span>
                        {reg.certified ? (
                          <Badge>Swachh certified</Badge>
                        ) : (
                          <Badge variant="outline">not certified</Badge>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(reg.facilities ?? []).map((f) => {
                          const st = lineStatus(f.sanctioned_units, f.functional_units)
                          return (
                            <span key={f.category} className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs">
                              {CRITICAL.has(f.category) && <span aria-hidden title="critical" className="text-amber-600">★</span>}
                              {CAT_LABEL[f.category] ?? f.category}
                              <span className="tabular-nums text-muted-foreground">{f.functional_units}/{f.sanctioned_units}</span>
                              <Badge variant={st.variant} className="ml-1">{st.label}</Badge>
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Open a register · record an inspection</CardTitle>
                <CardDescription>Open a school WASH register, then record inspected facility lines.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <RegisterWashForm org={org} />
                <div className="border-t pt-4">
                  <RecordFacilityForm />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Certify Swachh</CardTitle>
                <CardDescription>Certification is blocked while any critical facility is not fully functional.</CardDescription>
              </CardHeader>
              <CardContent>
                <CertifySwachhForm />
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getMdmDashboard, backboneConnected } from "./actions"
import { ReceiveForm, ServeForm } from "./mid-day-meal-client"

export const dynamic = "force-dynamic"

const kg = (g: number) => `${(g / 1000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} kg`

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function MidDayMealPage() {
  const connected = await backboneConnected()
  const d = await getMdmDashboard()
  const rollup = d?.stock_rollup ?? []
  const schools = rollup.map((s) => s.org_unit)

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Mid-Day Meal (PM-POSHAN)</PageHeaderHeading>
        <PageHeaderDescription>
          Record foodgrain receipts and daily meal service against the durable backbone. Foodgrain stock can
          never go negative — a day&apos;s cooking can never draw more grain than is on hand (the leakage gate) —
          and meals served can never exceed enrolment. Every button performs a real, persisted, audited
          operation.
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
            Receive / Serve button performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {!connected && <DemoDataNote />}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Schools" value={d.schools} />
            <Stat label="Meal days" value={d.meal_days} />
            <Stat label="Meals served" value={d.meals_served} />
            <Stat label="Coverage %" value={`${d.coverage_pct.toFixed(1)}%`} />
            <Stat label="Grain consumed" value={kg(d.consumed_grams)} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">durable · audited</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Foodgrain stock by school</CardTitle>
              <CardDescription>{(d.low_stock_schools ?? []).length} school(s) low on stock (under 3 days of cover).</CardDescription>
            </CardHeader>
            <CardContent>
              {rollup.length === 0 ? (
                <p className="text-sm text-muted-foreground">No stock records yet.</p>
              ) : (
                <ul className="divide-y">
                  {rollup.map((s) => (
                    <li key={s.org_unit} className="flex items-center justify-between gap-2 py-2">
                      <div>
                        <p className="font-mono text-sm">{s.org_unit}</p>
                        <p className="text-xs text-muted-foreground">
                          balance {kg(s.balance_grams)} · ~{kg(s.avg_daily_grams)}/day · {s.days_of_cover} days cover
                        </p>
                      </div>
                      {s.low_stock ? <Badge variant="destructive">LOW STOCK</Badge> : <Badge variant="default">OK</Badge>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Record a day&apos;s service</CardTitle>
                <CardDescription>Draws grain from stock (rejected if it would over-draw or exceed enrolment).</CardDescription>
              </CardHeader>
              <CardContent>
                <ServeForm schools={schools} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Record a foodgrain receipt</CardTitle>
                <CardDescription>Lift grain in (TPDS) — increases the school&apos;s stock.</CardDescription>
              </CardHeader>
              <CardContent>
                <ReceiveForm schools={schools} />
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}

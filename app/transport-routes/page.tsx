import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusCircle, Eye, Pencil, ArrowLeft, ArrowRight, Bus, AlertTriangle } from "lucide-react"
import { listRoutesAction } from "./actions"
import { RouteFilters } from "./components/route-filters"
import { DeleteRouteButton, SeedRoutesButton } from "./components/route-actions"
import { freeSeats, occupancyPct, isOverloaded, inr, type RouteStatus } from "@/lib/transportmgmt"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const STATUS_STYLE: Record<RouteStatus, string> = {
  Active: "bg-green-100 text-green-700",
  Planned: "bg-blue-100 text-blue-700",
  Suspended: "bg-gray-100 text-gray-600",
}

interface SP { q?: string; status?: string; vehicleType?: string; shift?: string; sort?: "routeCode" | "routeName" | "occupancy"; page?: string }

export default async function TransportRoutesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listRoutesAction({ query: sp.q, status: sp.status, vehicleType: sp.vehicleType, shift: sp.shift, sortBy: sp.sort ?? "routeCode", sortDir: "asc", page })
  const demo = !isSupabaseAdminConfigured()
  const s = result.summary

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, status: sp.status, vehicleType: sp.vehicleType, shift: sp.shift, sort: sp.sort })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/transport-routes?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Transport Routes</PageHeaderHeading>
        <PageHeaderDescription>School transport — routes with ordered stops and pickup/drop times, the assigned vehicle and driver, seat capacity vs students assigned (occupancy & overload), and the term transport fare. Filter, search, plan and manage routes.</PageHeaderDescription>
        <PageHeaderActions>
          <SeedRoutesButton />
          <Button asChild><Link href="/transport-routes/new"><PlusCircle className="mr-2 h-4 w-4" />New route</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing representative <strong>demo routes</strong> — no database is configured. Provision Supabase and seed to manage live transport.
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Routes", String(s.routes), "text-foreground"],
          ["Active", String(s.active), "text-green-700"],
          ["Capacity", String(s.capacity), "text-blue-700"],
          ["Assigned", String(s.assigned), "text-foreground"],
          ["Avg occupancy", `${s.avgOccupancy}%`, s.overloaded > 0 ? "text-red-700" : "text-blue-700"],
        ].map(([label, value, color]) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <RouteFilters />

      {result.routes.length === 0 ? (
        <div className="rounded-md border py-12 text-center">
          <Bus className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium">No routes found</p>
          <p className="text-sm text-muted-foreground">Adjust filters, seed demo routes, or add a new one.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.routes.map((r) => {
            const over = isOverloaded(r)
            return (
              <Card key={r.id} className={over ? "border-red-200" : undefined}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{r.routeName}</CardTitle>
                    <Badge className={`${STATUS_STYLE[r.status]} border-0`}>{r.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.routeCode} · {r.vehicleType} {r.vehicleNo} · {r.shift}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground">Driver: {r.driverName} · {r.driverPhone}</div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="secondary">{r.assignedCount}/{r.capacity} seats</Badge>
                    <Badge className={over ? "bg-red-100 text-red-700 border-0" : "bg-blue-100 text-blue-700 border-0"}>{occupancyPct(r)}%</Badge>
                    {over ? <Badge className="bg-red-100 text-red-700 border-0"><AlertTriangle className="mr-1 h-3 w-3" />Overloaded</Badge> : <span className="text-muted-foreground">{freeSeats(r)} free</span>}
                    <span className="ml-auto text-muted-foreground">{r.stops.length} stops · {inr(r.farePerTerm)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="icon"><Link href={`/transport-routes/${r.id}`} aria-label={`View ${r.routeName}`}><Eye className="h-4 w-4" /></Link></Button>
                    <Button asChild variant="outline" size="icon"><Link href={`/transport-routes/${r.id}/edit`} aria-label={`Edit ${r.routeName}`}><Pencil className="h-4 w-4" /></Link></Button>
                    <DeleteRouteButton id={r.id} name={r.routeName} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {result.routes.length} of {result.total} route{result.total === 1 ? "" : "s"} · page {result.page} of {result.totalPages}</span>
        {result.totalPages > 1 ? (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" disabled={result.page <= 1}><Link href={pageHref(result.page - 1)}><ArrowLeft className="mr-1 h-4 w-4" />Prev</Link></Button>
            <Button asChild variant="outline" size="sm" disabled={result.page >= result.totalPages}><Link href={pageHref(result.page + 1)}>Next<ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
        ) : null}
      </div>
    </Shell>
  )
}

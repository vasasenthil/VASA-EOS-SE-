import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Pencil, AlertTriangle, MapPin } from "lucide-react"
import { getRouteAction } from "../actions"
import { DeleteRouteButton } from "../components/route-actions"
import { freeSeats, occupancyPct, isOverloaded, inr } from "@/lib/transportmgmt"

export const dynamic = "force-dynamic"

export default async function RouteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await getRouteAction(id)

  if (!r) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Route not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this route. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/transport-routes"><ArrowLeft className="mr-2 h-4 w-4" />Back to routes</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const over = isOverloaded(r)
  const meta: Array<[string, string]> = [
    ["Route code", r.routeCode],
    ["Vehicle", `${r.vehicleType} · ${r.vehicleNo}`],
    ["Driver", `${r.driverName} · ${r.driverPhone}`],
    ["Shift", r.shift],
    ["Capacity", String(r.capacity)],
    ["Assigned", String(r.assignedCount)],
    ["Free seats", String(freeSeats(r))],
    ["Occupancy", `${occupancyPct(r)}%`],
    ["Fare / term", inr(r.farePerTerm)],
  ]

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{r.routeName}</PageHeaderHeading>
        <PageHeaderDescription>{r.routeCode} · {r.vehicleType} {r.vehicleNo} · {r.stops.length} stops</PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline"><Link href={`/transport-routes/${r.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link></Button>
          <DeleteRouteButton id={r.id} name={r.routeName} redirectTo="/transport-routes" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm"><Link href="/transport-routes"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <Badge>{r.status}</Badge>
        <Badge variant="secondary">{r.assignedCount}/{r.capacity} · {occupancyPct(r)}%</Badge>
        {over ? <Badge className="bg-red-100 text-red-700 border-0"><AlertTriangle className="mr-1 h-3 w-3" />Overloaded</Badge> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Route & vehicle</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              {meta.map(([k, v]) => (
                <div key={k} className="flex justify-between border-b py-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium text-right">{v}</dd></div>
              ))}
            </dl>
            {r.notes ? <p className="mt-3 text-sm"><span className="text-muted-foreground">Notes: </span>{r.notes}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />Stops</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Stop</TableHead><TableHead>Pickup</TableHead><TableHead>Drop</TableHead></TableRow></TableHeader>
              <TableBody>
                {r.stops.map((s, i) => (
                  <TableRow key={i}><TableCell className="text-muted-foreground">{i + 1}</TableCell><TableCell className="font-medium">{s.name}</TableCell><TableCell className="tabular-nums">{s.pickupTime}</TableCell><TableCell className="tabular-nums">{s.dropTime}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

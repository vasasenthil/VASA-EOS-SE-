import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getRouteAction } from "../../actions"
import { RouteForm } from "../../components/route-form"
import type { TransportInput } from "@/lib/transportmgmt"

export const dynamic = "force-dynamic"

export default async function EditRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await getRouteAction(id)

  if (!r) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Route not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/transport-routes"><ArrowLeft className="mr-2 h-4 w-4" />Back to routes</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: TransportInput = {
    routeName: r.routeName, routeCode: r.routeCode, vehicleNo: r.vehicleNo, vehicleType: r.vehicleType, driverName: r.driverName,
    driverPhone: r.driverPhone, capacity: r.capacity, assignedCount: r.assignedCount, stops: r.stops, farePerTerm: r.farePerTerm,
    shift: r.shift, status: r.status, notes: r.notes,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit {r.routeName}</PageHeaderHeading>
        <PageHeaderDescription>Update the route, vehicle, driver, stops or assignment. Changes are audited.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/transport-routes/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to route</Link></Button></div>
      <RouteForm id={id} initial={initial} />
    </Shell>
  )
}

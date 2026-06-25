import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil, Clock } from "lucide-react"
import { getStaffAction } from "../actions"
import { DeleteStaffButton } from "../components/staff-actions"
import { serviceYears, ageYears, totalLeaveBalance, retirementDue } from "@/lib/staffmaster"
import { safeDate } from "@/lib/format-date"

export const dynamic = "force-dynamic"

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const m = await getStaffAction(id)

  if (!m) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Staff member not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this staff record. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/staff-directory"><ArrowLeft className="mr-2 h-4 w-4" />Back to directory</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const retire = m.status !== "Retired" && retirementDue(m.dob)
  const identity: Array<[string, string]> = [
    ["Staff id", m.staffId],
    ["Designation", m.designation],
    ["Cadre", m.cadre],
    ["Department", m.department],
    ["Employment type", m.employmentType],
    ["Gender", m.gender],
    ["Qualification", m.qualification],
    ["Phone", m.phone],
    ["Email", m.email],
    ["Pay scale", m.payScale || "—"],
  ]
  const service: Array<[string, string]> = [
    ["Date of birth", `${safeDate(m.dob, "dd MMM yyyy")} (${ageYears(m.dob)} yrs)`],
    ["Date of joining", safeDate(m.doj, "dd MMM yyyy")],
    ["Service", `${serviceYears(m.doj)} yrs`],
    ["Casual leave balance", `${m.casualLeaveBalance} days`],
    ["Earned leave balance", `${m.earnedLeaveBalance} days`],
    ["Total leave balance", `${totalLeaveBalance(m)} days`],
  ]

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{m.name}</PageHeaderHeading>
        <PageHeaderDescription>{m.staffId} · {m.designation} · {m.department}</PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline"><Link href={`/staff-directory/${m.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link></Button>
          <DeleteStaffButton id={m.id} name={m.name} redirectTo="/staff-directory" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm"><Link href="/staff-directory"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <Badge>{m.status}</Badge>
        <Badge variant="secondary">{m.cadre}</Badge>
        {retire ? <Badge className="bg-amber-100 text-amber-700 border-0"><Clock className="mr-1 h-3 w-3" />Retiring soon</Badge> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Identity & role</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              {identity.map(([k, v]) => (
                <div key={k} className="flex justify-between border-b py-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium text-right break-all">{v}</dd></div>
              ))}
            </dl>
            {m.notes ? <p className="mt-3 text-sm"><span className="text-muted-foreground">Notes: </span>{m.notes}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Service & leave</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              {service.map(([k, v]) => (
                <div key={k} className="flex justify-between border-b py-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium text-right">{v}</dd></div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

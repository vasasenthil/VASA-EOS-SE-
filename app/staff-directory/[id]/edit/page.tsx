import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getStaffAction } from "../../actions"
import { StaffForm } from "../../components/staff-form"
import type { StaffInput } from "@/lib/staffmaster"

export const dynamic = "force-dynamic"

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const m = await getStaffAction(id)

  if (!m) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Staff member not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/staff-directory"><ArrowLeft className="mr-2 h-4 w-4" />Back to directory</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: StaffInput = {
    staffId: m.staffId, name: m.name, designation: m.designation, cadre: m.cadre, department: m.department, gender: m.gender,
    dob: m.dob, doj: m.doj, qualification: m.qualification, phone: m.phone, email: m.email, employmentType: m.employmentType,
    status: m.status, casualLeaveBalance: m.casualLeaveBalance, earnedLeaveBalance: m.earnedLeaveBalance, payScale: m.payScale, notes: m.notes,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit {m.name}</PageHeaderHeading>
        <PageHeaderDescription>Update the staff record, status or leave balances. Changes are audited.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/staff-directory/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to staff</Link></Button></div>
      <StaffForm id={id} initial={initial} />
    </Shell>
  )
}

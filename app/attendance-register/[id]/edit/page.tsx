import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getAttendanceAction } from "../../actions"
import { AttendanceForm } from "../../components/attendance-form"
import type { AttendanceInput } from "@/lib/attendance-register"

export const dynamic = "force-dynamic"

export default async function EditAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const e = await getAttendanceAction(id)

  if (!e) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Attendance entry not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/attendance-register"><ArrowLeft className="mr-2 h-4 w-4" />Back to register</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: AttendanceInput = {
    student: e.student, apaarId: e.apaarId, classLevel: e.classLevel, section: e.section,
    date: e.date, status: e.status, remarks: e.remarks,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit attendance — {e.student}</PageHeaderHeading>
        <PageHeaderDescription>Update the entry. Changes are audited.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/attendance-register/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to entry</Link></Button></div>
      <AttendanceForm id={id} initial={initial} />
    </Shell>
  )
}

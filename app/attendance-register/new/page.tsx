import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AttendanceForm } from "../components/attendance-form"

export default function NewAttendancePage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Attendance Entry</PageHeaderHeading>
        <PageHeaderDescription>Record a student&apos;s attendance for a date — Present, Absent, Late or Leave.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/attendance-register"><ArrowLeft className="mr-2 h-4 w-4" />Back to register</Link></Button></div>
      <AttendanceForm />
    </Shell>
  )
}

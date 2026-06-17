import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { TimetableForm } from "../components/timetable-form"

export default function NewTimetablePage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Timetable Entry</PageHeaderHeading>
        <PageHeaderDescription>Add a period — class/section, day, period, time, subject, teacher and room. Clashes are rejected automatically.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/timetable-manager"><ArrowLeft className="mr-2 h-4 w-4" />Back to timetable</Link></Button></div>
      <TimetableForm />
    </Shell>
  )
}

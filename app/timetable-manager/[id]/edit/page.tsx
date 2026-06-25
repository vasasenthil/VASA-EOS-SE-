import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getTimetableEntryAction } from "../../actions"
import { TimetableForm } from "../../components/timetable-form"
import type { TimetableInput } from "@/lib/timetable-manager"

export const dynamic = "force-dynamic"

export default async function EditTimetablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const e = await getTimetableEntryAction(id)

  if (!e) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Timetable entry not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/timetable-manager"><ArrowLeft className="mr-2 h-4 w-4" />Back to timetable</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: TimetableInput = {
    classLevel: e.classLevel, section: e.section, day: e.day, period: e.period,
    startTime: e.startTime, endTime: e.endTime, subject: e.subject, teacher: e.teacher, room: e.room,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit period — {e.day} P{e.period}</PageHeaderHeading>
        <PageHeaderDescription>Update the entry. Clashes are rejected. Changes are audited.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/timetable-manager/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to entry</Link></Button></div>
      <TimetableForm id={id} initial={initial} />
    </Shell>
  )
}

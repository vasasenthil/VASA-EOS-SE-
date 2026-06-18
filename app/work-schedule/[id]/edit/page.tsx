import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getWorkTimeAction } from "../../actions"
import { WorkTimeForm } from "../../components/worktime-form"
import type { WorkTimeInput } from "@/lib/worktime"

export const dynamic = "force-dynamic"

export default async function EditWorkTimePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getWorkTimeAction(id)

  if (!p) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Working-time profile not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/work-schedule"><ArrowLeft className="mr-2 h-4 w-4" />Back to scheduler</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: WorkTimeInput = {
    name: p.name, academicYear: p.academicYear, termStart: p.termStart, termEnd: p.termEnd,
    workingWeekdays: p.workingWeekdays, dayStart: p.dayStart, dayEnd: p.dayEnd, periods: p.periods, status: p.status,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit {p.name}</PageHeaderHeading>
        <PageHeaderDescription>Update the working-time profile. Changes are audited and re-resolve school days.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/work-schedule/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to profile</Link></Button></div>
      <WorkTimeForm id={id} initial={initial} />
    </Shell>
  )
}

import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getHolidayAction } from "../../actions"
import { HolidayForm } from "../../components/holiday-form"
import type { HolidayInput } from "@/lib/holidays"

export const dynamic = "force-dynamic"

export default async function EditHolidayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const h = await getHolidayAction(id)

  if (!h) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Holiday not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/holidays"><ArrowLeft className="mr-2 h-4 w-4" />Back to calendar</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: HolidayInput = {
    name: h.name, category: h.category, startDate: h.startDate, endDate: h.endDate,
    recurring: h.recurring, academicYear: h.academicYear, description: h.description, status: h.status,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit {h.name}</PageHeaderHeading>
        <PageHeaderDescription>Update the holiday. Changes are audited and re-read by the Working-Time Scheduler.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/holidays/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to holiday</Link></Button></div>
      <HolidayForm id={id} initial={initial} />
    </Shell>
  )
}

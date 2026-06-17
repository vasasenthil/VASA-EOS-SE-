import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { HolidayForm } from "../components/holiday-form"

export default function NewHolidayPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Holiday</PageHeaderHeading>
        <PageHeaderDescription>Add a holiday — category, date range, recurring flag and academic year.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/holidays"><ArrowLeft className="mr-2 h-4 w-4" />Back to calendar</Link></Button></div>
      <HolidayForm />
    </Shell>
  )
}

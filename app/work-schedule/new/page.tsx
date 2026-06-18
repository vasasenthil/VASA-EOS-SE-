import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { WorkTimeForm } from "../components/worktime-form"

export default function NewWorkTimePage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Working-Time Profile</PageHeaderHeading>
        <PageHeaderDescription>Define the academic-year term window, working weekdays and the daily bell-schedule.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/work-schedule"><ArrowLeft className="mr-2 h-4 w-4" />Back to scheduler</Link></Button></div>
      <WorkTimeForm />
    </Shell>
  )
}

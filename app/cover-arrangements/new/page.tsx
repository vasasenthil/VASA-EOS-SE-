import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { CoverForm } from "../components/cover-form"

export default function NewCoverPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Cover Arrangement</PageHeaderHeading>
        <PageHeaderDescription>Record an absent teacher&apos;s uncovered period, then suggest a teacher who is free in that exact slot (from the timetable) and assign the substitute.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/cover-arrangements"><ArrowLeft className="mr-2 h-4 w-4" />Back to arrangements</Link></Button></div>
      <CoverForm />
    </Shell>
  )
}

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { GradeForm } from "../components/grade-form"

export default function NewGradePage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Grade</PageHeaderHeading>
        <PageHeaderDescription>Record a student&apos;s marks for an assessment — percentage and letter grade are derived automatically.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/grades"><ArrowLeft className="mr-2 h-4 w-4" />Back to gradebook</Link></Button></div>
      <GradeForm />
    </Shell>
  )
}

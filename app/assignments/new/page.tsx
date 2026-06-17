import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AssignmentForm } from "../components/assignment-form"

export default function NewAssignmentPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Assignment</PageHeaderHeading>
        <PageHeaderDescription>Set a new piece of work — title, class, subject, type, due date, marks and instructions.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/assignments"><ArrowLeft className="mr-2 h-4 w-4" />Back to assignments</Link></Button></div>
      <AssignmentForm />
    </Shell>
  )
}

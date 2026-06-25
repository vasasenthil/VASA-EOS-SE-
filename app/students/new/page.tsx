import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { StudentForm } from "../components/student-form"

export default function NewStudentPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Student Record</PageHeaderHeading>
        <PageHeaderDescription>Add a student to the register — APAAR id, demographics, class/section, guardian and contact.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/students"><ArrowLeft className="mr-2 h-4 w-4" />Back to register</Link></Button></div>
      <StudentForm />
    </Shell>
  )
}

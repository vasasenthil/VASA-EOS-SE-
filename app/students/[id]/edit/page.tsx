import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getStudentAction } from "../../actions"
import { StudentForm } from "../../components/student-form"
import type { StudentInput } from "@/lib/students"

export const dynamic = "force-dynamic"

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const s = await getStudentAction(id)

  if (!s) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Student not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/students"><ArrowLeft className="mr-2 h-4 w-4" />Back to register</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: StudentInput = {
    apaarId: s.apaarId, name: s.name, gender: s.gender, dob: s.dob, classLevel: s.classLevel, section: s.section,
    category: s.category, guardianName: s.guardianName, contactPhone: s.contactPhone, status: s.status,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit {s.name}</PageHeaderHeading>
        <PageHeaderDescription>Update the student record. Changes are audited.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/students/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to record</Link></Button></div>
      <StudentForm id={id} initial={initial} />
    </Shell>
  )
}

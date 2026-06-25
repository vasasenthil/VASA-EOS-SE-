import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getDiagnosticAction } from "../../actions"
import { DiagnosticForm } from "../../components/diagnostic-form"
import type { DiagnosticInput } from "@/lib/diagnostics"

export const dynamic = "force-dynamic"

export default async function EditDiagnosticPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const d = await getDiagnosticAction(id)

  if (!d) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Diagnostic not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/diagnostics"><ArrowLeft className="mr-2 h-4 w-4" />Back to diagnostics</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: DiagnosticInput = {
    student: d.student, apaarId: d.apaarId, classLevel: d.classLevel, section: d.section, subject: d.subject, title: d.title,
    assessmentType: d.assessmentType, date: d.date, items: d.items, planStatus: d.planStatus, approvedBy: d.approvedBy, remediation: d.remediation,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit {d.title}</PageHeaderHeading>
        <PageHeaderDescription>Update the rubric or approve the remediation plan. The engine diagnosis recomputes live. Changes are audited.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/diagnostics/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to diagnostic</Link></Button></div>
      <DiagnosticForm id={id} initial={initial} />
    </Shell>
  )
}

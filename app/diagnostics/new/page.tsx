import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { DiagnosticForm } from "../components/diagnostic-form"

export default function NewDiagnosticPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Diagnostic</PageHeaderHeading>
        <PageHeaderDescription>Enter the rubric and awarded marks — the Assessment Engine diagnoses per-objective mastery live; you approve the remediation plan.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/diagnostics"><ArrowLeft className="mr-2 h-4 w-4" />Back to diagnostics</Link></Button></div>
      <DiagnosticForm />
    </Shell>
  )
}

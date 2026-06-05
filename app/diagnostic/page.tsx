import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { DiagnosticBoard } from "./diagnostic-board"

export default function DiagnosticPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Diagnostic Learning-Level Test</PageHeaderHeading>
        <PageHeaderDescription>
          Enter diagnostic scores and the system classifies each learner — at grade level, one level below, or two-plus
          below — and shows the class distribution to target remediation.
        </PageHeaderDescription>
      </PageHeader>
      <DiagnosticBoard />
    </Shell>
  )
}

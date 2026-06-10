import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { RecognitionApplicationFormUI } from "./application-form"

export default function NewRecognitionApplicationPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>File a Recognition Application</PageHeaderHeading>
        <PageHeaderDescription>
          A rich, validated, multi-field application under the Tamil Nadu Recognised Private Schools (Regulation) Act
          1973. Every field is validated before submission; on submit the application enters the live three-tier
          approval workflow (Block → District → Directorate) with a tamper-evident audit trail.
        </PageHeaderDescription>
      </PageHeader>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/recognition-approvals"><ArrowLeft className="mr-2 h-4 w-4" />Back to approvals inbox</Link>
        </Button>
      </div>
      <RecognitionApplicationFormUI />
    </Shell>
  )
}

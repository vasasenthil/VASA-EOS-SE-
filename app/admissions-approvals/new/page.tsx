import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AdmissionFormUI } from "./admission-form"

export default function NewAdmissionPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Admission Application</PageHeaderHeading>
        <PageHeaderDescription>
          A rich, validated admission form (RTE 2009 / APAAR) — with an age-appropriateness check, an RTE 25% claim,
          and document completeness. On submit it enters the two-tier workflow: Academic Head document verification →
          Principal enrolment &amp; APAAR provisioning, with a tamper-evident audit trail.
        </PageHeaderDescription>
      </PageHeader>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/admissions-approvals"><ArrowLeft className="mr-2 h-4 w-4" />Back to admissions inbox</Link>
        </Button>
      </div>
      <AdmissionFormUI />
    </Shell>
  )
}

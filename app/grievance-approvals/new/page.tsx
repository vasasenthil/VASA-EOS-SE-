import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { GrievanceFormUI } from "./grievance-form"

export default function NewGrievancePage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>File a Grievance</PageHeaderHeading>
        <PageHeaderDescription>
          A rich, validated complaint form (Sec 48 redressal). Once submitted, your grievance enters the live
          three-tier escalation workflow — School (Principal) → Block (BEO) → District (DEO) — with a tamper-evident
          audit trail at every step. Your consent is captured under DPDP 2023.
        </PageHeaderDescription>
      </PageHeader>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/grievance-approvals"><ArrowLeft className="mr-2 h-4 w-4" />Back to grievance inbox</Link>
        </Button>
      </div>
      <GrievanceFormUI />
    </Shell>
  )
}

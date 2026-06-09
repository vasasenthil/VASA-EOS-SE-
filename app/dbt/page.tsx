import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { DbtForm } from "./dbt-form"

export default function DbtPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Scheme Disbursement Engine</PageHeaderHeading>
        <PageHeaderDescription>
          Cross-scheme orchestration with APAAR + Aadhaar deduplication and DBT-APBS direct routing. Eligibility is
          auto-detected; disbursements are blockchain-anchored for CAG-ready audit and leakage detection.
        </PageHeaderDescription>
      </PageHeader>
      <DbtForm />
    </Shell>
  )
}

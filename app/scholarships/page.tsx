import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { ScholarshipBoard } from "./scholarship-board"
import { listBeneficiariesAction } from "./actions"

export default async function ScholarshipsPage() {
  const initial = await listBeneficiariesAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Scholarship &amp; Welfare Tracking</PageHeaderHeading>
        <PageHeaderDescription>
          Track welfare-scheme disbursements per beneficiary along the eligible → applied → sanctioned → disbursed
          pipeline. Production settles through DBT/APBS and anchors each step to the audit ledger.
        </PageHeaderDescription>
      </PageHeader>
      <ScholarshipBoard initial={initial} />
    </Shell>
  )
}

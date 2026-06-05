import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { PrePrimaryForm } from "./preprimary-form"

export default function PrePrimaryPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Anganwadi / Pre-Primary Intake</PageHeaderHeading>
        <PageHeaderDescription>
          Register 3-6 year-olds into Anganwadi centres for the NEP foundational stage (ECCE). Eligibility is checked on
          age; production federates with the ICDS / Poshan ecosystem.
        </PageHeaderDescription>
      </PageHeader>
      <PrePrimaryForm />
    </Shell>
  )
}

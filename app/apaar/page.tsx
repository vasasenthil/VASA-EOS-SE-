import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { ApaarProvisionForm } from "./apaar-provision-form"

export default function ApaarPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>APAAR Identity</PageHeaderHeading>
        <PageHeaderDescription>
          Automated Permanent Academic Account Registry — lifelong student identity from Anganwadi to Alumni. Provisioned
          with AI-assisted deduplication and Aadhaar consent (never stored), federated with UDISE+, DigiLocker and ABC.
        </PageHeaderDescription>
      </PageHeader>
      <ApaarProvisionForm />
    </Shell>
  )
}

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { AdmissionsForm } from "./admissions-form"

export default function AdmissionsPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Admissions &amp; Enrolment</PageHeaderHeading>
        <PageHeaderDescription>
          Onboard a new student — capture details, validate, and provision a lifelong APAAR id on enrolment. Production
          provisions the real APAAR via the identity provider with Aadhaar-consented dedup.
        </PageHeaderDescription>
      </PageHeader>
      <AdmissionsForm />
    </Shell>
  )
}

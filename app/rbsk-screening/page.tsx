import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { ScreeningForm } from "./screening-form"

export default function RbskScreeningPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>RBSK Screening Entry</PageHeaderHeading>
        <PageHeaderDescription>
          Record Rashtriya Bal Swasthya Karyakram screenings (the 4 Ds) — BMI, anaemia and vision — and the system flags
          referrals automatically. Production federates to ABHA health records.
        </PageHeaderDescription>
      </PageHeader>
      <ScreeningForm />
    </Shell>
  )
}

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { WashForm } from "./wash-form"

export default function WashAuditPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>WASH / Swachh Vidyalaya Audit</PageHeaderHeading>
        <PageHeaderDescription>
          Audit water, sanitation and hygiene against the Swachh Vidyalaya checklist — the system derives a percentage
          score and a star rating, and keeps a record per school.
        </PageHeaderDescription>
      </PageHeader>
      <WashForm />
    </Shell>
  )
}

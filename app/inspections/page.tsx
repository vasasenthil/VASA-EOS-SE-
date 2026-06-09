import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { InspectionForm } from "./inspection-form"

export default function InspectionsPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Inspection Visits</PageHeaderHeading>
        <PageHeaderDescription>
          Capture GPS-verified CRC/BEO field visits against a standard checklist — the system derives a visit score and
          rating, and keeps a log for the school&apos;s quality trail.
        </PageHeaderDescription>
      </PageHeader>
      <InspectionForm />
    </Shell>
  )
}

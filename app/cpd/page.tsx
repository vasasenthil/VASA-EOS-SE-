import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { CpdTracker } from "./cpd-tracker"

export default function CpdPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Teacher CPD</PageHeaderHeading>
        <PageHeaderDescription>
          Log continuous professional development activities — NISHTHA modules, SCERT/DIET workshops and more — and track
          progress toward the NEP-recommended 50 hours per year.
        </PageHeaderDescription>
      </PageHeader>
      <CpdTracker />
    </Shell>
  )
}

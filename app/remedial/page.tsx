import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { RemedialBoard } from "./remedial-board"

export default function RemedialPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Remedial / NIPUN Bridge Classes</PageHeaderHeading>
        <PageHeaderDescription>
          Enrol learners into foundational literacy remediation and track their progress up the Ennum Ezhuthum reading
          ladder (Beginner → Story) — the core of NIPUN Bharat / FLN.
        </PageHeaderDescription>
      </PageHeader>
      <RemedialBoard />
    </Shell>
  )
}

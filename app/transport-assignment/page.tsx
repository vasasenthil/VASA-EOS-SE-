import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { AssignmentBoard } from "./assignment-board"

export default function TransportAssignmentPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Transport Assignment</PageHeaderHeading>
        <PageHeaderDescription>
          Assign students to bus routes within capacity — seats and free space update live, and full routes are flagged.
          Free bus passes are auto-issued via APAAR; CWSN counts are shown per route.
        </PageHeaderDescription>
      </PageHeader>
      <AssignmentBoard />
    </Shell>
  )
}

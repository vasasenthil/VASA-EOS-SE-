import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { DisciplineBoard } from "./discipline-board"

export default function DisciplinePage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Disciplinary &amp; Incident Log</PageHeaderHeading>
        <PageHeaderDescription>
          Record student incidents with severity and the action taken, and track them through to resolution. Serious
          incidents are surfaced for follow-up (safeguarding / POCSO escalation where relevant).
        </PageHeaderDescription>
      </PageHeader>
      <DisciplineBoard />
    </Shell>
  )
}

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { CouncilBoard } from "./council-board"
import { listCandidatesAction } from "./actions"

export default async function StudentCouncilPage() {
  const initial = await listCandidatesAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Student Council / Cabinet Elections</PageHeaderHeading>
        <PageHeaderDescription>
          Nominate candidates for council positions, cast votes and declare the winner per position. A simple
          interactive ballot to run the school student cabinet and build student leadership.
        </PageHeaderDescription>
      </PageHeader>
      <CouncilBoard initial={initial} />
    </Shell>
  )
}

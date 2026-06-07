import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { IctBoard } from "./ict-board"
import { listSessionsAction } from "./actions"

export default async function IctLabPage() {
  const initial = await listSessionsAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>ICT Lab / Smart Class Usage</PageHeaderHeading>
        <PageHeaderDescription>
          Log smart-class and computer-lab sessions, track device uptime and students reached, and flag sessions where
          working devices can&apos;t cover the class. Surfaces real digital-learning utilisation.
        </PageHeaderDescription>
      </PageHeader>
      <IctBoard initial={initial} />
    </Shell>
  )
}

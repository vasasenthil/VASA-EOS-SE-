import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { IctBoard } from "./ict-board"

export default function IctLabPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>ICT Lab / Smart Class Usage</PageHeaderHeading>
        <PageHeaderDescription>
          Log smart-class and computer-lab sessions, track device uptime and students reached, and flag sessions where
          working devices can&apos;t cover the class. Surfaces real digital-learning utilisation.
        </PageHeaderDescription>
      </PageHeader>
      <IctBoard />
    </Shell>
  )
}

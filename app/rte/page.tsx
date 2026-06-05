import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { RteBoard } from "./rte-board"

export default function RtePage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>RTE 25% Quota Tracker</PageHeaderHeading>
        <PageHeaderDescription>
          Track applicants for the 25% seats reserved for economically-weaker and disadvantaged groups under RTE Act
          Sec 12(1)(c) — from application through verification, allotment and admission, against quota fill rate.
        </PageHeaderDescription>
      </PageHeader>
      <RteBoard />
    </Shell>
  )
}

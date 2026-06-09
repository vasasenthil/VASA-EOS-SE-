import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { SmcPanel } from "./smc-panel"

export default function SmcPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Management Committee (DAO)</PageHeaderHeading>
        <PageHeaderDescription>
          RTE-mandated SMC (75% parents) augmented with DAO-style transparent governance — structured proposals,
          quorum-based voting and tamper-evident vote records. Augments, not replaces, the legal SMC.
        </PageHeaderDescription>
      </PageHeader>
      <SmcPanel />
    </Shell>
  )
}

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { SafetyBoard } from "./safety-board"
import { listConcernsAction } from "./actions"

export default async function SafetyPage() {
  // Load persisted concerns (durable when a DB is configured; empty otherwise).
  const initial = await listConcernsAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Anti-Ragging &amp; Safety Committee Log</PageHeaderHeading>
        <PageHeaderDescription>
          Record anti-ragging, POSH, POCSO, fire and building safety concerns and track each to resolution. The
          statutory committee reviews the log; production routes POCSO/POSH cases confidentially.
        </PageHeaderDescription>
      </PageHeader>
      <SafetyBoard initial={initial} />
    </Shell>
  )
}

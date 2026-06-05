import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { SafetyBoard } from "./safety-board"

export default function SafetyPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Anti-Ragging &amp; Safety Committee Log</PageHeaderHeading>
        <PageHeaderDescription>
          Record anti-ragging, POSH, POCSO, fire and building safety concerns and track each to resolution. The
          statutory committee reviews the log; production routes POCSO/POSH cases confidentially.
        </PageHeaderDescription>
      </PageHeader>
      <SafetyBoard />
    </Shell>
  )
}

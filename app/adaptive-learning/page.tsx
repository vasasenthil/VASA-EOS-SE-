import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { AdaptiveSession } from "./adaptive-session"

export default function AdaptiveLearningPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Adaptive Learning Engine</PageHeaderHeading>
        <PageHeaderDescription>
          Personalised paths via Bayesian knowledge tracing and IRT — mastery-based progression with next items chosen in
          the learner&apos;s Zone of Proximal Development. Answer questions and watch mastery and difficulty adapt live.
        </PageHeaderDescription>
      </PageHeader>
      <AdaptiveSession />
    </Shell>
  )
}

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { FitnessBoard } from "./fitness-board"

export default function FitnessPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Khelo India Fitness Test</PageHeaderHeading>
        <PageHeaderDescription>
          Record physical-fitness test scores against age-band benchmarks, auto-grade each result, and flag students
          who need a PE follow-up plan. Builds physical literacy under Khelo India.
        </PageHeaderDescription>
      </PageHeader>
      <FitnessBoard />
    </Shell>
  )
}

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { CareerGuide } from "./career-guide"

export default function CareerPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Career Guidance</PageHeaderHeading>
        <PageHeaderDescription>
          Select interest areas and see suggested academic streams and careers, ranked by fit — linked to Naan Mudhalvan
          skilling. A counsellor reviews high-stakes guidance.
        </PageHeaderDescription>
      </PageHeader>
      <CareerGuide />
    </Shell>
  )
}

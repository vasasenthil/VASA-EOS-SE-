import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { EcoBoard } from "./eco-board"

export default function EcoClubPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Eco Club &amp; Tree Plantation</PageHeaderHeading>
        <PageHeaderDescription>
          Log green-club activities, count saplings planted and how many survive at follow-up, and watch the survival
          rate. Feeds the Green School / ESG score and builds environmental literacy.
        </PageHeaderDescription>
      </PageHeader>
      <EcoBoard />
    </Shell>
  )
}

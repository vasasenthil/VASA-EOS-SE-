import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { PromotionBoard } from "./promotion-board"
import { listRunsAction } from "./actions"

export default async function PromotionPage() {
  const initial = await listRunsAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Student Promotion &amp; Rollover</PageHeaderHeading>
        <PageHeaderDescription>
          Year-end rollover — promote each student to the next class or detain them. Class 12 promotes to graduated. The
          summary shows how many are promoting, detaining and graduating.
        </PageHeaderDescription>
      </PageHeader>
      <PromotionBoard initial={initial} />
    </Shell>
  )
}

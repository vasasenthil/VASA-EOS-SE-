import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { ScienceFairBoard } from "./science-fair-board"
import { listProjectsAction } from "./actions"

export default async function ScienceFairPage() {
  const initial = await listProjectsAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Science Exhibition / INSPIRE Awards</PageHeaderHeading>
        <PageHeaderDescription>
          Register student STEM projects, score them on the judging slider, and auto-shortlist high scorers for the
          next level. Drives the science-exhibition and INSPIRE Awards pipeline.
        </PageHeaderDescription>
      </PageHeader>
      <ScienceFairBoard initial={initial} />
    </Shell>
  )
}

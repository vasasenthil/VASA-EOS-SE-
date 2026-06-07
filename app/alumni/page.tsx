import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { AlumniBoard } from "./alumni-board"
import { listAlumniAction } from "./actions"

export default async function AlumniPage() {
  const initial = await listAlumniAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Alumni Registry</PageHeaderHeading>
        <PageHeaderDescription>
          Register and track alumni by passing-out year and occupation, grouped by decade — the basis for mentorship,
          guest sessions and school-development engagement.
        </PageHeaderDescription>
      </PageHeader>
      <AlumniBoard initial={initial} />
    </Shell>
  )
}

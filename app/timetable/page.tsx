import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { TimetableBoard } from "./timetable-board"

export default function TimetablePage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Timetable &amp; Substitution</PageHeaderHeading>
        <PageHeaderDescription>
          Build the weekly timetable slot by slot, then plan substitutions — mark a teacher absent and the planner lists
          each of their periods with the teachers who are free to cover.
        </PageHeaderDescription>
      </PageHeader>
      <TimetableBoard />
    </Shell>
  )
}

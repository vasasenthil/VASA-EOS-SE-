import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { DayPlanView } from "./day-plan-view"

export const dynamic = "force-dynamic"

export default function DayPlanPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Day Plan</PageHeaderHeading>
        <PageHeaderDescription>
          The resolved school day for a class — one view that joins all four operations modules: the
          Working-Time Scheduler (is it a working day? which bell periods?), the Holiday Calendar, the
          Timetable (subject/teacher/room per period) and the Lesson Plans (topic, materials, homework,
          class notes) attached to each period.
        </PageHeaderDescription>
      </PageHeader>
      <DayPlanView defaultClass="X" defaultSection="A" defaultDate="2026-06-30" />
    </Shell>
  )
}

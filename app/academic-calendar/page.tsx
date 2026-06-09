import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { CalendarBoard } from "./calendar-board"

export default function AcademicCalendarPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Events &amp; Academic Calendar</PageHeaderHeading>
        <PageHeaderDescription>
          Plan the academic year — terms, examinations, holidays, parent-teacher meetings and events. Add entries and
          filter by type; the calendar keeps everything in date order.
        </PageHeaderDescription>
      </PageHeader>
      <CalendarBoard />
    </Shell>
  )
}

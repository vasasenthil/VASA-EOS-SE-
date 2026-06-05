import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { AttendanceSheet } from "./attendance-sheet"

export default function AttendancePage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Daily Attendance</PageHeaderHeading>
        <PageHeaderDescription>
          Mark today&apos;s attendance for the class with one tap per student. Present and late count as attended; the
          day&apos;s rate and counts update live. Feeds the SIS attendance trend and the teacher&apos;s daily loop.
        </PageHeaderDescription>
      </PageHeader>
      <AttendanceSheet />
    </Shell>
  )
}

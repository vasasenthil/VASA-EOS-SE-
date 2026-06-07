import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { StaffSheet } from "./staff-sheet"
import { listSheetsAction } from "./actions"

export default async function StaffAttendancePage() {
  const initial = await listSheetsAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Staff Attendance</PageHeaderHeading>
        <PageHeaderDescription>
          Mark daily staff attendance — present, late, on-duty or absent. Present, late and on-duty all count as attended;
          the rate and counts update live. Production federates with biometric/HRMS feeds.
        </PageHeaderDescription>
      </PageHeader>
      <StaffSheet initial={initial} />
    </Shell>
  )
}

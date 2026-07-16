import { PortalDashboard, type PortalDashboardProps } from "@/components/portal-dashboard"
import { teacherDashboardData } from "@/lib/dashboards/live-data"
import { getTeacherDashboardData } from "../actions"

export const dynamic = "force-dynamic"

function teacherRuntimeDashboard(data: Awaited<ReturnType<typeof getTeacherDashboardData>>): PortalDashboardProps {
  return {
    title: "Teacher Dashboard",
    description: "Live class operations, lesson workload, early-warning cases, and circulars for the signed-in teacher.",
    tierLabel: "School",
    kpis: [
      { label: "Attendance", value: `${data.attendance.percentage}%`, hint: `${data.attendance.present}/${data.attendance.total} present today` },
      { label: "Pending Assignments", value: String(data.assignments.pending), hint: `${data.assignments.overdue} overdue` },
      { label: "Today’s Periods", value: String(data.timetable.length), hint: data.timetable[0] ? `Next: ${data.timetable[0].subject}` : "No periods scheduled" },
      { label: "Flagged Students", value: String(data.flaggedStudents.length), hint: "Open early-warning cases" },
    ],
    modules: [
      { label: "Attendance", href: "/attendance" },
      { label: "Assignments", href: "/assignments" },
      { label: "Timetable", href: "/timetable-manager" },
      { label: "Early Warning", href: "/earlywarning" },
      { label: "Notice Board", href: "/notices" },
    ],
    signals: [
      { label: "Present / Absent", value: `${data.attendance.present} / ${data.attendance.absent}`, tone: data.attendance.percentage >= 90 ? "good" : "watch" },
      { label: "Assignments Graded", value: String(data.assignments.graded), tone: "neutral" },
      { label: "Highest Risk Student", value: data.flaggedStudents[0]?.studentName ?? "None", tone: data.flaggedStudents.length ? "risk" : "good" },
      { label: "Latest Notice", value: data.notices[0]?.title ?? "No notices", tone: data.notices[0]?.priority === "high" ? "risk" : "neutral" },
    ],
    sourceSummary: "Teacher server action bound to attendance, assignments, timetable, early-warning, and notice stores.",
  }
}

export default async function TeacherDashboardPage() {
  try {
    const dashboard = await getTeacherDashboardData()
    return <PortalDashboard {...teacherRuntimeDashboard(dashboard)} />
  } catch {
    const dashboard = teacherDashboardData()
    return <PortalDashboard {...dashboard} />
  }
}

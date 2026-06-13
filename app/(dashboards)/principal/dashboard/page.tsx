import Link from "next/link"
import {
  Users,
  GraduationCap,
  BookMarked,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  IndianRupee,
  CalendarDays,
  Activity,
  Wrench,
  Bell,
  ArrowUpRight,
  Vote,
  Stamp,
  FilePlus,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { HorizontalBarChart } from "@/components/charts/horizontal-bar-chart"
import { RadarChart } from "@/components/charts/radar-chart"
import { CHART_COLORS } from "@/components/charts/chart-colors"
import { listTicketFlowsAction } from "@/app/maintenance-approvals/actions"
import { listResolutionsAction } from "@/app/smc-approvals/actions"
import { currentStep } from "@/lib/workflow"
import { MAINTENANCE_WORKFLOW } from "@/lib/workflow/definitions"

// --- Mock School Operational Data (Module 70.4) ---
const schoolStats = [
  { label: "Total Students", value: "1,248", icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Teachers Present", value: "38 / 42", icon: Users, color: "text-green-600", bg: "bg-green-50" },
  { label: "Student Attendance", value: "91.4%", icon: Activity, color: "text-teal-600", bg: "bg-teal-50" },
  { label: "Fee Collection (Apr)", value: "₹8.4L", icon: IndianRupee, color: "text-purple-600", bg: "bg-purple-50" },
]

// --- Today's Class-wise Student Attendance ---
const classAttendance = [
  { class: "Class VI", enrolled: 180, present: 168, pct: 93.3 },
  { class: "Class VII", enrolled: 195, present: 178, pct: 91.3 },
  { class: "Class VIII", enrolled: 210, present: 188, pct: 89.5 },
  { class: "Class IX", enrolled: 225, present: 205, pct: 91.1 },
  { class: "Class X", enrolled: 238, present: 224, pct: 94.1 },
  { class: "Class XI", enrolled: 115, present: 102, pct: 88.7 },
  { class: "Class XII", enrolled: 85, present: 78, pct: 91.8 },
]

// --- AI-Generated Dropout Risk Alerts ---
const dropoutRiskStudents = [
  { name: "Meena Kumari", class: "IX-B", absences: 14, risk: "High", trigger: "Chronic absenteeism + fee default" },
  { name: "Raju Prasad", class: "VIII-A", absences: 11, risk: "High", trigger: "Repeated absence after Diwali" },
  { name: "Fatima Begum", class: "X-C", absences: 8, risk: "Medium", trigger: "Declining scores + absences" },
  { name: "Arjun Singh", class: "VII-B", absences: 7, risk: "Medium", trigger: "Sibling dropout pattern" },
]

// --- Upcoming Assessments ---
const upcomingAssessments = [
  { subject: "Mathematics", class: "Class X", type: "Unit Test", date: "Apr 2", status: "Scheduled" },
  { subject: "Science", class: "Class IX", type: "Practical", date: "Apr 4", status: "Scheduled" },
  { subject: "English", class: "All Classes", type: "FA-2", date: "Apr 8–12", status: "Preparation" },
  { subject: "Social Studies", class: "Class VIII", type: "Project Eval", date: "Apr 10", status: "Scheduled" },
]

// --- Syllabus Completion ---
const syllabusCompletion = [
  { subject: "Mathematics", teacher: "Mr. Sharma", pct: 78 },
  { subject: "Science", teacher: "Ms. Rao", pct: 82 },
  { subject: "English", teacher: "Ms. Verma", pct: 91 },
  { subject: "Social Studies", teacher: "Mr. Khan", pct: 74 },
  { subject: "Hindi", teacher: "Mrs. Gupta", pct: 88 },
]

// --- Compliance Checklist ---
const complianceItems = [
  { item: "SMC Meeting (March)", status: "Done" },
  { item: "UDISE+ Data Submission", status: "Done" },
  { item: "Mid-Day Meal Register (today)", status: "Done" },
  { item: "Fire Safety Drill (Q1)", status: "Overdue" },
  { item: "Annual Health Screening", status: "Pending" },
  { item: "Teacher CPD Hours (Q1)", status: "In Progress" },
]

// --- Announcements ---
const announcements = [
  { text: "Board Exam Date Sheet released — Class X & XII", date: "Today", type: "important" },
  { text: "Parent-Teacher Meeting scheduled for April 15", date: "Yesterday", type: "normal" },
  { text: "Annual Sports Day — April 22. Volunteers needed.", date: "2 days ago", type: "normal" },
  { text: "NIPUN Bharat assessment: Grade III & V — April 10", date: "3 days ago", type: "important" },
]

// --- Workflow create entry points the school head initiates ---
// Each routes to a rich, validated create form that enters a real multi-tier
// approval workflow with a tamper-evident audit trail.
const workflowActions = [
  { label: "Raise Maintenance Ticket", href: "/maintenance-approvals/new", icon: Wrench, color: "bg-orange-100 text-orange-700" },
  { label: "Propose SMC Resolution", href: "/smc-approvals/new", icon: Vote, color: "bg-purple-100 text-purple-700" },
  { label: "File Recognition / Renewal", href: "/recognition-approvals/new", icon: Stamp, color: "bg-indigo-100 text-indigo-700" },
  { label: "New RTE Admission", href: "/admissions-approvals/new", icon: GraduationCap, color: "bg-green-100 text-green-700" },
  { label: "Apply for Leave", href: "/leave-approvals/new", icon: CalendarDays, color: "bg-blue-100 text-blue-700" },
  { label: "RBSK Health Referral", href: "/health-referrals/new", icon: ShieldAlert, color: "bg-rose-100 text-rose-700" },
]

function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, string> = {
    High: "bg-red-100 text-red-700",
    Medium: "bg-yellow-100 text-yellow-700",
    Low: "bg-green-100 text-green-700",
    Done: "bg-green-100 text-green-700",
    Overdue: "bg-red-100 text-red-700",
    Pending: "bg-yellow-100 text-yellow-700",
    "In Progress": "bg-blue-100 text-blue-700",
    Scheduled: "bg-blue-100 text-blue-700",
    Preparation: "bg-yellow-100 text-yellow-700",
  }
  return (
    <Badge className={`${map[risk] || "bg-gray-100 text-gray-700"} border-0 text-xs`}>{risk}</Badge>
  )
}

export default async function PrincipalDashboardPage() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Live: open maintenance tickets raised through the workflow (the same ones
  // the "Raise Maintenance Ticket" / "Report New Issue" actions create).
  const [tickets, resolutions] = await Promise.all([listTicketFlowsAction(), listResolutionsAction()])
  const openTickets = tickets.filter((t) => t.instance.status === "in_progress")
  const pendingResolutions = resolutions.filter((r) => r.instance.status === "in_progress").length
  const adoptedResolutions = resolutions.filter((r) => r.instance.status === "approved").length

  return (
    <div className="container mx-auto py-6 px-4 md:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Principal&apos;s Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Govt. Higher Secondary School, Chennai · {today}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-1" /> Announcements
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <BarChart3 className="h-4 w-4 mr-1" /> Reports
          </Button>
        </div>
      </div>

      {/* School KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {schoolStats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${s.bg} mb-2`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs font-medium text-gray-600 mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions — initiate a real, audited workflow */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FilePlus className="h-4 w-4 text-blue-600" /> Quick Actions
          </CardTitle>
          <CardDescription className="text-xs">
            Initiate a workflow — each opens a validated form that enters a multi-tier approval with a full audit trail.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {workflowActions.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg border hover:shadow-sm transition-shadow text-center"
              >
                <div className={`w-9 h-9 flex items-center justify-center rounded-lg ${a.color}`}>
                  <a.icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-gray-700 leading-tight">{a.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Class-wise Attendance */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Today&apos;s Attendance — Class-wise</CardTitle>
                <CardDescription className="text-xs">
                  Total present: 1,143 / 1,248 · School avg: 91.6%
                </CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                <Activity className="h-3 w-3 mr-1" /> Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart
              data={classAttendance.map((c) => ({
                label: c.class,
                value: c.pct,
                color: c.pct >= 90 ? CHART_COLORS.green : CHART_COLORS.orange,
              }))}
              height={240}
              yAxisWidth={80}
              unit="%"
            />
            <Table className="mt-2">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Class</TableHead>
                  <TableHead className="text-xs text-center">Enrolled</TableHead>
                  <TableHead className="text-xs text-center">Present</TableHead>
                  <TableHead className="text-xs text-center">Rate</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classAttendance.map((c) => (
                  <TableRow key={c.class} className="text-xs">
                    <TableCell className="font-medium">{c.class}</TableCell>
                    <TableCell className="text-center">{c.enrolled}</TableCell>
                    <TableCell className="text-center">{c.present}</TableCell>
                    <TableCell className="text-center font-semibold">{c.pct}%</TableCell>
                    <TableCell>
                      {c.pct >= 90 ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="h-3 w-3" /> Good
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-yellow-600">
                          <TrendingDown className="h-3 w-3" /> Watch
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dropout Risk & Announcements */}
        <div className="space-y-4">
          {/* AI Dropout Risk Alerts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-500" /> AI Dropout Risk Alerts
              </CardTitle>
              <CardDescription className="text-xs">Students requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {dropoutRiskStudents.map((s) => (
                <div
                  key={s.name}
                  className={`p-2.5 rounded-lg border text-xs ${
                    s.risk === "High" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-gray-800">{s.name}</span>
                    <RiskBadge risk={s.risk} />
                  </div>
                  <p className="text-muted-foreground">{s.class} · {s.absences} absences</p>
                  <p className="text-gray-600 mt-0.5 truncate">{s.trigger}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-500" /> School Notices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {announcements.map((a, i) => (
                <div
                  key={i}
                  className={`flex gap-2 p-2 rounded-lg text-xs border ${
                    a.type === "important" ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 leading-snug">{a.text}</p>
                    <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" /> {a.date}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Syllabus Completion */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookMarked className="h-4 w-4 text-teal-600" /> Syllabus Completion
            </CardTitle>
            <CardDescription className="text-xs">Subject-wise teaching portion status</CardDescription>
          </CardHeader>
          <CardContent>
            <RadarChart
              data={syllabusCompletion.map((s) => ({ subject: s.subject, value: s.pct }))}
              height={280}
              color={CHART_COLORS.teal}
            />
          </CardContent>
        </Card>

        {/* Upcoming Assessments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-indigo-600" /> Upcoming Assessments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingAssessments.map((a, i) => (
              <div key={i} className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-gray-50 border text-xs">
                <div>
                  <p className="font-semibold text-gray-800">{a.subject}</p>
                  <p className="text-muted-foreground">{a.class} · {a.type}</p>
                  <p className="text-blue-600 font-medium mt-0.5">{a.date}</p>
                </div>
                <RiskBadge risk={a.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Compliance & Infrastructure */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" /> Compliance Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {complianceItems.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                  <span className="text-gray-700">{c.item}</span>
                  <RiskBadge risk={c.status} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-orange-600" /> Infrastructure Issues
                </CardTitle>
                <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                  <Activity className="h-3 w-3 mr-1" /> Live
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {openTickets.length} open maintenance ticket{openTickets.length === 1 ? "" : "s"} in the workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {openTickets.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  No open tickets. Raise one below and it will appear here, in the workflow inbox, and in the audit trail.
                </p>
              ) : (
                openTickets.slice(0, 5).map((t) => {
                  const step = currentStep(MAINTENANCE_WORKFLOW, t.instance)
                  const where = t.details?.location ? `${t.details.location} · ` : ""
                  return (
                    <div key={t.id} className="flex items-start justify-between gap-2 p-2.5 rounded-lg border bg-orange-50 text-xs">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">{where}{t.category}</p>
                        <p className="text-muted-foreground truncate">{t.description}</p>
                        <p className="text-orange-700 mt-0.5">Awaiting: {step?.name ?? "—"}</p>
                      </div>
                      <RiskBadge risk={t.priority.charAt(0).toUpperCase() + t.priority.slice(1)} />
                    </div>
                  )
                })
              )}
              <Button asChild variant="outline" size="sm" className="w-full text-xs mt-1">
                <Link href="/maintenance-approvals/new">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> Report New Issue
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fee Collection Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-purple-600" /> Fee Collection — April 2025
              </CardTitle>
              <CardDescription className="text-xs">
                Total billed: ₹12.4L · Collected: ₹8.4L · Defaulters: 87 students
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">67.7%</div>
              <div className="text-xs text-muted-foreground">Collection rate</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={67.7} className="h-2 mb-3" />
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-xl font-bold text-green-600">₹8.4L</div>
              <div className="text-muted-foreground">Collected</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="text-xl font-bold text-yellow-600">₹4.0L</div>
              <div className="text-muted-foreground">Outstanding</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xl font-bold text-blue-600">213</div>
              <div className="text-muted-foreground">RTE Students (Free)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RTE Compliance Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-600 to-green-800 text-white border-0">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-medium text-green-200">RTE Compliance</div>
                <div className="text-2xl font-bold">PTR: 1:29</div>
                <div className="text-xs text-green-100">Norm: 1:30 · Compliant</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-medium text-blue-200">25% RTE Seats</div>
                <div className="text-2xl font-bold">213 / 312</div>
                <div className="text-xs text-blue-100">Occupied · Reimbursement: ₹1.8L pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Link href="/smc-approvals" className="block transition-transform hover:-translate-y-0.5">
          <Card className="bg-gradient-to-br from-teal-600 to-teal-800 text-white border-0">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Vote className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-medium text-teal-200">SMC Resolutions · Live</div>
                  <div className="text-2xl font-bold">{pendingResolutions} pending</div>
                  <div className="text-xs text-teal-100">{adoptedResolutions} adopted · tap to open the inbox</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

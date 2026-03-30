import Link from "next/link"
import {
  CalendarDays,
  Users,
  ClipboardList,
  GraduationCap,
  Clock,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Minus,
  BookOpen,
  Brain,
  Award,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  PageHeader,
  PageHeaderHeading,
  PageHeaderDescription,
  PageHeaderActions,
} from "@/components/page-header"

// ─── Static Mock Data (Module 70.5 — Teacher Level) ──────────────────────────

const TODAY = "29 March 2026"

const timetable = [
  { period: 1, time: "8:00–8:45",   cls: "IX-A",   subject: "Maths", room: "R-12", status: "Completed"   },
  { period: 2, time: "8:45–9:30",   cls: "X-B",    subject: "Maths", room: "R-12", status: "In Progress" },
  { period: 3, time: "9:30–10:15",  cls: "VIII-C", subject: "Maths", room: "R-14", status: "Upcoming"    },
  { period: 4, time: "10:30–11:15", cls: "X-A",    subject: "Maths", room: "R-12", status: "Upcoming"    },
  { period: 5, time: "11:15–12:00", cls: "IX-C",   subject: "Maths", room: "R-15", status: "Upcoming"    },
  { period: 6, time: "12:00–12:45", cls: "VII-B",  subject: "Maths", room: "R-11", status: "Upcoming"    },
]

const flaggedStudents = [
  { name: "Renu Devi",      cls: "IX-A",   issue: "Score dropped 32% in last 3 assessments",  type: "Academic"     },
  { name: "Mohammed Arif",  cls: "X-B",    issue: "9 consecutive absences",                    type: "Attendance"   },
  { name: "Seema Yadav",    cls: "VIII-C", issue: "Has not submitted 4 assignments",            type: "Engagement"   },
  { name: "Prashant Kumar", cls: "X-A",    issue: "Struggling with Quadratic Equations",        type: "Learning Gap" },
  { name: "Anita Patel",    cls: "IX-C",   issue: "Possible dropout risk",                     type: "AI Predicted" },
]

const attendanceSummary = [
  { cls: "IX-A",   present: 42, total: 45, pct: 93.3, label: "Good"  },
  { cls: "X-B",    present: 38, total: 42, pct: 90.5, label: "Good"  },
  { cls: "VIII-C", present: 35, total: 41, pct: 85.4, label: "Watch" },
  { cls: "VII-B",  present: 28, total: 35, pct: 80.0, label: "Watch" },
]

const pendingAssignments = [
  { title: "Chapter 3 Test",      cls: "X-B",    submitted: "40/42", due: "Apr 1", type: "Unit Test" },
  { title: "Linear Equations WS", cls: "IX-A",   submitted: "43/45", due: "Apr 2", type: "Worksheet" },
  { title: "Trigonometry Quiz",   cls: "X-A",    submitted: "38/42", due: "Apr 3", type: "MCQ Quiz"  },
  { title: "Geometry Project",    cls: "VIII-C", submitted: "29/41", due: "Apr 5", type: "Project"   },
]

const lessonPlans = [
  { cls: "IX-A Maths",   pct: 74 },
  { cls: "X-B Maths",    pct: 81 },
  { cls: "VIII-C Maths", pct: 69 },
  { cls: "X-A Maths",    pct: 78 },
]

const recentResults = [
  { student: "Ananya Mishra",  score: "94/100", grade: "A+", trend: "Improving" },
  { student: "Rajesh Tiwari",  score: "88/100", grade: "A",  trend: "Stable"    },
  { student: "Neha Sharma",    score: "76/100", grade: "B",  trend: "Declining" },
  { student: "Mohammed Arif",  score: "42/100", grade: "D",  trend: "Critical"  },
  { student: "Sunita Devi",    score: "55/100", grade: "C",  trend: "Declining" },
]

// ─── Helper Components ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Completed":   "bg-green-100 text-green-800 border-green-200",
    "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
    "Upcoming":    "bg-gray-100 text-gray-600 border-gray-200",
    "Good":        "bg-green-100 text-green-800 border-green-200",
    "Watch":       "bg-yellow-100 text-yellow-800 border-yellow-200",
    "Critical":    "bg-red-100 text-red-800 border-red-200",
    "In Progress (CPD)": "bg-blue-100 text-blue-800 border-blue-200",
  }
  return (
    <Badge className={`text-xs font-medium border ${map[status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {status}
    </Badge>
  )
}

function IssueTypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    "Academic":     "bg-orange-100 text-orange-800 border-orange-200",
    "Attendance":   "bg-red-100 text-red-800 border-red-200",
    "Engagement":   "bg-purple-100 text-purple-800 border-purple-200",
    "Learning Gap": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "AI Predicted": "bg-pink-100 text-pink-800 border-pink-200",
  }
  return (
    <Badge className={`text-xs font-medium border ${map[type] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {type}
    </Badge>
  )
}

function GradeBadge({ grade }: { grade: string }) {
  const map: Record<string, string> = {
    "A+": "bg-green-100 text-green-800 border-green-200",
    "A":  "bg-green-100 text-green-700 border-green-200",
    "B":  "bg-blue-100 text-blue-800 border-blue-200",
    "C":  "bg-yellow-100 text-yellow-800 border-yellow-200",
    "D":  "bg-red-100 text-red-800 border-red-200",
  }
  return (
    <Badge className={`text-xs font-semibold border ${map[grade] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {grade}
    </Badge>
  )
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "Improving") return <TrendingUp className="h-4 w-4 text-green-600 inline" />
  if (trend === "Declining" || trend === "Critical") return <TrendingDown className="h-4 w-4 text-red-600 inline" />
  return <Minus className="h-4 w-4 text-gray-500 inline" />
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default async function TeacherDashboardPage() {
  return (
    <div className="container mx-auto py-6 space-y-8 max-w-7xl">

      {/* ── Header ── */}
      <PageHeader>
        <PageHeaderHeading>Teacher Dashboard</PageHeaderHeading>
        <PageHeaderDescription>
          Ms. Priya Sharma, B.Sc. B.Ed. | Mathematics | Govt. SSS Delhi | {TODAY}
        </PageHeaderDescription>
      </PageHeader>

      {/* ── Section 1: KPI Cards ── */}
      <section>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                <CalendarDays className="h-4 w-4 text-blue-500" />
                Classes Today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">6</p>
              <p className="text-xs text-muted-foreground mt-1">Periods 1–6</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                <Users className="h-4 w-4 text-green-500" />
                Students in Charge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">248</p>
              <p className="text-xs text-muted-foreground mt-1">Across 4 sections</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                <ClipboardList className="h-4 w-4 text-orange-500" />
                Assignments to Grade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">14</p>
              <p className="text-xs text-muted-foreground mt-1">Pending</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                <GraduationCap className="h-4 w-4 text-purple-500" />
                CPD Hours Completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                18 <span className="text-lg font-normal text-muted-foreground">/ 50</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Annual target</p>
              <Progress value={36} className="mt-2 h-1.5 [&>div]:bg-purple-500" />
            </CardContent>
          </Card>

        </div>
      </section>

      {/* ── Section 2: Timetable + Flagged Students ── */}
      <section className="grid gap-6 lg:grid-cols-2">

        {/* Today's Timetable */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-blue-500" />
              Today&apos;s Timetable
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">Period</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timetable.map((row) => (
                  <TableRow key={row.period} className={row.status === "In Progress" ? "bg-blue-50/40" : ""}>
                    <TableCell className="font-medium text-center">{row.period}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{row.time}</TableCell>
                    <TableCell className="font-medium">{row.cls}</TableCell>
                    <TableCell>{row.subject}</TableCell>
                    <TableCell className="text-muted-foreground">{row.room}</TableCell>
                    <TableCell><StatusBadge status={row.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Students Needing Attention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Students Needing Attention
              <Badge className="ml-auto bg-orange-100 text-orange-800 border border-orange-200 text-xs">AI-Flagged</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {flaggedStudents.map((s) => (
              <div key={s.name} className="flex items-start gap-3 rounded-lg border p-3 bg-muted/20">
                <AlertTriangle className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{s.name}</span>
                    <span className="text-xs text-muted-foreground">{s.cls}</span>
                    <IssueTypeBadge type={s.type} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.issue}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      </section>

      {/* ── Section 3: Attendance + Pending Assignments + Professional Development ── */}
      <section className="grid gap-6 lg:grid-cols-3">

        {/* Class Attendance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-green-500" />
              Class Attendance — Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {attendanceSummary.map((a) => (
              <div key={a.cls} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{a.cls}</span>
                    <StatusBadge status={a.label} />
                  </div>
                  <span className="text-sm font-semibold">{a.present}/{a.total}</span>
                </div>
                <Progress
                  value={a.pct}
                  className={`h-2 ${a.label === "Good" ? "[&>div]:bg-green-500" : "[&>div]:bg-yellow-500"}`}
                />
                <p className="text-xs text-muted-foreground text-right">{a.pct}%</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pending Assignments to Grade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5 text-orange-500" />
              Pending Assignments to Grade
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingAssignments.map((a) => (
                  <TableRow key={a.title}>
                    <TableCell className="font-medium text-xs">{a.title}</TableCell>
                    <TableCell className="text-xs">{a.cls}</TableCell>
                    <TableCell className="text-xs">{a.submitted}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{a.due}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{a.type}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Professional Development */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-5 w-5 text-purple-500" />
              Professional Development
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium">CPD Hours</span>
                <span className="font-semibold text-purple-600">18 / 50</span>
              </div>
              <Progress value={36} className="h-1.5 [&>div]:bg-purple-500" />
              <p className="text-xs text-muted-foreground">36% of annual target completed</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Modules Completed</span>
                <span className="font-semibold text-blue-600">4 / 12</span>
              </div>
              <Progress value={33} className="h-1.5 [&>div]:bg-blue-500" />
            </div>

            <div className="rounded-lg border p-3 bg-muted/20 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Next Module</p>
              <p className="text-sm font-semibold">Competency-Based Assessment</p>
              <p className="text-xs text-muted-foreground">Due: Apr 15, 2026</p>
            </div>

            <div className="rounded-lg border p-3 bg-muted/20 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Certification</p>
              <p className="text-sm font-semibold">NIPUN Maths Facilitator</p>
              <StatusBadge status="In Progress" />
            </div>

          </CardContent>
        </Card>

      </section>

      {/* ── Section 4: Lesson Plan Status + Recent Assessment Results ── */}
      <section className="grid gap-6 lg:grid-cols-2">

        {/* Lesson Plan Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Lesson Plan Status — Syllabus Coverage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {lessonPlans.map((lp) => (
              <div key={lp.cls} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{lp.cls}</span>
                  <span className="text-sm font-semibold">{lp.pct}%</span>
                </div>
                <Progress
                  value={lp.pct}
                  className={`h-2 ${
                    lp.pct >= 80
                      ? "[&>div]:bg-green-500"
                      : lp.pct >= 70
                      ? "[&>div]:bg-blue-500"
                      : "[&>div]:bg-yellow-500"
                  }`}
                />
                <p className="text-xs text-muted-foreground">
                  {lp.pct >= 80
                    ? "On track"
                    : lp.pct >= 70
                    ? "Progressing"
                    : "Needs acceleration"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Assessment Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-5 w-5 text-green-500" />
              Recent Assessment Results
            </CardTitle>
            <CardDescription>Class X-B — Last Unit Test</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentResults.map((r) => (
                  <TableRow
                    key={r.student}
                    className={
                      r.trend === "Critical"
                        ? "bg-red-50/50"
                        : r.trend === "Declining"
                        ? "bg-orange-50/30"
                        : ""
                    }
                  >
                    <TableCell className="font-medium text-sm">{r.student}</TableCell>
                    <TableCell className="text-sm">{r.score}</TableCell>
                    <TableCell><GradeBadge grade={r.grade} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <TrendIcon trend={r.trend} />
                        <span className="text-xs text-muted-foreground">{r.trend}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </section>

    </div>
  )
}

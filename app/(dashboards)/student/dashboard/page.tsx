import Link from "next/link"
import {
  CalendarDays,
  BookOpen,
  ClipboardList,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  IndianRupee,
  Brain,
  AlertCircle,
  CheckCircle2,
  Clock,
  Lightbulb,
  BarChart3,
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

// ─── Static Mock Data (Module 70.6 — Learner Level) ──────────────────────────

const TODAY = "29 March 2026"

const subjects = [
  { name: "Mathematics",    pct: 88, teacher: "Ms. Sharma",  next: "Chapter 8: Trigonometry",       color: "bg-blue-500"   },
  { name: "Science",        pct: 84, teacher: "Mr. Gupta",   next: "Lab Practical — Apr 4",          color: "bg-green-500"  },
  { name: "English",        pct: 92, teacher: "Ms. Verma",   next: "Essay Submission — Apr 6",       color: "bg-purple-500" },
  { name: "Social Studies", pct: 79, teacher: "Mr. Khan",    next: "Map Work Assignment — Apr 8",    color: "bg-orange-500" },
  { name: "Hindi",          pct: 91, teacher: "Mrs. Joshi",  next: "Grammar Test — Apr 10",          color: "bg-teal-500"   },
]

const attendanceTrend = [
  { month: "Nov 2024", present: 22, total: 24, pct: 91.7, status: "Good"      },
  { month: "Dec 2024", present: 18, total: 20, pct: 90.0, status: "Good"      },
  { month: "Jan 2025", present: 24, total: 26, pct: 92.3, status: "Good"      },
  { month: "Feb 2025", present: 20, total: 22, pct: 90.9, status: "Good"      },
  { month: "Mar 2025", present: 23, total: 25, pct: 92.0, status: "Good"      },
  { month: "Apr 2025", present: 8,  total: 8,  pct: 100.0, status: "Excellent" },
]

const pendingAssignments = [
  { title: "Linear Equations Worksheet",     subject: "Maths",   due: "Apr 2", action: "Submit",  priority: "High"   },
  { title: "Trigonometry Quiz",              subject: "Maths",   due: "Apr 3", action: "Attempt", priority: "Medium" },
  { title: "Essay: My Role in Nation Building", subject: "English", due: "Apr 6", action: "Submit", priority: "Medium" },
]

const recentResults = [
  { subject: "Mathematics",    assessment: "Unit Test 3",  score: "94/100", grade: "A+", date: "Mar 28" },
  { subject: "Science",        assessment: "Practical",    score: "38/40",  grade: "A+", date: "Mar 25" },
  { subject: "English",        assessment: "FA-1",         score: "46/50",  grade: "A",  date: "Mar 20" },
  { subject: "Social Studies", assessment: "Map Work",     score: "34/40",  grade: "B+", date: "Mar 18" },
  { subject: "Hindi",          assessment: "Grammar",      score: "42/50",  grade: "A",  date: "Mar 15" },
]

const upcomingSchedule = [
  { date: "Apr 2",  event: "Linear Equations WS due",  subject: "Maths",           type: "Assignment" },
  { date: "Apr 3",  event: "Trigonometry Quiz",         subject: "Maths",           type: "Assessment" },
  { date: "Apr 4",  event: "Science Lab Practical",     subject: "Science",         type: "Assessment" },
  { date: "Apr 6",  event: "Essay Submission",          subject: "English",         type: "Assignment" },
  { date: "Apr 8",  event: "Map Work Assignment",       subject: "Social Studies",  type: "Assignment" },
  { date: "Apr 10", event: "Grammar Test",              subject: "Hindi",           type: "Assessment" },
  { date: "Apr 15", event: "Parent-Teacher Meeting",    subject: "—",               type: "Event"      },
  { date: "Apr 22", event: "Annual Sports Day",         subject: "—",               type: "Event"      },
]

const competencies = [
  { area: "Mathematical Reasoning",         pct: 82, color: "bg-blue-500"   },
  { area: "Scientific Inquiry",             pct: 78, color: "bg-green-500"  },
  { area: "Language Proficiency (English)", pct: 88, color: "bg-purple-500" },
  { area: "Language Proficiency (Hindi)",   pct: 85, color: "bg-teal-500"   },
  { area: "Social Awareness",               pct: 72, color: "bg-orange-500" },
  { area: "Digital Literacy",               pct: 65, color: "bg-red-500"    },
  { area: "Critical Thinking",              pct: 74, color: "bg-yellow-500" },
]

// ─── Helper Components ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Excellent": "bg-green-100 text-green-800 border-green-200",
    "Good":      "bg-blue-100 text-blue-800 border-blue-200",
    "Medium":    "bg-yellow-100 text-yellow-800 border-yellow-200",
    "High":      "bg-red-100 text-red-800 border-red-200",
    "Low":       "bg-gray-100 text-gray-600 border-gray-200",
  }
  return (
    <Badge className={`text-xs font-medium border ${map[status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {status}
    </Badge>
  )
}

function GradeBadge({ grade }: { grade: string }) {
  const map: Record<string, string> = {
    "A+": "bg-green-100 text-green-800 border-green-200",
    "A":  "bg-green-100 text-green-700 border-green-200",
    "B+": "bg-blue-100 text-blue-800 border-blue-200",
    "B":  "bg-blue-100 text-blue-700 border-blue-200",
    "C":  "bg-yellow-100 text-yellow-800 border-yellow-200",
    "D":  "bg-red-100 text-red-800 border-red-200",
  }
  return (
    <Badge className={`text-xs font-semibold border ${map[grade] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {grade}
    </Badge>
  )
}

function EventTypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    "Assignment": "bg-orange-100 text-orange-800 border-orange-200",
    "Assessment": "bg-blue-100 text-blue-800 border-blue-200",
    "Event":      "bg-purple-100 text-purple-800 border-purple-200",
  }
  return (
    <Badge className={`text-xs font-medium border ${map[type] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {type}
    </Badge>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    "High":   "bg-red-100 text-red-800 border-red-200",
    "Medium": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "Low":    "bg-gray-100 text-gray-600 border-gray-200",
  }
  return (
    <Badge className={`text-xs font-medium border ${map[priority] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {priority}
    </Badge>
  )
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default async function StudentDashboardPage() {
  return (
    <div className="container mx-auto py-6 space-y-8 max-w-7xl">

      {/* ── Header ── */}
      <PageHeader>
        <PageHeaderHeading>My Learning Dashboard</PageHeaderHeading>
        <PageHeaderDescription>
          Ananya Mishra | Class X-B | Roll No. 2025-X-B-042 | {TODAY}
        </PageHeaderDescription>
      </PageHeader>

      {/* ── Section 1: KPI Cards ── */}
      <section>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                <CalendarDays className="h-4 w-4 text-blue-500" />
                Attendance (This Month)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">94.1%</p>
              <p className="text-xs text-muted-foreground mt-1">8 / 8 days present (Apr)</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                <Star className="h-4 w-4 text-green-500" />
                Overall Grade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">A</p>
              <p className="text-xs text-muted-foreground mt-1">87.4% average across subjects</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                <ClipboardList className="h-4 w-4 text-orange-500" />
                Pending Assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">3</p>
              <p className="text-xs text-muted-foreground mt-1">Action required</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                <Brain className="h-4 w-4 text-purple-500" />
                Competency Level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">Proficient</p>
              <p className="text-xs text-muted-foreground mt-1">Level 3 / 4 (NCF 2023)</p>
            </CardContent>
          </Card>

        </div>
      </section>

      {/* ── Section 2: My Subjects + Attendance Trend ── */}
      <section className="grid gap-6 lg:grid-cols-2">

        {/* My Subjects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-5 w-5 text-blue-500" />
              My Subjects
            </CardTitle>
            <CardDescription>Current performance and upcoming activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {subjects.map((s) => (
              <div key={s.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold">{s.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">— {s.teacher}</span>
                  </div>
                  <span className="text-sm font-bold">{s.pct}%</span>
                </div>
                <Progress value={s.pct} className={`h-2 [&>div]:${s.color}`} />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Next:</span> {s.next}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-5 w-5 text-green-500" />
              Attendance Trend
            </CardTitle>
            <CardDescription>Monthly attendance record</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-center">Present</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">%</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceTrend.map((row) => (
                  <TableRow key={row.month} className={row.status === "Excellent" ? "bg-green-50/40" : ""}>
                    <TableCell className="text-sm font-medium whitespace-nowrap">{row.month}</TableCell>
                    <TableCell className="text-center text-sm">{row.present}</TableCell>
                    <TableCell className="text-center text-sm">{row.total}</TableCell>
                    <TableCell className="text-center text-sm font-semibold">{row.pct.toFixed(1)}%</TableCell>
                    <TableCell><StatusBadge status={row.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </section>

      {/* ── Section 3: Pending Assignments + Recent Results + Upcoming Schedule ── */}
      <section className="grid gap-6 lg:grid-cols-3">

        {/* Pending Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Pending Assignments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingAssignments.map((a) => (
              <div key={a.title} className="rounded-lg border p-3 bg-muted/20 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight">{a.title}</p>
                  <PriorityBadge priority={a.priority} />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BookOpen className="h-3 w-3" />
                  <span>{a.subject}</span>
                  <Clock className="h-3 w-3 ml-1" />
                  <span>Due {a.due}</span>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs w-full">
                  {a.action}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Assessment Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-green-500" />
              Recent Assessment Results
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentResults.map((r) => (
                  <TableRow key={`${r.subject}-${r.assessment}`}>
                    <TableCell className="text-xs font-medium whitespace-nowrap">{r.subject}</TableCell>
                    <TableCell className="text-xs">{r.assessment}</TableCell>
                    <TableCell className="text-xs font-semibold">{r.score}</TableCell>
                    <TableCell><GradeBadge grade={r.grade} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Upcoming Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-purple-500" />
              Upcoming Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {upcomingSchedule.map((item) => (
              <div key={`${item.date}-${item.event}`} className="flex items-start gap-3">
                <div className="w-12 shrink-0 text-center">
                  <span className="text-xs font-bold text-primary whitespace-nowrap">{item.date}</span>
                </div>
                <div className="flex-1 min-w-0 border-l pl-3">
                  <p className="text-xs font-medium leading-tight">{item.event}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.subject !== "—" && (
                      <span className="text-xs text-muted-foreground">{item.subject}</span>
                    )}
                    <EventTypeBadge type={item.type} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      </section>

      {/* ── Section 4: Competency Profile + Learning Pathway + Fee Status ── */}
      <section className="grid gap-6 lg:grid-cols-3">

        {/* Competency Profile */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-5 w-5 text-blue-500" />
              Competency Profile
            </CardTitle>
            <CardDescription>NCF 2023 competency areas — current level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {competencies.map((c) => (
              <div key={c.area} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{c.area}</span>
                  <span className="text-sm font-bold">{c.pct}%</span>
                </div>
                <Progress
                  value={c.pct}
                  className={`h-2 [&>div]:${c.color}`}
                />
                <p className="text-xs text-muted-foreground">
                  {c.pct >= 85
                    ? "Advanced — exceeding expectations"
                    : c.pct >= 75
                    ? "Proficient — meeting expectations"
                    : c.pct >= 65
                    ? "Developing — approaching expectations"
                    : "Beginning — needs focused support"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right column: Learning Pathway + Fee Status */}
        <div className="space-y-6">

          {/* AI Learning Pathway Recommendation */}
          <Card className="border-l-4 border-l-yellow-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                AI Learning Pathway
              </CardTitle>
              <CardDescription>Personalised recommendation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Based on your performance, focus on:
              </p>
              <ol className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <span className="font-bold text-orange-600 shrink-0">1.</span>
                  <span>
                    <span className="font-medium">Social Studies Map Skills</span>
                    <span className="text-muted-foreground"> (score: 79%) — explore DIKSHA modules on Map Reading</span>
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="font-bold text-red-600 shrink-0">2.</span>
                  <span>
                    <span className="font-medium">Digital Literacy</span>
                    <span className="text-muted-foreground"> (score: 65%) — complete DIKSHA Basic Computing module</span>
                  </span>
                </li>
              </ol>
              <div className="rounded-md bg-yellow-50 border border-yellow-200 p-2 mt-1">
                <p className="text-xs text-yellow-800 font-medium">Recommended Resources</p>
                <p className="text-xs text-yellow-700 mt-0.5">DIKSHA: Map Reading &amp; Basic Computing modules</p>
              </div>
            </CardContent>
          </Card>

          {/* Fee Status */}
          <Card className="border-l-4 border-l-teal-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IndianRupee className="h-5 w-5 text-teal-500" />
                Fee Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Total Annual Fee</p>
                  <p className="font-semibold">₹12,000</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="font-semibold text-green-600">₹9,000</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Balance Due</p>
                  <p className="font-semibold text-red-600">₹3,000</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Next Due Date</p>
                  <p className="font-semibold">May 1, 2026</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Paid</span>
                  <span>75%</span>
                </div>
                <Progress value={75} className="h-2 [&>div]:bg-teal-500" />
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-xs w-full justify-center">
                Balance of ₹3,000 due by May 1
              </Badge>
            </CardContent>
          </Card>

        </div>
      </section>

    </div>
  )
}

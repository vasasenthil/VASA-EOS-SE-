import {
  CalendarDays,
  BookOpen,
  ClipboardList,
  IndianRupee,
  TrendingUp,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
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
} from "@/components/page-header"
import { AreaChart } from "@/components/charts/area-chart"
import { DonutChart } from "@/components/charts/donut-chart"
import { CHART_COLORS } from "@/components/charts/chart-colors"

// ── Static Mock Data ───────────────────────────────────────────────────────────

const CHILD = {
  name: "Aryan Sharma",
  class: "Class 9 — Section A",
  school: "Government Senior Secondary School, Jaipur",
  rollNo: "2024-IX-A-018",
  photo: null,
}

const attendanceTrend = [
  { month: "Oct", pct: 90 },
  { month: "Nov", pct: 88 },
  { month: "Dec", pct: 92 },
  { month: "Jan", pct: 86 },
  { month: "Feb", pct: 94 },
  { month: "Mar", pct: 91 },
]

const subjectMarks = [
  { name: "Mathematics",    value: 88, color: CHART_COLORS.blue   },
  { name: "Science",        value: 82, color: CHART_COLORS.green  },
  { name: "English",        value: 91, color: CHART_COLORS.purple },
  { name: "Social Studies", value: 76, color: CHART_COLORS.orange },
  { name: "Hindi",          value: 89, color: CHART_COLORS.teal   },
]

const recentExams = [
  { subject: "Mathematics",    exam: "Unit Test 3",   score: "44/50", grade: "A+", date: "28 Mar" },
  { subject: "Science",        exam: "Practical",     score: "38/40", grade: "A+", date: "25 Mar" },
  { subject: "English",        exam: "FA-1",          score: "46/50", grade: "A",  date: "20 Mar" },
  { subject: "Social Studies", exam: "Map Work",      score: "34/40", grade: "B+", date: "18 Mar" },
  { subject: "Hindi",          exam: "Grammar Test",  score: "42/50", grade: "A",  date: "15 Mar" },
]

const homework = [
  { subject: "Mathematics",    title: "Linear Equations WS",        due: "2 Apr",  status: "Pending" },
  { subject: "English",        title: "Essay: My Role in Society",  due: "6 Apr",  status: "Pending" },
  { subject: "Science",        title: "Lab Report — Photosynthesis",due: "8 Apr",  status: "Submitted" },
]

const feeStatus = {
  totalAnnual: 12000,
  paid: 9000,
  due: 3000,
  nextDue: "15 Apr 2026",
  term: "Term 3 Fee",
}

const notices = [
  { title: "Annual Day — 15 April", type: "Event",   date: "30 Mar", urgent: false },
  { title: "PTM Scheduled — 5 April", type: "Meeting", date: "28 Mar", urgent: true  },
  { title: "Holiday on 14 April (Dr. Ambedkar Jayanti)", type: "Holiday", date: "27 Mar", urgent: false },
]

const statCards = [
  {
    title: "Attendance",
    value: "91%",
    sub: "This month",
    icon: CalendarDays,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Avg. Marks",
    value: "85.2%",
    sub: "Across subjects",
    icon: BookOpen,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Pending HW",
    value: "2",
    sub: "Assignments due",
    icon: ClipboardList,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    title: "Fee Due",
    value: "₹3,000",
    sub: feeStatus.term,
    icon: IndianRupee,
    color: "text-red-600",
    bg: "bg-red-50",
  },
]

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ParentDashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader>
        <div>
          <PageHeaderHeading>Parent Dashboard</PageHeaderHeading>
          <PageHeaderDescription>
            Welcome! Tracking {CHILD.name} · {CHILD.class} · Roll {CHILD.rollNo}
          </PageHeaderDescription>
        </div>
      </PageHeader>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.title}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.title}</p>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.sub}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attendance Trend + Subject Marks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Attendance Trend
            </CardTitle>
            <CardDescription>Monthly attendance % — last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={attendanceTrend}
              xKey="month"
              series={[{ key: "pct", name: "Attendance %", color: CHART_COLORS.green }]}
              height={220}
              unit="%"
              yDomain={[80, 100]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Subject Marks Distribution
            </CardTitle>
            <CardDescription>Average marks % across subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={subjectMarks}
              height={240}
              innerRadius={55}
              outerRadius={90}
              centerLabel="Avg"
              centerValue="85%"
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Exam Results + Homework */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Exam Results</CardTitle>
            <CardDescription>Latest assessments and scores</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentExams.map((r) => (
                  <TableRow key={r.subject + r.exam}>
                    <TableCell className="font-medium">{r.subject}</TableCell>
                    <TableCell>{r.exam}</TableCell>
                    <TableCell>{r.score}</TableCell>
                    <TableCell>
                      <Badge variant={r.grade.startsWith("A") ? "default" : "secondary"}>
                        {r.grade}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-amber-600" />
              Homework & Assignments
            </CardTitle>
            <CardDescription>Upcoming due dates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {homework.map((h) => (
              <div
                key={h.title}
                className="flex items-start gap-3 p-3 rounded-lg border bg-slate-50"
              >
                {h.status === "Submitted" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                ) : (
                  <Clock className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{h.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {h.subject} · Due {h.due}
                  </p>
                </div>
                <Badge
                  variant={h.status === "Submitted" ? "default" : "outline"}
                  className="shrink-0"
                >
                  {h.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Fee Status + School Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-blue-600" />
              Fee Status
            </CardTitle>
            <CardDescription>Annual fee overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-slate-50 border">
                <p className="text-xs text-muted-foreground">Annual Fee</p>
                <p className="text-lg font-bold">₹{feeStatus.totalAnnual.toLocaleString()}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-xs text-green-700">Paid</p>
                <p className="text-lg font-bold text-green-700">₹{feeStatus.paid.toLocaleString()}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs text-red-700">Due</p>
                <p className="text-lg font-bold text-red-700">₹{feeStatus.due.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-amber-50">
              <div>
                <p className="font-medium text-sm">{feeStatus.term}</p>
                <p className="text-xs text-muted-foreground">Due by {feeStatus.nextDue}</p>
              </div>
              <Button size="sm">Pay Now</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-600" />
              School Notices
            </CardTitle>
            <CardDescription>Latest announcements from school</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notices.map((n) => (
              <div
                key={n.title}
                className="flex items-start gap-3 p-3 rounded-lg border"
              >
                {n.urgent ? (
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                ) : (
                  <Bell className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.date}</p>
                </div>
                <Badge variant="outline">{n.type}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

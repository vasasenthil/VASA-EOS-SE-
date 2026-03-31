import {
  BookMarked,
  Users,
  Folder,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Target,
  Wrench,
  BookOpen,
  GraduationCap,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { GroupedBarChart } from "@/components/charts/grouped-bar-chart"
import { CHART_COLORS } from "@/components/charts/chart-colors"

// ── Mock Data ─────────────────────────────────────────────────────────────────

const kpis = [
  { label: "Maths Teachers Coordinated", value: "6", sub: "across all classes", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Total Students (Maths)", value: "1,248", sub: "all classes VI–XII", icon: GraduationCap, color: "text-indigo-600", bg: "bg-indigo-50" },
  { label: "Average Pass Rate", value: "74.8%", sub: "last assessment cycle", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  { label: "Item Bank Contributions", value: "142", sub: "questions this year", icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
]

const teacherCoverage = [
  { teacher: "Ms. Sharma",  classes: "IX-A, X-B",  done: 7, total: 10, pct: 74, status: "On Track" },
  { teacher: "Mr. Verma",   classes: "VIII-A, VII-B", done: 8, total: 11, pct: 73, status: "On Track" },
  { teacher: "Ms. Kapoor",  classes: "XI-A, XII-B", done: 6, total: 9,  pct: 67, status: "Slightly Behind" },
  { teacher: "Mr. Singh",   classes: "VI-C, VI-D",  done: 9, total: 11, pct: 82, status: "Ahead" },
  { teacher: "Ms. Jain",    classes: "X-A, IX-C",   done: 7, total: 10, pct: 74, status: "On Track" },
  { teacher: "Mr. Rao",     classes: "VIII-B, VII-A", done: 6, total: 11, pct: 55, status: "Behind — Alert" },
]

const classPerformance = [
  { cls: "VI-C",  enrolled: 45, avg: 68.4, pass: 91.1, below35: 4, above75: 22 },
  { cls: "VII-A", enrolled: 42, avg: 62.1, pass: 85.7, below35: 6, above75: 14 },
  { cls: "VIII-B",enrolled: 41, avg: 58.7, pass: 80.5, below35: 8, above75: 10 },
  { cls: "IX-A",  enrolled: 45, avg: 71.2, pass: 93.3, below35: 3, above75: 26 },
  { cls: "X-B",   enrolled: 42, avg: 74.8, pass: 95.2, below35: 2, above75: 28 },
  { cls: "XI-A",  enrolled: 38, avg: 55.3, pass: 73.7, below35: 10, above75: 9 },
  { cls: "XII-B", enrolled: 34, avg: 60.1, pass: 76.5, below35: 8, above75: 11 },
]

const itemBankTopics = [
  { topic: "Algebra & Polynomials", questions: 184 },
  { topic: "Trigonometry", questions: 142 },
  { topic: "Coordinate Geometry", questions: 98 },
  { topic: "Calculus (Grade XII)", questions: 64 },
  { topic: "Statistics & Probability", questions: 71 },
  { topic: "Quadratic Equations", questions: 156 },
  { topic: "Number System", questions: 210 },
]

const resources = [
  { item: "Scientific Calculators", available: 120, inUse: 80, status: "OK" },
  { item: "Geometry Sets", available: 180, inUse: 140, status: "OK" },
  { item: "Graph Paper Reams", available: 12, inUse: 0, status: "Reorder" },
  { item: "Maths Lab Equipment (sets)", available: 8, inUse: 0, status: "2 Out of Order" },
  { item: "Digital Projectors (Maths rooms)", available: 6, inUse: 0, status: "2 Out of Order" },
  { item: "NCERT Textbooks (curr. year)", available: 1248, inUse: 1248, status: "Fully Distributed" },
]

const coordLog = [
  { date: "Apr 1",  entry: "Monthly subject meeting — FA-2 paper setting began" },
  { date: "Mar 28", entry: "Mr. Rao's classes identified for additional coaching sessions" },
  { date: "Mar 22", entry: "Item bank review — 45 new MCQs added (Ms. Sharma & Ms. Kapoor)" },
  { date: "Mar 15", entry: "NIPUN Maths workshop for Grade 3–5 feeder classes" },
  { date: "Mar 10", entry: "State Maths Olympiad coordination — 12 students enrolled" },
]

const upcomingActions = [
  { action: "FA-2 question paper submission deadline (all teachers)", date: "Apr 5", priority: "High" },
  { action: "FA-2 Examinations (Classes VI–IX)", date: "Apr 8–12", priority: "High" },
  { action: "Remedial class plan submission (Mr. Rao's classes)", date: "Apr 15", priority: "High" },
  { action: "NCF-aligned lesson plan review for Class XI–XII", date: "Apr 22", priority: "Medium" },
  { action: "SA-2 syllabus finalisation", date: "May 1", priority: "Medium" },
]

const remediationPlan = [
  { cls: "VIII-B", students: 8,  planStatus: "Active", teacher: "Mr. Rao",    sessionsPerWeek: 3 },
  { cls: "VII-A",  students: 6,  planStatus: "Active", teacher: "Mr. Verma",  sessionsPerWeek: 2 },
  { cls: "XI-A",   students: 10, planStatus: "Draft",  teacher: "Ms. Kapoor", sessionsPerWeek: 4 },
  { cls: "XII-B",  students: 8,  planStatus: "Draft",  teacher: "Ms. Kapoor", sessionsPerWeek: 3 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "On Track": "bg-green-100 text-green-700",
    "Ahead": "bg-teal-100 text-teal-700",
    "Slightly Behind": "bg-yellow-100 text-yellow-700",
    "Behind — Alert": "bg-red-100 text-red-700",
    "Active": "bg-green-100 text-green-700",
    "Draft": "bg-yellow-100 text-yellow-700",
    "High": "bg-red-100 text-red-700",
    "Medium": "bg-yellow-100 text-yellow-700",
    "OK": "bg-green-100 text-green-700",
    "Reorder": "bg-red-100 text-red-700",
    "Fully Distributed": "bg-green-100 text-green-700",
    "2 Out of Order": "bg-orange-100 text-orange-700",
  }
  return (
    <Badge className={`${map[status] ?? "bg-gray-100 text-gray-600"} border-0 text-xs`}>
      {status}
    </Badge>
  )
}

function coveragePct(pct: number) {
  if (pct >= 80) return "text-green-600"
  if (pct >= 65) return "text-blue-600"
  return "text-red-600"
}

export default async function SubjectInchargeDashboardPage() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })

  return (
    <div className="container mx-auto py-6 px-4 md:px-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Subject Incharge — Mathematics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mr. Arun Mehta · Senior Mathematics Teacher · Govt. SSS Delhi
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3" /> {today}
          </p>
        </div>
        <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs px-3 py-1 self-start">
          <BookMarked className="h-3 w-3 mr-1" /> Module 25.4 · Subject Coordination
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${k.bg} mb-2`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
              <div className="text-xs font-medium text-gray-700 mt-0.5 leading-tight">{k.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{k.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Teacher Coverage + Class Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" /> Teacher-wise Syllabus Coverage
            </CardTitle>
            <CardDescription className="text-xs">Chapters completed vs total assigned</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {teacherCoverage.map((t) => (
              <div key={t.teacher} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-gray-800">{t.teacher}</span>
                    <span className="text-muted-foreground ml-2">({t.classes})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${coveragePct(t.pct)}`}>{t.pct}%</span>
                    <StatusBadge status={t.status} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={t.pct} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground shrink-0">{t.done}/{t.total} ch.</span>
                </div>
              </div>
            ))}
            {teacherCoverage.find(t => t.status === "Behind — Alert") && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 mt-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 font-medium">
                  Mr. Rao is significantly behind (55%). Immediate intervention and coaching support recommended.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-600" /> Class-wise Performance
            </CardTitle>
            <CardDescription className="text-xs">Last assessment cycle · All Maths classes</CardDescription>
          </CardHeader>
          <CardContent>
            <GroupedBarChart
              data={classPerformance.map((c) => ({ label: c.cls, avg: c.avg, pass: c.pass }))}
              xKey="label"
              series={[
                { key: "avg", name: "Avg Score", color: CHART_COLORS.blue },
                { key: "pass", name: "Pass %", color: CHART_COLORS.green },
              ]}
              height={280}
              unit=""
              xAxisAngle={-20}
            />
            <Table className="mt-2">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Class</TableHead>
                  <TableHead className="text-xs text-center">Avg Score</TableHead>
                  <TableHead className="text-xs text-center">Pass%</TableHead>
                  <TableHead className="text-xs text-center text-red-600">Below 35%</TableHead>
                  <TableHead className="text-xs text-center text-green-600">Above 75%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classPerformance.map((c) => (
                  <TableRow key={c.cls} className="text-xs">
                    <TableCell className="font-semibold">{c.cls}</TableCell>
                    <TableCell className="text-center">{c.avg}</TableCell>
                    <TableCell className="text-center">
                      <span className={c.pass >= 90 ? "text-green-600 font-semibold" : c.pass >= 75 ? "text-blue-600" : "text-red-600 font-semibold"}>
                        {c.pass}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-red-600 font-medium">{c.below35}</TableCell>
                    <TableCell className="text-center text-green-600 font-medium">{c.above75}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Item Bank + Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-600" /> Item Bank Status
            </CardTitle>
            <CardDescription className="text-xs">
              Total: 1,842 questions · Types: MCQ 48% | Short Answer 32% | Long 14% | Case Study 6%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {itemBankTopics.map((t) => (
              <div key={t.topic} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-gray-700">{t.topic}</span>
                  <span className={`font-semibold ${t.questions < 80 ? "text-red-600" : "text-gray-700"}`}>
                    {t.questions} Qs {t.questions < 80 && "⚠ Enrich"}
                  </span>
                </div>
                <Progress value={Math.min(100, (t.questions / 250) * 100)} className="h-1.5" />
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-1">Topics with &lt;80 questions need enrichment (marked ⚠).</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Folder className="h-4 w-4 text-teal-600" /> Resource Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Item</TableHead>
                  <TableHead className="text-xs text-center">Available</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((r) => (
                  <TableRow key={r.item} className="text-xs">
                    <TableCell className="font-medium">{r.item}</TableCell>
                    <TableCell className="text-center">{r.available}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Coordination Log + Upcoming Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-blue-600" /> Coordination Log
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {coordLog.map((l, i) => (
              <div key={i} className="flex gap-3 text-xs py-2 border-b last:border-0">
                <span className="text-blue-600 font-semibold shrink-0 w-14">{l.date}</span>
                <span className="text-gray-700">{l.entry}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-600" /> Upcoming Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingActions.map((a, i) => (
              <div key={i} className="flex items-start justify-between gap-2 p-2.5 rounded-lg border bg-gray-50 text-xs">
                <div>
                  <p className="font-medium text-gray-800">{a.action}</p>
                  <p className="text-blue-600 mt-0.5 font-semibold">{a.date}</p>
                </div>
                <StatusBadge status={a.priority} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Remediation Plan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Wrench className="h-4 w-4 text-red-600" /> Remediation Plan — Weak Students
          </CardTitle>
          <CardDescription className="text-xs">
            32 students across 4 classes identified for structured remedial support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Class</TableHead>
                <TableHead className="text-xs text-center">Students</TableHead>
                <TableHead className="text-xs">Plan Status</TableHead>
                <TableHead className="text-xs">Responsible Teacher</TableHead>
                <TableHead className="text-xs text-center">Sessions/Week</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {remediationPlan.map((r) => (
                <TableRow key={r.cls} className="text-xs">
                  <TableCell className="font-semibold">{r.cls}</TableCell>
                  <TableCell className="text-center font-medium text-red-600">{r.students}</TableCell>
                  <TableCell><StatusBadge status={r.planStatus} /></TableCell>
                  <TableCell>{r.teacher}</TableCell>
                  <TableCell className="text-center">{r.sessionsPerWeek}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
            XI-A and XII-B remediation plans are in draft status. Ms. Kapoor to finalise and submit by Apr 15. Board exam students require priority scheduling.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

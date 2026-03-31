import {
  BookMarked,
  ClipboardList,
  GraduationCap,
  Target,
  BarChart3,
  CalendarDays,
  Users,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  CheckCircle2,
  BookOpen,
  Award,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { HorizontalBarChart } from "@/components/charts/horizontal-bar-chart"
import { RadarChart } from "@/components/charts/radar-chart"
import { LineChart } from "@/components/charts/line-chart"
import { CHART_COLORS, SERIES_COLORS } from "@/components/charts/chart-colors"

// ── Mock Data ──────────────────────────────────────────────────────────────────

const kpis = [
  {
    label: "Curriculum Coverage (avg)",
    value: "77.4%",
    sub: "across all subjects",
    icon: BookMarked,
    color: "text-blue-600",
    bg: "bg-blue-50",
    borderColor: "border-l-blue-500",
  },
  {
    label: "Assessment Compliance Rate",
    value: "82.3%",
    sub: "FA + SA schedules met",
    icon: ClipboardList,
    color: "text-green-600",
    bg: "bg-green-50",
    borderColor: "border-l-green-500",
  },
  {
    label: "Teacher PD Completion",
    value: "61%",
    sub: "annual CPD target",
    icon: GraduationCap,
    color: "text-purple-600",
    bg: "bg-purple-50",
    borderColor: "border-l-purple-500",
  },
  {
    label: "Student Learning Outcome Index",
    value: "58.7",
    sub: "NAS-aligned composite score",
    icon: Target,
    color: "text-orange-600",
    bg: "bg-orange-50",
    borderColor: "border-l-orange-500",
  },
]

const curriculumStatus = [
  { subject: "Mathematics", pct: 78, teachers: 8 },
  { subject: "Science", pct: 82, teachers: 6 },
  { subject: "English", pct: 91, teachers: 7 },
  { subject: "Social Studies", pct: 74, teachers: 5 },
  { subject: "Hindi", pct: 88, teachers: 6 },
  { subject: "Computer Science", pct: 71, teachers: 3 },
  { subject: "Physical Education", pct: 95, teachers: 4 },
]

const assessmentHealth = [
  { cls: "VI",   fa1: true,  fa2: true,  sa1: true,  sa2Due: "May 2025", portfolio: 78 },
  { cls: "VII",  fa1: true,  fa2: true,  sa1: true,  sa2Due: "May 2025", portfolio: 72 },
  { cls: "VIII", fa1: true,  fa2: true,  sa1: true,  sa2Due: "May 2025", portfolio: 80 },
  { cls: "IX",   fa1: true,  fa2: true,  sa1: true,  sa2Due: "May 2025", portfolio: 65 },
  { cls: "X",    fa1: true,  fa2: true,  sa1: true,  sa2Due: "Board",    portfolio: 71 },
  { cls: "XI",   fa1: true,  fa2: false, sa1: false, sa2Due: "Jun 2025", portfolio: 60 },
  { cls: "XII",  fa1: true,  fa2: false, sa1: false, sa2Due: "Board",    portfolio: 68 },
]

const teacherPD = [
  { name: "Mr. Suresh", subject: "Maths",   hoursCompleted: 28, hoursTotal: 50, modulesDone: 6,  modulesTotal: 12, status: "In Progress" },
  { name: "Ms. Rao",    subject: "Science", hoursCompleted: 35, hoursTotal: 50, modulesDone: 8,  modulesTotal: 12, status: "In Progress" },
  { name: "Ms. Verma",  subject: "English", hoursCompleted: 48, hoursTotal: 50, modulesDone: 11, modulesTotal: 12, status: "Near Complete" },
  { name: "Mr. Khan",   subject: "Social",  hoursCompleted: 22, hoursTotal: 50, modulesDone: 5,  modulesTotal: 12, status: "Behind Schedule" },
  { name: "Mrs. Gupta", subject: "Hindi",   hoursCompleted: 41, hoursTotal: 50, modulesDone: 9,  modulesTotal: 12, status: "On Track" },
  { name: "Mr. Patel",  subject: "CS",      hoursCompleted: 18, hoursTotal: 50, modulesDone: 4,  modulesTotal: 12, status: "Behind Schedule" },
]

const ncfAlignment = [
  { domain: "Cognitive Domain (Knowledge & Application)", pct: 74 },
  { domain: "Affective Domain (Values & Attitudes)", pct: 58 },
  { domain: "Psychomotor Domain (Skills & Practical)", pct: 66 },
  { domain: "Socio-Emotional Learning", pct: 52 },
  { domain: "Digital & Media Literacy", pct: 44 },
  { domain: "Environmental Sustainability", pct: 61 },
]

const learningOutcomes = [
  { subject: "Maths",         class6: 54, class8: 51, class10: "62% pass", trend: "Improving" },
  { subject: "Science",       class6: 58, class8: 60, class10: "74% pass", trend: "Stable" },
  { subject: "English",       class6: 67, class8: 65, class10: "81% pass", trend: "Stable" },
  { subject: "Social Studies",class6: 52, class8: 48, class10: "68% pass", trend: "Declining" },
  { subject: "Hindi",         class6: 71, class8: 74, class10: "88% pass", trend: "Improving" },
]

const calendarEvents = [
  { date: "Apr 5",  event: "FA-2 Assessment begins (Class VI–IX)", type: "assessment" },
  { date: "Apr 10", event: "NIPUN Bharat foundational assessment (Grade 3 & 5)", type: "assessment" },
  { date: "Apr 15", event: "Parent-Teacher Meeting — learning outcome sharing", type: "meeting" },
  { date: "Apr 22", event: "NCF 2023 teacher workshop (all subject teachers)", type: "training" },
  { date: "May 1",  event: "SA-2 examination schedule finalisation", type: "assessment" },
  { date: "May 10", event: "Annual academic review with Principal and management", type: "review" },
  { date: "Jun 15", event: "Board results analysis and remediation planning", type: "review" },
]

// ── Helper Components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "In Progress":      "bg-blue-100 text-blue-700",
    "Near Complete":    "bg-teal-100 text-teal-700",
    "On Track":         "bg-green-100 text-green-700",
    "Behind Schedule":  "bg-red-100 text-red-700",
    "Completed":        "bg-green-100 text-green-700",
    "Improving":        "bg-green-100 text-green-700",
    "Stable":           "bg-blue-100 text-blue-700",
    "Declining":        "bg-red-100 text-red-700",
  }
  return (
    <Badge className={`${map[status] ?? "bg-gray-100 text-gray-600"} border-0 text-xs`}>
      {status}
    </Badge>
  )
}

function DoneCell({ done, label }: { done: boolean; label?: string }) {
  if (label) {
    return <span className="text-xs text-muted-foreground">{label}</span>
  }
  return done ? (
    <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
  ) : (
    <span className="text-xs text-muted-foreground text-center block">In Progress</span>
  )
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "Improving") return <TrendingUp className="h-3 w-3 text-green-600 inline mr-1" />
  if (trend === "Declining") return <TrendingDown className="h-3 w-3 text-red-500 inline mr-1" />
  return <Minus className="h-3 w-3 text-gray-400 inline mr-1" />
}

function EventTypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    assessment: "bg-orange-100 text-orange-700",
    meeting:    "bg-blue-100 text-blue-700",
    training:   "bg-purple-100 text-purple-700",
    review:     "bg-teal-100 text-teal-700",
  }
  const labels: Record<string, string> = {
    assessment: "Assessment",
    meeting:    "Meeting",
    training:   "Training",
    review:     "Review",
  }
  return (
    <Badge className={`${map[type] ?? "bg-gray-100 text-gray-600"} border-0 text-xs shrink-0`}>
      {labels[type] ?? type}
    </Badge>
  )
}

function coverageColor(pct: number) {
  if (pct >= 85) return "text-green-600"
  if (pct >= 70) return "text-blue-600"
  return "text-yellow-600"
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AcademicHeadDashboardPage() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="container mx-auto py-6 px-4 md:px-8 space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Academic Head Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dr. Kavitha Subramaniam · Academic Director · Delhi Public Schools Cluster
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3" /> {today}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs px-3 py-1">
            <BookOpen className="h-3 w-3 mr-1" /> Academic Quality & Curriculum
          </Badge>
        </div>
      </div>

      {/* ── Section 1 — KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className={`border-l-4 ${k.borderColor}`}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${k.bg} mb-2`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
              <div className="text-xs font-medium text-gray-700 mt-0.5 leading-snug">{k.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{k.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Section 2 — Curriculum Status + Assessment Health ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Curriculum Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookMarked className="h-4 w-4 text-blue-600" /> Curriculum Coverage — Subject-wise
            </CardTitle>
            <CardDescription className="text-xs">
              Teaching portion completed as of current date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart
              data={curriculumStatus.map((s) => ({
                label: s.subject,
                value: s.pct,
                color: s.pct >= 85 ? CHART_COLORS.green : s.pct >= 70 ? CHART_COLORS.blue : CHART_COLORS.amber,
              }))}
              height={310}
              yAxisWidth={150}
              unit="%"
            />
          </CardContent>
        </Card>

        {/* Assessment Health Dashboard */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-green-600" /> Assessment Health Dashboard
            </CardTitle>
            <CardDescription className="text-xs">
              FA/SA completion status and portfolio coverage by class
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Class</TableHead>
                  <TableHead className="text-xs text-center">FA-1</TableHead>
                  <TableHead className="text-xs text-center">FA-2</TableHead>
                  <TableHead className="text-xs text-center">SA-1</TableHead>
                  <TableHead className="text-xs text-center">SA-2 Due</TableHead>
                  <TableHead className="text-xs text-center">Portfolio %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessmentHealth.map((r) => (
                  <TableRow key={r.cls} className="text-xs">
                    <TableCell className="font-semibold">Class {r.cls}</TableCell>
                    <TableCell className="text-center">
                      <DoneCell done={r.fa1} />
                    </TableCell>
                    <TableCell className="text-center">
                      {r.fa2 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-xs text-blue-600 font-medium">In Progress</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {r.sa1 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">{r.sa2Due}</TableCell>
                    <TableCell className="text-center font-medium">
                      <span className={r.portfolio >= 75 ? "text-green-600" : r.portfolio >= 65 ? "text-blue-600" : "text-yellow-600"}>
                        {r.portfolio}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ── Section 3 — Teacher PD + NCF Alignment + Learning Outcomes ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Teacher Professional Development */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-purple-600" /> Teacher PD Status
            </CardTitle>
            <CardDescription className="text-xs">CPD hours &amp; certification progress</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Teacher</TableHead>
                  <TableHead className="text-xs">Subject</TableHead>
                  <TableHead className="text-xs text-center">CPD Hrs</TableHead>
                  <TableHead className="text-xs text-center">Modules</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacherPD.map((t) => (
                  <TableRow key={t.name} className="text-xs">
                    <TableCell className="font-medium whitespace-nowrap">{t.name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.subject}</TableCell>
                    <TableCell className="text-center">
                      {t.hoursCompleted}/{t.hoursTotal}
                    </TableCell>
                    <TableCell className="text-center">
                      {t.modulesDone}/{t.modulesTotal}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* NCF 2023 Alignment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-600" /> NCF 2023 Competency Alignment
            </CardTitle>
            <CardDescription className="text-xs">
              Framework domain coverage across curriculum
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadarChart
              data={ncfAlignment.map((n) => ({
                subject: n.domain.split(" ").slice(0, 2).join(" "),
                value: n.pct,
              }))}
              height={280}
              color={CHART_COLORS.indigo}
            />
          </CardContent>
        </Card>

        {/* Learning Outcome Trends */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-600" /> Learning Outcome Trends
            </CardTitle>
            <CardDescription className="text-xs">NAS scores &amp; board results by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart
              data={[
                { class: "Class 6 NAS", ...Object.fromEntries(learningOutcomes.map(r => [r.subject, r.class6])) },
                { class: "Class 8 NAS", ...Object.fromEntries(learningOutcomes.map(r => [r.subject, r.class8])) },
              ]}
              xKey="class"
              series={learningOutcomes.map((r, i) => ({
                key: r.subject,
                name: r.subject,
                color: SERIES_COLORS[i] ?? CHART_COLORS.blue,
              }))}
              height={240}
              unit=""
              yDomain={[40, 80]}
            />
            <Table className="mt-2">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Subject</TableHead>
                  <TableHead className="text-xs text-center">Cl 6 NAS</TableHead>
                  <TableHead className="text-xs text-center">Cl 8 NAS</TableHead>
                  <TableHead className="text-xs">Cl 10 Board</TableHead>
                  <TableHead className="text-xs">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {learningOutcomes.map((r) => (
                  <TableRow key={r.subject} className="text-xs">
                    <TableCell className="font-medium">{r.subject}</TableCell>
                    <TableCell className="text-center">{r.class6}</TableCell>
                    <TableCell className="text-center">{r.class8}</TableCell>
                    <TableCell className="text-muted-foreground">{r.class10}</TableCell>
                    <TableCell>
                      <span className="flex items-center">
                        <TrendIcon trend={r.trend} />
                        <StatusBadge status={r.trend} />
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ── Section 4 — Academic Calendar ─────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-600" /> Academic Calendar — Upcoming Milestones
          </CardTitle>
          <CardDescription className="text-xs">
            Key events, assessments, and reviews — April to June 2025
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {calendarEvents.map((ev, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex-shrink-0 bg-white border rounded-md px-2.5 py-1.5 text-center min-w-[52px]">
                  <div className="text-xs font-bold text-gray-800 whitespace-nowrap">{ev.date}</div>
                </div>
                <p className="flex-1 text-sm text-gray-800 leading-snug">{ev.event}</p>
                <EventTypeBadge type={ev.type} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

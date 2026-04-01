import {
  ClipboardList,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Clock,
  BarChart3,
  FileText,
  Target,
  Users,
  TrendingUp,
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
import { Shell } from "@/components/shell"
import {
  PageHeader,
  PageHeaderHeading,
  PageHeaderDescription,
} from "@/components/page-header"

// ─── Mock Data ──────────────────────────────────────────────────────────────

const kpiCards = [
  {
    label: "Assessments This Term",
    value: "24 completed",
    sub: "8 upcoming",
    icon: ClipboardList,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Average Class Performance",
    value: "71.4%",
    sub: "All subjects · All classes",
    icon: BarChart3,
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    label: "Board Exam Registrations",
    value: "323 students",
    sub: "Class X: 238 · Class XII: 85",
    icon: GraduationCap,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    label: "Assessment Compliance",
    value: "FA: 100% | SA: 100%",
    sub: "Portfolio: 68%",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
  },
]

const faData = [
  { subject: "Mathematics", classes: "VI–X", fa1Date: "Mar 1–5", fa1Avg: 68.4, fa2Date: "Apr 8–12", fa2Status: "Upcoming" },
  { subject: "Science", classes: "VI–X", fa1Date: "Mar 1–5", fa1Avg: 71.2, fa2Date: "Apr 8–12", fa2Status: "Upcoming" },
  { subject: "English", classes: "VI–X", fa1Date: "Mar 3–7", fa1Avg: 76.8, fa2Date: "Apr 10–14", fa2Status: "Upcoming" },
  { subject: "Social Studies", classes: "VI–X", fa1Date: "Mar 3–7", fa1Avg: 64.1, fa2Date: "Apr 10–14", fa2Status: "Upcoming" },
  { subject: "Hindi", classes: "VI–X", fa1Date: "Mar 5–9", fa1Avg: 79.3, fa2Date: "Apr 12–16", fa2Status: "Upcoming" },
  { subject: "Computer Science", classes: "IX–XII", fa1Date: "Mar 5–9", fa1Avg: 72.6, fa2Date: "Apr 12–16", fa2Status: "Upcoming" },
]

const saData = [
  { subject: "Mathematics", sa1Avg: 67.8, sa2Status: "Scheduled", sa2Date: "May 15–20" },
  { subject: "Science", sa1Avg: 72.4, sa2Status: "Scheduled", sa2Date: "May 15–20" },
  { subject: "English", sa1Avg: 78.1, sa2Status: "Scheduled", sa2Date: "May 17–22" },
  { subject: "Social Studies", sa1Avg: 63.2, sa2Status: "Scheduled", sa2Date: "May 17–22" },
  { subject: "Hindi", sa1Avg: 81.4, sa2Status: "Scheduled", sa2Date: "May 20–25" },
]

const boardReadiness = [
  { label: "Student Registrations Complete", value: 100, detail: "323/323" },
  { label: "Admit Card Distribution", value: 100, detail: "Complete" },
  { label: "Internal Assessment Marks Submitted", value: 89, detail: "89%" },
  { label: "Centre Allocation (CBSE)", value: 100, detail: "Complete" },
  { label: "Pre-board Results Uploaded", value: 76, detail: "76%" },
]

const preBoardX = [
  { subject: "Mathematics", appeared: 238, passRate: "87.4%", avgMarks: 62.8, below33: 30, range33_60: 120, above60: 88 },
  { subject: "Science", appeared: 238, passRate: "91.6%", avgMarks: 68.4, below33: 20, range33_60: 98, above60: 120 },
  { subject: "English", appeared: 238, passRate: "96.2%", avgMarks: 74.1, below33: 9, range33_60: 72, above60: 157 },
  { subject: "Social Studies", appeared: 238, passRate: "88.7%", avgMarks: 64.2, below33: 27, range33_60: 110, above60: 101 },
  { subject: "Hindi", appeared: 238, passRate: "97.1%", avgMarks: 78.3, below33: 7, range33_60: 58, above60: 173 },
]

const nipunData = [
  { grade: "Grade 3", enrolled: 82, assessed: 82, readingProficient: 71, readingPct: "86.6%", numeracyProficient: 68, numeracyPct: "82.9%", targetDate: "Apr 10" },
  { grade: "Grade 4", enrolled: 88, assessed: 88, readingProficient: 76, readingPct: "86.4%", numeracyProficient: 72, numeracyPct: "81.8%", targetDate: "Apr 10" },
  { grade: "Grade 5", enrolled: 91, assessed: 91, readingProficient: 80, readingPct: "87.9%", numeracyProficient: 77, numeracyPct: "84.6%", targetDate: "Apr 10" },
]

const portfolioData = [
  { cls: "VI", students: 180, initiated: "180 (100%)", halfPlus: "142 (78.9%)", complete: "98 (54.4%)" },
  { cls: "VII", students: 195, initiated: "195 (100%)", halfPlus: "148 (75.9%)", complete: "101 (51.8%)" },
  { cls: "VIII", students: 210, initiated: "210 (100%)", halfPlus: "162 (77.1%)", complete: "114 (54.3%)" },
  { cls: "IX", students: 225, initiated: "225 (100%)", halfPlus: "158 (70.2%)", complete: "96 (42.7%)" },
  { cls: "X", students: 238, initiated: "238 (100%)", halfPlus: "174 (73.1%)", complete: "112 (47.1%)" },
]

// ─── Helper Components ───────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Upcoming: "bg-blue-100 text-blue-700",
    Scheduled: "bg-indigo-100 text-indigo-700",
    Complete: "bg-green-100 text-green-700",
    "In Progress": "bg-yellow-100 text-yellow-700",
  }
  return (
    <Badge className={`${map[status] ?? "bg-gray-100 text-gray-700"} border-0 text-xs`}>
      {status}
    </Badge>
  )
}

function SectionHeading({
  icon: Icon,
  title,
  description,
  iconColor = "text-blue-600",
}: {
  icon: React.ElementType
  title: string
  description?: string
  iconColor?: string
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`h-5 w-5 ${iconColor}`} />
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AssessmentPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Assessment &amp; Examination Management</PageHeaderHeading>
        <PageHeaderDescription>
          Formative, Summative &amp; Board Examination Tracking
        </PageHeaderDescription>
      </PageHeader>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${k.bg} mb-2`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div className={`text-xl font-bold ${k.color} leading-tight`}>{k.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{k.sub}</div>
              <div className="text-xs font-medium text-gray-600 mt-1">{k.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section A: Formative Assessment Calendar */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <SectionHeading
            icon={ClipboardList}
            title="Section A — Formative Assessment Calendar (FA-1 and FA-2)"
            description="Subject-wise FA-1 results and FA-2 schedule"
            iconColor="text-blue-600"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Subject</TableHead>
                <TableHead className="text-xs">Class</TableHead>
                <TableHead className="text-xs">FA-1 Date</TableHead>
                <TableHead className="text-xs text-center">FA-1 Avg</TableHead>
                <TableHead className="text-xs">FA-2 Date</TableHead>
                <TableHead className="text-xs text-center">FA-2 Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faData.map((row) => (
                <TableRow key={row.subject} className="text-xs">
                  <TableCell className="font-medium">{row.subject}</TableCell>
                  <TableCell>{row.classes}</TableCell>
                  <TableCell>{row.fa1Date}</TableCell>
                  <TableCell className="text-center font-semibold">
                    <span className={row.fa1Avg >= 75 ? "text-green-600" : row.fa1Avg >= 60 ? "text-yellow-600" : "text-red-600"}>
                      {row.fa1Avg}
                    </span>
                  </TableCell>
                  <TableCell>{row.fa2Date}</TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={row.fa2Status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section B: Summative Assessment */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <SectionHeading
            icon={FileText}
            title="Section B — Summative Assessment (SA) Overview"
            description="SA-1 class averages and SA-2 schedule"
            iconColor="text-indigo-600"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Subject</TableHead>
                <TableHead className="text-xs text-center">SA-1 Score (Class Avg)</TableHead>
                <TableHead className="text-xs text-center">SA-2 Status</TableHead>
                <TableHead className="text-xs">SA-2 Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {saData.map((row) => (
                <TableRow key={row.subject} className="text-xs">
                  <TableCell className="font-medium">{row.subject}</TableCell>
                  <TableCell className="text-center font-semibold">
                    <span className={row.sa1Avg >= 75 ? "text-green-600" : row.sa1Avg >= 60 ? "text-yellow-600" : "text-red-600"}>
                      {row.sa1Avg}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={row.sa2Status} />
                  </TableCell>
                  <TableCell>{row.sa2Date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section C: Board Examination Tracking */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <SectionHeading
            icon={GraduationCap}
            title="Section C — Board Examination Tracking (Class X &amp; XII)"
            description="Readiness checklist and pre-board performance analysis"
            iconColor="text-purple-600"
          />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Readiness progress bars */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Board Exam Readiness</h3>
            <div className="space-y-3">
              {boardReadiness.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-700 font-medium">{item.label}</span>
                    <span className="font-semibold text-gray-900">{item.detail}</span>
                  </div>
                  <Progress value={item.value} className="h-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Class X Pre-Board Results */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Class X Pre-Board Results</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Subject</TableHead>
                  <TableHead className="text-xs text-center">Appeared</TableHead>
                  <TableHead className="text-xs text-center">Pass%</TableHead>
                  <TableHead className="text-xs text-center">Avg Marks</TableHead>
                  <TableHead className="text-xs text-center">&lt;33%</TableHead>
                  <TableHead className="text-xs text-center">33–60%</TableHead>
                  <TableHead className="text-xs text-center">&gt;60%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preBoardX.map((row) => (
                  <TableRow key={row.subject} className="text-xs">
                    <TableCell className="font-medium">{row.subject}</TableCell>
                    <TableCell className="text-center">{row.appeared}</TableCell>
                    <TableCell className="text-center font-semibold text-green-700">{row.passRate}</TableCell>
                    <TableCell className="text-center font-semibold">{row.avgMarks}</TableCell>
                    <TableCell className="text-center text-red-600 font-medium">{row.below33}</TableCell>
                    <TableCell className="text-center text-yellow-600 font-medium">{row.range33_60}</TableCell>
                    <TableCell className="text-center text-green-600 font-medium">{row.above60}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Section D: NIPUN Bharat Foundational Assessment */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <SectionHeading
            icon={Target}
            title="Section D — NIPUN Bharat Foundational Assessment (Grade 3, 4, 5)"
            description="Reading and numeracy proficiency levels against national targets"
            iconColor="text-orange-600"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Grade</TableHead>
                <TableHead className="text-xs text-center">Enrolled</TableHead>
                <TableHead className="text-xs text-center">Assessed</TableHead>
                <TableHead className="text-xs text-center">Reading Proficient</TableHead>
                <TableHead className="text-xs text-center">Numeracy Proficient</TableHead>
                <TableHead className="text-xs text-center">Target Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nipunData.map((row) => (
                <TableRow key={row.grade} className="text-xs">
                  <TableCell className="font-medium">{row.grade}</TableCell>
                  <TableCell className="text-center">{row.enrolled}</TableCell>
                  <TableCell className="text-center font-semibold text-green-700">{row.assessed}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-blue-700">{row.readingProficient}</span>
                    <span className="text-muted-foreground ml-1">({row.readingPct})</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-teal-700">{row.numeracyProficient}</span>
                    <span className="text-muted-foreground ml-1">({row.numeracyPct})</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">{row.targetDate}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section E: ePortfolio Completion */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeading
            icon={BookOpen}
            title="Section E — ePortfolio Completion"
            description="Digital portfolio initiation and completion rates by class"
            iconColor="text-teal-600"
          />
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center gap-2">
            <Badge className="bg-yellow-100 text-yellow-800 border-0 text-xs">
              Overall Completion: 68% — Below Target (80%)
            </Badge>
            <Badge className="bg-green-100 text-green-700 border-0 text-xs">
              All students have initiated portfolios
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Class</TableHead>
                <TableHead className="text-xs text-center">Students</TableHead>
                <TableHead className="text-xs text-center">Portfolio Initiated</TableHead>
                <TableHead className="text-xs text-center">50%+ Complete</TableHead>
                <TableHead className="text-xs text-center">100% Complete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolioData.map((row) => (
                <TableRow key={row.cls} className="text-xs">
                  <TableCell className="font-medium">Class {row.cls}</TableCell>
                  <TableCell className="text-center">{row.students}</TableCell>
                  <TableCell className="text-center text-green-700 font-medium">{row.initiated}</TableCell>
                  <TableCell className="text-center text-blue-700 font-medium">{row.halfPlus}</TableCell>
                  <TableCell className="text-center text-purple-700 font-medium">{row.complete}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground mt-3">
            Note: Portfolio compliance target is 80% full completion by end of term. Class IX and X require focused intervention.
          </p>
        </CardContent>
      </Card>
    </Shell>
  )
}

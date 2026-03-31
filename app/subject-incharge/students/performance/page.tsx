import {
  TrendingUp, AlertTriangle, BarChart3, Users, BookOpen, CheckCircle2, TrendingDown,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shell } from "@/components/shell"
import { PageHeader } from "@/components/page-header"
import { BarChartVertical } from "@/components/charts/bar-chart-vertical"
import { LineChart } from "@/components/charts/line-chart"
import { CHART_COLORS, SERIES_COLORS } from "@/components/charts/chart-colors"

const kpiCards = [
  { label: "Total Students (Mathematics)", value: "1,247", colour: "text-blue-600" },
  { label: "Avg Mathematics Score", value: "62.4%", colour: "text-green-600" },
  { label: "Pass Rate", value: "88.7%", colour: "text-purple-600" },
  { label: "At-Risk Students", value: "73", colour: "text-red-600" },
]

const classPerformance = [
  { cls: "Class VI", enrolled: 184, avg: 68.4, passRate: 93.5, below35: 4, above75: 42 },
  { cls: "Class VII", enrolled: 196, avg: 66.1, passRate: 91.8, below35: 6, above75: 38 },
  { cls: "Class VIII", enrolled: 201, avg: 64.7, passRate: 90.1, below35: 8, above75: 34 },
  { cls: "Class IX", enrolled: 218, avg: 60.3, passRate: 86.7, below35: 14, above75: 27 },
  { cls: "Class X", enrolled: 224, avg: 58.9, passRate: 84.4, below35: 18, above75: 23 },
  { cls: "Class XI (Maths)", enrolled: 112, avg: 63.2, passRate: 89.3, below35: 6, above75: 31 },
  { cls: "Class XII (Maths)", enrolled: 112, avg: 66.4, passRate: 91.1, below35: 5, above75: 34 },
]

const gradeDistribution = [
  { grade: "A1 (91-100%)", count: 87, pct: 7.0 },
  { grade: "A2 (81-90%)", count: 134, pct: 10.7 },
  { grade: "B1 (71-80%)", count: 198, pct: 15.9 },
  { grade: "B2 (61-70%)", count: 247, pct: 19.8 },
  { grade: "C1 (51-60%)", count: 286, pct: 22.9 },
  { grade: "C2 (41-50%)", count: 155, pct: 12.4 },
  { grade: "D (33-40%)", count: 67, pct: 5.4 },
  { grade: "E (Below 33%)", count: 73, pct: 5.9 },
]

const chapterDifficulty = [
  { chapter: "Number Systems / Real Numbers", avgScore: 71.2, belowMastery: 18, commonErrors: "Irrational number operations, surds" },
  { chapter: "Polynomials & Algebra", avgScore: 63.4, belowMastery: 28, commonErrors: "Factorisation, remainder theorem" },
  { chapter: "Linear Equations / Pair of LE", avgScore: 67.8, belowMastery: 22, commonErrors: "Graphical solution, word problems" },
  { chapter: "Geometry: Triangles & Circles", avgScore: 59.3, belowMastery: 34, commonErrors: "Proof writing, circle theorems" },
  { chapter: "Coordinate Geometry", avgScore: 61.7, belowMastery: 31, commonErrors: "Section formula, area calculation" },
  { chapter: "Trigonometry & Heights/Distances", avgScore: 54.8, belowMastery: 42, commonErrors: "Identities, application problems" },
  { chapter: "Statistics & Probability", avgScore: 68.9, belowMastery: 20, commonErrors: "Ogive, conditional probability" },
  { chapter: "Mensuration (Areas & Volumes)", avgScore: 62.1, belowMastery: 29, commonErrors: "Composite shapes, unit conversion" },
]

const atRiskStudents = [
  { roll: "X-B-041", name: "Rohan Verma", cls: "X-B", score: 28.4, risk: "Failed FA1+FA2", intervention: "Remedial Batch A", teacher: "Mr. Yadav", status: "Enrolled" },
  { roll: "IX-C-023", name: "Priti Devi", cls: "IX-C", score: 24.7, risk: "Below 35% consecutively", intervention: "Peer Tutoring", teacher: "Mr. Kumar", status: "In Progress" },
  { roll: "X-C-018", name: "Amit Nair", cls: "X-C", score: 31.2, risk: "Absenteeism + low score", intervention: "Remedial Batch B", teacher: "Mr. Yadav", status: "Enrolled" },
  { roll: "IX-D-007", name: "Sunita Kumari", cls: "IX-D", score: 26.8, risk: "Language barrier + Math", intervention: "Mother tongue support class", teacher: "Mr. Mehta", status: "Enrolled" },
  { roll: "VIII-C-034", name: "Dev Raj", cls: "VIII-C", score: 29.1, risk: "Dyscalculia suspected", intervention: "Special Educator referral", teacher: "Ms. Singh", status: "Referred" },
  { roll: "X-A-052", name: "Kavya Sharma", cls: "X-A", score: 32.7, risk: "Trigonometry conceptual gap", intervention: "DIKSHA videos + worksheet", teacher: "Mr. Mehta", status: "In Progress" },
  { roll: "XI-A-009", name: "Suresh Babu", cls: "XI (Maths)", score: 27.4, risk: "Transition gap (Gr 10→11)", intervention: "Bridge course enrolled", teacher: "Ms. Nair", status: "Enrolled" },
  { roll: "IX-E-041", name: "Meena Gupta", cls: "IX-E", score: 30.6, risk: "Irregular attendance + low score", intervention: "Parent counselling + remediation", teacher: "Mr. Kumar", status: "In Progress" },
  { roll: "X-B-029", name: "Rahul Tiwari", cls: "X-B", score: 22.1, risk: "Critical — Board exam risk", intervention: "Daily 1:1 coaching by incharge", teacher: "Mr. Mehta", status: "Active" },
  { roll: "VIII-D-018", name: "Pooja Yadav", cls: "VIII-D", score: 28.9, risk: "Geometry conceptual gap", intervention: "GeoGebra visual learning", teacher: "Mr. Kumar", status: "In Progress" },
]

const outcometrend = [
  { cls: "Class VI", fa1: 71.2, fa2: 69.8, sa1: 68.4, projSa2: 70.1 },
  { cls: "Class VII", fa1: 68.4, fa2: 67.1, sa1: 66.1, projSa2: 67.8 },
  { cls: "Class VIII", fa1: 66.7, fa2: 65.4, sa1: 64.7, projSa2: 65.9 },
  { cls: "Class IX", fa1: 62.3, fa2: 61.4, sa1: 60.3, projSa2: 62.1 },
  { cls: "Class X", fa1: 61.4, fa2: 60.2, sa1: 58.9, projSa2: 61.8 },
  { cls: "Class XI (Maths)", fa1: 64.1, fa2: 63.8, sa1: 63.2, projSa2: 64.7 },
  { cls: "Class XII (Maths)", fa1: 65.8, fa2: 66.1, sa1: 66.4, projSa2: 68.2 },
]

const remediationProgramme = [
  { batch: "Remedial Batch A", focus: "Algebra & Polynomials (Grade IX-X)", students: 18, teacher: "Mr. Suresh Yadav + Mr. Mehta", schedule: "Mon/Wed/Fri 7:00-7:45 AM", improvement: "+8.4%" },
  { batch: "Remedial Batch B", focus: "Trigonometry & Geometry (Grade X)", students: 14, teacher: "Mr. Arun Mehta", schedule: "Tue/Thu 3:45-4:30 PM", improvement: "+6.1%" },
  { batch: "Foundational Gaps (Grade VI-VIII)", focus: "Fractions, Decimals, Basic Geometry", students: 23, teacher: "Ms. Anita Singh + Ms. Rekha Sharma", schedule: "Sat 9:00-10:30 AM", improvement: "+11.2%" },
  { batch: "Board Exam Crash Course (Grade X)", focus: "All Chapters — Speed & Accuracy", students: 18, teacher: "Ms. Deepa Nair + Mr. Mehta", schedule: "Daily 6:30-7:30 AM", improvement: "+5.8%" },
]

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    Enrolled: "bg-blue-100 text-blue-700 border-blue-300",
    "In Progress": "bg-yellow-100 text-yellow-700 border-yellow-300",
    Referred: "bg-purple-100 text-purple-700 border-purple-300",
    Active: "bg-red-100 text-red-700 border-red-300",
  }
  return <Badge className={`${map[s] ?? "bg-gray-100 text-gray-700"} border text-xs`}>{s}</Badge>
}

export default function SubjectInchargeStudentPerformancePage() {
  return (
    <Shell>
      <PageHeader
        title="Student Performance Analytics"
        description="Mathematics learning outcomes, at-risk identification and remediation — Module 25.3"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6 text-center">
              <p className={`text-3xl font-bold ${k.colour}`}>{k.value}</p>
              <p className="text-xs text-gray-500 mt-1">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Class Performance */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4 text-blue-600" />Class-wise Mathematics Performance</CardTitle>
          <CardDescription>SA1 results — avg score, pass rate, grade extremes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead className="text-center">Enrolled</TableHead>
                <TableHead className="text-center">Class Avg %</TableHead>
                <TableHead className="text-center">Pass Rate %</TableHead>
                <TableHead className="text-center">Below 35%</TableHead>
                <TableHead className="text-center">Above 75%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classPerformance.map((c) => (
                <TableRow key={c.cls}>
                  <TableCell className="font-medium text-sm">{c.cls}</TableCell>
                  <TableCell className="text-center text-sm">{c.enrolled}</TableCell>
                  <TableCell className="text-center text-sm font-medium">
                    <span className={c.avg >= 65 ? "text-green-700" : c.avg >= 55 ? "text-yellow-600" : "text-red-600"}>{c.avg}%</span>
                  </TableCell>
                  <TableCell className="text-center text-sm">{c.passRate}%</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`text-xs ${c.below35 > 12 ? "bg-red-100 text-red-700 border-red-300" : "bg-yellow-100 text-yellow-700 border-yellow-300"} border`}>{c.below35}</Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm text-green-700">{c.above75}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-purple-600" />Grade Distribution</CardTitle>
            <CardDescription>All 1,247 students across Class VI-XII (Mathematics)</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChartVertical
              data={gradeDistribution.map((g) => ({
                label: g.grade.split(" ")[0],
                value: g.count,
                color: g.grade.startsWith("A") ? CHART_COLORS.green : g.grade.startsWith("B") ? CHART_COLORS.blue : g.grade.startsWith("C") ? CHART_COLORS.amber : g.grade.startsWith("D") ? CHART_COLORS.orange : CHART_COLORS.red,
              }))}
              height={280}
              unit=" students"
            />
          </CardContent>
        </Card>

        {/* Chapter Difficulty */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-orange-600" />Chapter Difficulty Analysis</CardTitle>
            <CardDescription>Average score and % students below mastery threshold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {chapterDifficulty.map((c) => (
                <div key={c.chapter} className="border rounded-md p-2">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="font-medium text-gray-700 text-xs">{c.chapter}</span>
                    <span className={`font-medium ${c.avgScore < 60 ? "text-red-600" : "text-green-600"}`}>{c.avgScore}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={c.avgScore} className="h-1.5 flex-1" />
                    <span className="text-xs text-red-600 whitespace-nowrap">{c.belowMastery}% below mastery</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Errors: {c.commonErrors}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Students */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-red-700"><AlertTriangle className="h-4 w-4" />At-Risk Student Intervention Register</CardTitle>
          <CardDescription>73 students identified — 10 critical cases shown</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll No</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-center">Score %</TableHead>
                <TableHead>Risk Factor</TableHead>
                <TableHead>Intervention</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atRiskStudents.map((s) => (
                <TableRow key={s.roll}>
                  <TableCell className="text-xs font-mono text-gray-500">{s.roll}</TableCell>
                  <TableCell className="text-sm font-medium">{s.name}</TableCell>
                  <TableCell className="text-sm">{s.cls}</TableCell>
                  <TableCell className="text-center">
                    <span className="text-red-600 font-bold text-sm">{s.score}%</span>
                  </TableCell>
                  <TableCell className="text-xs text-orange-700">{s.risk}</TableCell>
                  <TableCell className="text-xs text-gray-700">{s.intervention}</TableCell>
                  <TableCell className="text-xs text-gray-600">{s.teacher.split(" ").slice(-1)[0]}</TableCell>
                  <TableCell><StatusBadge s={s.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Outcome Trend */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-teal-600" />Learning Outcome Trend</CardTitle>
          <CardDescription>FA1 → FA2 → SA1 → Projected SA2 by class</CardDescription>
        </CardHeader>
        <CardContent>
          <LineChart
            data={[
              { assessment: "FA1", ...Object.fromEntries(outcometrend.map(t => [t.cls.split(" ").slice(0,2).join(" "), t.fa1])) },
              { assessment: "FA2", ...Object.fromEntries(outcometrend.map(t => [t.cls.split(" ").slice(0,2).join(" "), t.fa2])) },
              { assessment: "SA1", ...Object.fromEntries(outcometrend.map(t => [t.cls.split(" ").slice(0,2).join(" "), t.sa1])) },
              { assessment: "Proj SA2", ...Object.fromEntries(outcometrend.map(t => [t.cls.split(" ").slice(0,2).join(" "), t.projSa2])) },
            ]}
            xKey="assessment"
            series={outcometrend.map((t, i) => ({
              key: t.cls.split(" ").slice(0,2).join(" "),
              name: t.cls,
              color: SERIES_COLORS[i] ?? CHART_COLORS.blue,
            }))}
            height={360}
            unit="%"
            yDomain={[55, 75]}
          />
        </CardContent>
      </Card>

      {/* Remediation Programme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="h-4 w-4 text-green-600" />Remediation Programme</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Focus Topic</TableHead>
                <TableHead className="text-center">Students</TableHead>
                <TableHead>Teacher(s)</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Improvement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {remediationProgramme.map((r) => (
                <TableRow key={r.batch}>
                  <TableCell className="font-medium text-sm">{r.batch}</TableCell>
                  <TableCell className="text-sm text-gray-700">{r.focus}</TableCell>
                  <TableCell className="text-center text-sm font-medium">{r.students}</TableCell>
                  <TableCell className="text-xs text-gray-600">{r.teacher}</TableCell>
                  <TableCell className="text-xs text-gray-600">{r.schedule}</TableCell>
                  <TableCell className="text-sm font-medium text-green-700">{r.improvement}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

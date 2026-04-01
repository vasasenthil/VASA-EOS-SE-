import {
  Users, Clock, BookOpen, Star, Eye, TrendingUp, AlertTriangle, CheckCircle2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shell } from "@/components/shell"
import { PageHeader } from "@/components/page-header"

const kpiCards = [
  { label: "Teachers in Department", value: "6", colour: "text-blue-600" },
  { label: "Avg CPD Hours", value: "28.4 hrs", colour: "text-green-600" },
  { label: "Classes Covered", value: "42", colour: "text-purple-600" },
  { label: "Avg Student Load", value: "41.3 students", colour: "text-orange-600" },
]

const teachers = [
  {
    empId: "DL-3847", name: "Mr. Arun Mehta", role: "Subject Incharge",
    qualification: "M.Sc + B.Ed (Mathematics)", classes: "VIII-A, IX-A, IX-B, X-A, X-B",
    periods: 32, syllabusCovered: 78, cpdHours: 58, status: "On Track",
  },
  {
    empId: "DL-4123", name: "Ms. Rekha Sharma", role: "Senior Teacher",
    qualification: "B.Sc + B.Ed (Mathematics)", classes: "VI-A, VI-B, VII-A, VII-B",
    periods: 30, syllabusCovered: 84, cpdHours: 44, status: "On Track",
  },
  {
    empId: "DL-5241", name: "Mr. Suresh Yadav", role: "TGT Mathematics",
    qualification: "M.Sc + B.Ed (Mathematics)", classes: "IX-C, IX-D, X-C",
    periods: 28, syllabusCovered: 55, cpdHours: 22, status: "At Risk",
  },
  {
    empId: "DL-6018", name: "Ms. Anita Singh", role: "TGT Mathematics",
    qualification: "B.Ed Mathematics", classes: "VI-C, VII-C, VIII-B, VIII-C",
    periods: 32, syllabusCovered: 91, cpdHours: 48, status: "On Track",
  },
  {
    empId: "DL-6842", name: "Mr. Praveen Kumar", role: "TGT Mathematics",
    qualification: "B.Sc + B.Ed (Mathematics)", classes: "VII-D, VIII-D, IX-E",
    periods: 30, syllabusCovered: 72, cpdHours: 31, status: "On Track",
  },
  {
    empId: "DL-7193", name: "Ms. Deepa Nair", role: "PGT Mathematics",
    qualification: "M.Sc Mathematics (Gold Medalist)", classes: "X-D, XI (Maths), XII (Maths)",
    periods: 26, syllabusCovered: 88, cpdHours: 64, status: "Excellent",
  },
]

const peerObservations = [
  { date: "2025-12-05", observer: "Mr. Arun Mehta", observee: "Mr. Suresh Yadav", class: "IX-C", focus: "Algebra: Linear Equations — Pedagogy Review", status: "Scheduled" },
  { date: "2025-12-08", observer: "Ms. Deepa Nair", observee: "Ms. Rekha Sharma", class: "VII-A", focus: "Geometry: Triangles — Constructivist Approach", status: "Scheduled" },
  { date: "2025-12-12", observer: "Ms. Anita Singh", observee: "Mr. Praveen Kumar", class: "VIII-D", focus: "Statistics: Mean, Median, Mode", status: "Scheduled" },
  { date: "2025-11-18", observer: "Mr. Arun Mehta", observee: "Ms. Anita Singh", class: "VI-C", focus: "Number Sense: Fractions Activity", status: "Completed" },
  { date: "2025-11-10", observer: "Ms. Deepa Nair", observee: "Mr. Suresh Yadav", class: "X-C", focus: "Trigonometry Introduction", status: "Completed" },
  { date: "2025-10-28", observer: "Mr. Arun Mehta", observee: "Mr. Praveen Kumar", class: "IX-E", focus: "Polynomials: Division Algorithm", status: "Completed" },
]

const performanceMetrics = [
  { teacher: "Mr. Arun Mehta", passRate: 91.2, avgMarks: 68.4, improvement: 4.2, parentSatisfaction: 4.3 },
  { teacher: "Ms. Rekha Sharma", passRate: 93.8, avgMarks: 72.1, improvement: 3.8, parentSatisfaction: 4.5 },
  { teacher: "Mr. Suresh Yadav", passRate: 79.4, avgMarks: 54.7, improvement: -1.2, parentSatisfaction: 3.4 },
  { teacher: "Ms. Anita Singh", passRate: 95.6, avgMarks: 74.8, improvement: 5.1, parentSatisfaction: 4.6 },
  { teacher: "Mr. Praveen Kumar", passRate: 88.7, avgMarks: 65.3, improvement: 2.7, parentSatisfaction: 4.1 },
  { teacher: "Ms. Deepa Nair", passRate: 97.4, avgMarks: 78.9, improvement: 3.4, parentSatisfaction: 4.8 },
]

const collaborationLog = [
  { date: "2025-11-25", event: "Monthly Department Review Meeting", attendees: "All 6 teachers", outcome: "Uniform question pattern agreed for SA2" },
  { date: "2025-11-10", event: "Common Test Paper Preparation (FA3)", attendees: "All 6 teachers", outcome: "FA3 question bank finalised" },
  { date: "2025-10-28", event: "Remediation Strategy Discussion", attendees: "Mr. Mehta, Mr. Yadav, Mr. Kumar", outcome: "Peer tutoring for 32 at-risk students" },
  { date: "2025-10-15", event: "DIKSHA Content Sharing Workshop", attendees: "All 6 teachers", outcome: "45 new resources mapped to syllabus" },
  { date: "2025-09-20", event: "Academic Review (SA1 Result Analysis)", attendees: "Mr. Mehta + Academic Head", outcome: "3 interventions triggered for underperforming classes" },
]

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    "On Track": "bg-green-100 text-green-700 border-green-300",
    "At Risk": "bg-red-100 text-red-700 border-red-300",
    Excellent: "bg-blue-100 text-blue-700 border-blue-300",
    Scheduled: "bg-yellow-100 text-yellow-700 border-yellow-300",
    Completed: "bg-green-100 text-green-700 border-green-300",
  }
  return <Badge className={`${map[s] ?? "bg-gray-100 text-gray-700"} border text-xs`}>{s}</Badge>
}

export default function SubjectInchargeTeachersPage() {
  return (
    <Shell>
      <PageHeader
        title="Mathematics Teacher Coordination"
        description="Team management, CPD tracking, peer observation and performance metrics — Module 13.3"
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

      {/* Teacher Team Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-blue-600" />Mathematics Department Team</CardTitle>
          <CardDescription>6 teachers — syllabus coverage, CPD hours, workload</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Emp ID</TableHead>
                <TableHead>Name & Role</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead className="text-center">Periods/wk</TableHead>
                <TableHead>Syllabus %</TableHead>
                <TableHead className="text-center">CPD Hrs</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((t) => (
                <TableRow key={t.empId}>
                  <TableCell className="text-xs text-gray-500 font-mono">{t.empId}</TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">{t.qualification}</TableCell>
                  <TableCell className="text-xs text-gray-700">{t.classes}</TableCell>
                  <TableCell className="text-center text-sm">{t.periods}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Progress value={t.syllabusCovered} className="h-1.5 w-14" />
                      <span className={`text-xs ${t.syllabusCovered < 60 ? "text-red-600 font-medium" : "text-gray-600"}`}>{t.syllabusCovered}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm font-medium text-blue-700">{t.cpdHours}</TableCell>
                  <TableCell><StatusBadge s={t.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Mr. Suresh Yadav (DL-5241) — syllabus coverage is 55% (target 70%+ by this point in term). Assigned 4 remedial classes in November. Peer coaching by Mr. Mehta scheduled for December.</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* CPD Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4 text-green-600" />CPD Compliance — 50-Hour Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teachers.map((t) => {
                const pct = Math.min(100, Math.round((t.cpdHours / 50) * 100))
                return (
                  <div key={t.empId}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="font-medium">{t.name}</span>
                      <span className={t.cpdHours >= 50 ? "text-green-600 font-medium" : t.cpdHours >= 30 ? "text-yellow-600" : "text-red-600 font-medium"}>
                        {t.cpdHours} / 50 hrs
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-purple-600" />Teacher Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead className="text-center">Pass %</TableHead>
                  <TableHead className="text-center">Avg</TableHead>
                  <TableHead className="text-center">Δ</TableHead>
                  <TableHead className="text-center">Parent ★</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performanceMetrics.map((p) => (
                  <TableRow key={p.teacher}>
                    <TableCell className="text-sm font-medium">{p.teacher.split(" ").slice(-1)[0]}</TableCell>
                    <TableCell className="text-center text-sm">{p.passRate}%</TableCell>
                    <TableCell className="text-center text-sm">{p.avgMarks}%</TableCell>
                    <TableCell className="text-center text-sm">
                      <span className={p.improvement >= 0 ? "text-green-600" : "text-red-600"}>
                        {p.improvement >= 0 ? "+" : ""}{p.improvement}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm">{p.parentSatisfaction}/5</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Peer Observations */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Eye className="h-4 w-4 text-orange-600" />Peer Observation Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Observer</TableHead>
                <TableHead>Observee</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Focus Area</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {peerObservations.map((o, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm text-gray-600">{o.date}</TableCell>
                  <TableCell className="text-sm">{o.observer.split(" ").slice(-1)[0]}</TableCell>
                  <TableCell className="text-sm font-medium">{o.observee.split(" ").slice(-1)[0]}</TableCell>
                  <TableCell className="text-sm">{o.class}</TableCell>
                  <TableCell className="text-xs text-gray-700">{o.focus}</TableCell>
                  <TableCell><StatusBadge s={o.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Collaboration Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-teal-600" />Department Collaboration Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {collaborationLog.map((c, i) => (
              <div key={i} className="p-3 border rounded-md">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-medium">{c.event}</p>
                  <span className="text-xs text-gray-400 ml-2">{c.date}</span>
                </div>
                <p className="text-xs text-gray-500">Attendees: {c.attendees}</p>
                <p className="text-xs text-green-700 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />{c.outcome}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Shell>
  )
}

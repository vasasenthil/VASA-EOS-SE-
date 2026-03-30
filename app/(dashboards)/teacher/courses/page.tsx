import {
  BookOpen, Users, TrendingUp, PlusCircle, Upload, ClipboardList, Eye,
  CheckCircle2, Clock,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shell } from "@/components/shell"
import { PageHeader } from "@/components/page-header"
import Link from "next/link"

const stats = [
  { label: "Active Courses", value: "6", colour: "text-blue-600" },
  { label: "Total Students Enrolled", value: "248", colour: "text-green-600" },
  { label: "Avg Completion Rate", value: "67.3%", colour: "text-purple-600" },
]

const courses = [
  {
    courseId: "MTH-IX-A", subject: "Mathematics", classSection: "IX-A",
    students: 42, syllabus: 74, assignments: 8, graded: 7,
    nextTopic: "Polynomials — Division Algorithm", status: "On Track",
  },
  {
    courseId: "MTH-IX-B", subject: "Mathematics", classSection: "IX-B",
    students: 38, syllabus: 71, assignments: 8, graded: 8,
    nextTopic: "Polynomials — Factor Theorem", status: "On Track",
  },
  {
    courseId: "MTH-X-A", subject: "Mathematics", classSection: "X-A",
    students: 40, syllabus: 82, assignments: 9, graded: 9,
    nextTopic: "Probability — Theoretical Probability", status: "Ahead",
  },
  {
    courseId: "MTH-X-B", subject: "Mathematics", classSection: "X-B",
    students: 43, syllabus: 79, assignments: 9, graded: 8,
    nextTopic: "Statistics — Ogive & Cumulative Frequency", status: "On Track",
  },
  {
    courseId: "MTH-REM-01", subject: "Remedial Mathematics", classSection: "Special Batch (IX-X)",
    students: 23, syllabus: 45, assignments: 6, graded: 6,
    nextTopic: "Algebra Foundations — Revisit Linear Equations", status: "Special",
  },
  {
    courseId: "MTH-ADV-01", subject: "Advanced Problem Solving", classSection: "Enrichment (IX-X)",
    students: 18, syllabus: 91, assignments: 12, graded: 11,
    nextTopic: "Olympiad Geometry — Circles & Tangents", status: "Ahead",
  },
]

const recentActivity = [
  { date: "2025-11-24", action: "Uploaded notes", detail: "Trigonometry — Sin, Cos, Tan applications (Class X-A)", icon: Upload },
  { date: "2025-11-23", action: "Posted assignment", detail: "Probability Problems Set 4 — Class X-B (Due Nov 25)", icon: ClipboardList },
  { date: "2025-11-22", action: "Marked attendance", detail: "Class IX-A — 40/42 present (2 absent: notified parents)", icon: CheckCircle2 },
  { date: "2025-11-21", action: "Added quiz", detail: "Quick Quiz — Statistics MCQ (Class X-A, 10 questions)", icon: PlusCircle },
  { date: "2025-11-20", action: "Graded assignments", detail: "Coordinate Geometry Set 3 — Class IX-B (38 papers)", icon: TrendingUp },
  { date: "2025-11-19", action: "Uploaded notes", detail: "Polynomials — Remainder and Factor Theorem (Class IX-A)", icon: Upload },
  { date: "2025-11-18", action: "Reviewed DIKSHA content", detail: "Linked 4 resources to Class IX course on DIKSHA", icon: Eye },
  { date: "2025-11-17", action: "Recorded remedial attendance", detail: "Remedial Batch — 21/23 present", icon: CheckCircle2 },
]

const engagementData = {
  top: [
    { name: "Ananya Mishra", cls: "X-B", score: 94, submitted: "9/9", attendance: "98%" },
    { name: "Vikram Patel", cls: "X-A", score: 92, submitted: "9/9", attendance: "96%" },
    { name: "Riya Sharma", cls: "IX-A", score: 91, submitted: "8/8", attendance: "97%" },
    { name: "Arjun Singh", cls: "X-B", score: 90, submitted: "9/9", attendance: "95%" },
    { name: "Priya Gupta", cls: "IX-B", score: 89, submitted: "8/8", attendance: "94%" },
  ],
  bottom: [
    { name: "Rohan Verma", cls: "X-B", score: 28, submitted: "3/9", attendance: "61%" },
    { name: "Priti Devi", cls: "IX-C", score: 31, submitted: "4/8", attendance: "72%" },
    { name: "Dev Raj", cls: "VIII-C", score: 35, submitted: "5/8", attendance: "68%" },
    { name: "Ankit Yadav", cls: "IX-B", score: 38, submitted: "4/8", attendance: "74%" },
    { name: "Sunita Kumari", cls: "IX-D", score: 40, submitted: "5/8", attendance: "71%" },
  ],
}

const dikshaMapping = [
  { course: "MTH-IX-A", linked: 12, status: "Up to date" },
  { course: "MTH-IX-B", linked: 11, status: "Up to date" },
  { course: "MTH-X-A", linked: 14, status: "Up to date" },
  { course: "MTH-X-B", linked: 13, status: "Needs Update" },
  { course: "MTH-REM-01", linked: 8, status: "Up to date" },
  { course: "MTH-ADV-01", linked: 22, status: "Up to date" },
]

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    "On Track": "bg-green-100 text-green-700 border-green-300",
    Ahead: "bg-blue-100 text-blue-700 border-blue-300",
    Special: "bg-purple-100 text-purple-700 border-purple-300",
    Delayed: "bg-red-100 text-red-700 border-red-300",
    "Up to date": "bg-green-100 text-green-700 border-green-300",
    "Needs Update": "bg-orange-100 text-orange-700 border-orange-300",
  }
  return <Badge className={`${map[s] ?? "bg-gray-100 text-gray-700"} border text-xs`}>{s}</Badge>
}

export default function TeacherCoursesPage() {
  return (
    <Shell>
      <PageHeader
        title="My Courses"
        description="Ms. Priya Sharma — Mathematics | Course portfolio, student engagement and DIKSHA linkage"
      />

      <div className="flex items-center justify-between mb-4">
        <div className="grid grid-cols-3 gap-4 flex-1 mr-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6 text-center">
                <p className={`text-3xl font-bold ${s.colour}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Button asChild size="sm">
            <Link href="/teacher/courses/create"><PlusCircle className="h-4 w-4 mr-1" />Create Course</Link>
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Upload className="h-4 w-4 mr-1" />Add Resource
          </Button>
        </div>
      </div>

      {/* Courses Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-blue-600" />Active Courses</CardTitle>
          <CardDescription>Syllabus coverage, assignments and next topics across 6 courses</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course ID</TableHead>
                <TableHead>Course</TableHead>
                <TableHead className="text-center">Students</TableHead>
                <TableHead>Syllabus Coverage</TableHead>
                <TableHead className="text-center">Assignments</TableHead>
                <TableHead className="text-center">Graded</TableHead>
                <TableHead>Next Topic</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((c) => (
                <TableRow key={c.courseId}>
                  <TableCell className="text-xs font-mono text-gray-500">{c.courseId}</TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{c.subject}</p>
                    <p className="text-xs text-gray-500">{c.classSection}</p>
                  </TableCell>
                  <TableCell className="text-center text-sm">{c.students}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={c.syllabus} className="h-1.5 w-16" />
                      <span className={`text-xs ${c.syllabus >= 80 ? "text-green-700" : c.syllabus >= 60 ? "text-yellow-600" : "text-red-600"} font-medium`}>{c.syllabus}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">{c.assignments}</TableCell>
                  <TableCell className="text-center">
                    <span className={c.graded < c.assignments ? "text-orange-600 font-medium text-sm" : "text-green-700 text-sm"}>{c.graded}</span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-700">{c.nextTopic}</TableCell>
                  <TableCell><StatusBadge s={c.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Student Engagement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-green-600" />Student Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-semibold text-green-700 mb-2">Top 5 — Most Engaged</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center">Score %</TableHead>
                  <TableHead className="text-center">Submitted</TableHead>
                  <TableHead className="text-center">Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {engagementData.top.map((s) => (
                  <TableRow key={s.name}>
                    <TableCell>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.cls}</p>
                    </TableCell>
                    <TableCell className="text-center text-sm text-green-700 font-medium">{s.score}%</TableCell>
                    <TableCell className="text-center text-sm">{s.submitted}</TableCell>
                    <TableCell className="text-center text-sm">{s.attendance}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs font-semibold text-red-600 mt-4 mb-2">Bottom 5 — Needs Intervention</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center">Score %</TableHead>
                  <TableHead className="text-center">Submitted</TableHead>
                  <TableHead className="text-center">Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {engagementData.bottom.map((s) => (
                  <TableRow key={s.name}>
                    <TableCell>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.cls}</p>
                    </TableCell>
                    <TableCell className="text-center text-sm text-red-600 font-medium">{s.score}%</TableCell>
                    <TableCell className="text-center text-sm">{s.submitted}</TableCell>
                    <TableCell className="text-center text-sm">{s.attendance}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4 text-orange-600" />Recent Course Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-2 p-2 border rounded-md">
                  <a.icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700">{a.action}</p>
                    <p className="text-xs text-gray-500">{a.detail}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{a.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DIKSHA Mapping */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-teal-600" />DIKSHA Content Mapping</CardTitle>
          <CardDescription>Digital Infrastructure for Knowledge Sharing — linked resources per course</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course ID</TableHead>
                <TableHead className="text-center">Linked Resources</TableHead>
                <TableHead>Link Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dikshaMapping.map((d) => (
                <TableRow key={d.course}>
                  <TableCell className="font-mono text-sm">{d.course}</TableCell>
                  <TableCell className="text-center text-sm font-medium">{d.linked}</TableCell>
                  <TableCell><StatusBadge s={d.status} /></TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" className="text-xs" disabled>
                      {d.status === "Needs Update" ? "Update Links" : "View on DIKSHA"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

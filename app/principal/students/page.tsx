import Link from "next/link"
import {
  Search,
  Filter,
  UserPlus,
  Users,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  TrendingDown,
  Accessibility,
  School,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

// --- Module 25.1: Student Information System ---

const topStats = [
  {
    label: "Total Enrolled",
    value: "1,248",
    sub: "All classes VI–XII",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Present Today",
    value: "1,143",
    sub: "91.6% attendance rate",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    label: "At Risk",
    value: "4",
    sub: "Requires intervention",
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    label: "RTE Seats",
    value: "213",
    sub: "25% quota occupied",
    icon: ShieldCheck,
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
]

type StudentStatus = "Active" | "At Risk" | "Inactive"
type StudentCategory = "General" | "SC" | "ST" | "OBC" | "EWS" | "Minority"

interface Student {
  rollNo: string
  name: string
  classSection: string
  category: StudentCategory
  attendance: string
  lastAssessment: string
  grade: string
  status: StudentStatus
}

const students: Student[] = [
  {
    rollNo: "2025-VI-A-001",
    name: "Aarav Sharma",
    classSection: "VI-A",
    category: "General",
    attendance: "94.2%",
    lastAssessment: "82/100",
    grade: "A",
    status: "Active",
  },
  {
    rollNo: "2025-VI-A-002",
    name: "Priya Gupta",
    classSection: "VI-A",
    category: "SC",
    attendance: "88.5%",
    lastAssessment: "76/100",
    grade: "B+",
    status: "Active",
  },
  {
    rollNo: "2025-VI-B-003",
    name: "Raju Prasad",
    classSection: "VI-B",
    category: "ST",
    attendance: "72.3%",
    lastAssessment: "54/100",
    grade: "C",
    status: "At Risk",
  },
  {
    rollNo: "2025-VII-A-004",
    name: "Meena Kumari",
    classSection: "VII-A",
    category: "OBC",
    attendance: "63.1%",
    lastAssessment: "48/100",
    grade: "D",
    status: "At Risk",
  },
  {
    rollNo: "2025-VII-B-005",
    name: "Arjun Singh",
    classSection: "VII-B",
    category: "EWS",
    attendance: "91.4%",
    lastAssessment: "88/100",
    grade: "A",
    status: "Active",
  },
  {
    rollNo: "2025-VIII-A-006",
    name: "Sunita Devi",
    classSection: "VIII-A",
    category: "SC",
    attendance: "86.7%",
    lastAssessment: "71/100",
    grade: "B+",
    status: "Active",
  },
  {
    rollNo: "2025-VIII-B-007",
    name: "Vikram Yadav",
    classSection: "VIII-B",
    category: "General",
    attendance: "95.8%",
    lastAssessment: "91/100",
    grade: "A+",
    status: "Active",
  },
  {
    rollNo: "2025-IX-A-008",
    name: "Ananya Mishra",
    classSection: "IX-A",
    category: "General",
    attendance: "94.1%",
    lastAssessment: "94/100",
    grade: "A+",
    status: "Active",
  },
  {
    rollNo: "2025-IX-B-009",
    name: "Mohammed Arif",
    classSection: "IX-B",
    category: "Minority",
    attendance: "48.2%",
    lastAssessment: "42/100",
    grade: "D",
    status: "At Risk",
  },
  {
    rollNo: "2025-IX-C-010",
    name: "Fatima Begum",
    classSection: "IX-C",
    category: "Minority",
    attendance: "71.4%",
    lastAssessment: "61/100",
    grade: "C+",
    status: "At Risk",
  },
  {
    rollNo: "2025-X-A-011",
    name: "Rahul Verma",
    classSection: "X-A",
    category: "General",
    attendance: "93.2%",
    lastAssessment: "84/100",
    grade: "A",
    status: "Active",
  },
  {
    rollNo: "2025-X-B-012",
    name: "Deepika Jain",
    classSection: "X-B",
    category: "OBC",
    attendance: "97.6%",
    lastAssessment: "96/100",
    grade: "A+",
    status: "Active",
  },
  {
    rollNo: "2025-XI-A-013",
    name: "Kiran Bala",
    classSection: "XI-A",
    category: "SC",
    attendance: "82.4%",
    lastAssessment: "74/100",
    grade: "B+",
    status: "Active",
  },
  {
    rollNo: "2025-XI-B-014",
    name: "Suresh Kumar",
    classSection: "XI-B",
    category: "ST",
    attendance: "78.9%",
    lastAssessment: "68/100",
    grade: "B",
    status: "Active",
  },
  {
    rollNo: "2025-XII-A-015",
    name: "Reena Patel",
    classSection: "XII-A",
    category: "General",
    attendance: "91.1%",
    lastAssessment: "87/100",
    grade: "A",
    status: "Active",
  },
]

const categoryBreakdown = [
  { label: "General", pct: "42%", color: "bg-gray-200 text-gray-700" },
  { label: "SC", pct: "18%", color: "bg-blue-100 text-blue-700" },
  { label: "ST", pct: "8%", color: "bg-blue-100 text-blue-700" },
  { label: "OBC", pct: "22%", color: "bg-purple-100 text-purple-700" },
  { label: "EWS", pct: "6%", color: "bg-teal-100 text-teal-700" },
  { label: "Minority", pct: "4%", color: "bg-orange-100 text-orange-700" },
]

function StatusBadge({ status }: { status: StudentStatus }) {
  const map: Record<StudentStatus, string> = {
    Active: "bg-green-100 text-green-700",
    "At Risk": "bg-red-100 text-red-700",
    Inactive: "bg-gray-100 text-gray-600",
  }
  return (
    <Badge className={`${map[status]} border-0 text-xs font-medium`}>{status}</Badge>
  )
}

function CategoryBadge({ category }: { category: StudentCategory }) {
  const map: Record<StudentCategory, string> = {
    General: "bg-gray-100 text-gray-600",
    SC: "bg-blue-100 text-blue-700",
    ST: "bg-blue-100 text-blue-700",
    OBC: "bg-purple-100 text-purple-700",
    EWS: "bg-teal-100 text-teal-700",
    Minority: "bg-orange-100 text-orange-700",
  }
  return (
    <Badge className={`${map[category]} border-0 text-xs font-medium`}>{category}</Badge>
  )
}

function GradeChip({ grade }: { grade: string }) {
  const map: Record<string, string> = {
    "A+": "text-green-700 font-bold",
    A: "text-green-600 font-semibold",
    "B+": "text-blue-600 font-semibold",
    B: "text-blue-500 font-semibold",
    "C+": "text-yellow-600 font-medium",
    C: "text-yellow-600 font-medium",
    D: "text-red-600 font-semibold",
    F: "text-red-700 font-bold",
  }
  return <span className={`text-xs ${map[grade] ?? "text-gray-600"}`}>{grade}</span>
}

export default async function StudentsPage() {
  return (
    <Shell>
      {/* Page Header */}
      <PageHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <PageHeaderHeading>Student Information System</PageHeaderHeading>
            <PageHeaderDescription>
              Govt. Senior Secondary School, Delhi &mdash; 1,248 students enrolled
            </PageHeaderDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1.5" />
              Filter
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <UserPlus className="h-4 w-4 mr-1.5" />
              Register New Student
            </Button>
          </div>
        </div>
      </PageHeader>

      {/* Search bar */}
      <div className="mb-5">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, roll no., class..."
            className="pl-9 bg-white"
          />
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {topStats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${s.bg} mb-2`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs font-semibold text-gray-700 mt-0.5">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Student Table */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Student Records</CardTitle>
              <CardDescription className="text-xs">
                Showing 1–15 of 1,248 students &middot; Sorted by Roll No.
              </CardDescription>
            </div>
            <Badge className="bg-blue-50 text-blue-700 border-0 text-xs">
              <School className="h-3 w-3 mr-1" /> Module 25.1
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-600 pl-6">Roll No.</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Student Name</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Class–Section</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Category</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center">Attendance %</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center">Last Assessment</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow
                    key={student.rollNo}
                    className={`text-sm hover:bg-gray-50 transition-colors ${
                      student.status === "At Risk" ? "bg-red-50/30" : ""
                    }`}
                  >
                    <TableCell className="pl-6 font-mono text-xs text-gray-500">
                      {student.rollNo}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {student.status === "At Risk" && (
                          <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        )}
                        <span className="font-medium text-gray-800">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-gray-700">{student.classSection}</span>
                    </TableCell>
                    <TableCell>
                      <CategoryBadge category={student.category} />
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`text-xs font-semibold ${
                          parseFloat(student.attendance) >= 90
                            ? "text-green-700"
                            : parseFloat(student.attendance) >= 75
                            ? "text-yellow-700"
                            : "text-red-700"
                        }`}
                      >
                        {student.attendance}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs text-gray-600">{student.lastAssessment} </span>
                      <GradeChip grade={student.grade} />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={student.status} />
                    </TableCell>
                    <TableCell className="text-center pr-6">
                      <Button variant="outline" size="sm" className="h-7 px-3 text-xs" asChild>
                        <Link href={`/principal/students/${student.rollNo}`}>
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-gray-700">1–15</span> of{" "}
              <span className="font-medium text-gray-700">1,248</span> students
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 text-white text-xs">
                1
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-xs">
                2
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-xs">
                3
              </Button>
              <span className="text-xs text-muted-foreground px-1">…</span>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-xs">
                84
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Stats Row — 4 summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {categoryBreakdown.map((c) => (
              <div key={c.label} className="flex items-center justify-between text-xs">
                <Badge className={`${c.color} border-0 text-xs`}>{c.label}</Badge>
                <span className="font-semibold text-gray-700">{c.pct}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Gender Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-pink-700">Girls</span>
                <span className="font-bold text-gray-700">52% &middot; 649</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-pink-400 rounded-full" style={{ width: "52%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-blue-700">Boys</span>
                <span className="font-bold text-gray-700">48% &middot; 599</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: "48%" }} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              GPI: 1.08 &mdash; above national average
            </p>
          </CardContent>
        </Card>

        {/* Disability / RPwD */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Accessibility className="h-4 w-4 text-indigo-600" />
              Disability (RPwD)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-indigo-600">14</span>
              <span className="text-xs text-muted-foreground pb-1">students</span>
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>With active IEP</span>
                <span className="font-semibold text-gray-800">14 / 14</span>
              </div>
              <div className="flex justify-between">
                <span>Assistive devices provided</span>
                <span className="font-semibold text-gray-800">11 / 14</span>
              </div>
              <div className="flex justify-between">
                <span>Special Educator assigned</span>
                <Badge className="bg-green-100 text-green-700 border-0 text-xs">Yes</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Out-of-School Returnees */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <School className="h-4 w-4 text-teal-600" />
              Out-of-School Returnees
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-teal-600">8</span>
              <span className="text-xs text-muted-foreground pb-1">this year</span>
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Bridge course enrolled</span>
                <span className="font-semibold text-gray-800">8 / 8</span>
              </div>
              <div className="flex justify-between">
                <span>Counselling completed</span>
                <span className="font-semibold text-gray-800">6 / 8</span>
              </div>
              <div className="flex justify-between">
                <span>Retention rate (30-day)</span>
                <Badge className="bg-teal-100 text-teal-700 border-0 text-xs">87.5%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

import Link from "next/link"
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  BookOpen,
  Eye,
  Briefcase,
  ClipboardList,
  TrendingUp,
  School,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Shell } from "@/components/shell"
import {
  PageHeader,
  PageHeaderHeading,
  PageHeaderDescription,
} from "@/components/page-header"

// --- Module 13.2: Teacher Deployment & Staff Management ---

const topStats = [
  {
    label: "Sanctioned Posts",
    value: "54",
    sub: "Teaching: 42 + Non-teaching: 12",
    icon: ClipboardList,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "In Position",
    value: "50",
    sub: "38 Teachers + 12 Non-teaching",
    icon: UserCheck,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    label: "Vacancies",
    value: "4",
    sub: "Maths 1, Science 1, English 2",
    icon: UserX,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    label: "Teacher Attendance",
    value: "38/42",
    sub: "90.5% — 4 absent with leave",
    icon: Users,
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
]

type StaffStatus = "Present" | "Absent" | "On Leave"
type Designation = "PGT" | "TGT" | "PRT" | "PET" | "Special Educator" | "Librarian" | "Lab Assistant" | "Office Clerk" | "Counsellor" | "IT Coordinator"

interface TeachingStaff {
  empId: string
  name: string
  designation: Designation
  subject: string
  qualification: string
  status: StaffStatus
  cpdCurrent: number
  cpdTotal: number
  isTeacher: true
}

interface NonTeachingStaff {
  empId: string
  name: string
  designation: Designation
  subject: string
  qualification: string
  status: StaffStatus
  isTeacher: false
}

type StaffMember = TeachingStaff | NonTeachingStaff

const teachingStaff: TeachingStaff[] = [
  { empId: "T-001", name: "Mr. Rajesh Kumar",  designation: "PGT",              subject: "Mathematics",       qualification: "M.Sc. B.Ed",     status: "Present",  cpdCurrent: 28, cpdTotal: 50, isTeacher: true },
  { empId: "T-002", name: "Ms. Priya Sharma",  designation: "PGT",              subject: "Mathematics",       qualification: "M.Sc. B.Ed",     status: "Present",  cpdCurrent: 18, cpdTotal: 50, isTeacher: true },
  { empId: "T-003", name: "Mr. Suresh Rao",    designation: "PGT",              subject: "Physics",           qualification: "M.Sc. B.Ed",     status: "Present",  cpdCurrent: 35, cpdTotal: 50, isTeacher: true },
  { empId: "T-004", name: "Ms. Kavitha Iyer",  designation: "PGT",              subject: "Chemistry",         qualification: "M.Sc. B.Ed",     status: "On Leave", cpdCurrent: 41, cpdTotal: 50, isTeacher: true },
  { empId: "T-005", name: "Mr. Arun Mehta",    designation: "PGT",              subject: "Biology",           qualification: "M.Sc. B.Ed",     status: "Present",  cpdCurrent: 22, cpdTotal: 50, isTeacher: true },
  { empId: "T-006", name: "Ms. Fatima Ali",    designation: "TGT",              subject: "English",           qualification: "B.A. B.Ed",      status: "Present",  cpdCurrent: 48, cpdTotal: 50, isTeacher: true },
  { empId: "T-007", name: "Mrs. Sunita Gupta", designation: "TGT",              subject: "Hindi",             qualification: "M.A. B.Ed",      status: "Present",  cpdCurrent: 38, cpdTotal: 50, isTeacher: true },
  { empId: "T-008", name: "Mr. Vikram Singh",  designation: "TGT",              subject: "Social Studies",    qualification: "B.A. B.Ed",      status: "Present",  cpdCurrent: 25, cpdTotal: 50, isTeacher: true },
  { empId: "T-009", name: "Ms. Neha Kapoor",   designation: "TGT",              subject: "Science",           qualification: "B.Sc. B.Ed",     status: "Present",  cpdCurrent: 31, cpdTotal: 50, isTeacher: true },
  { empId: "T-010", name: "Mr. Dinesh Yadav",  designation: "TGT",              subject: "Mathematics",       qualification: "B.Sc. B.Ed",     status: "Present",  cpdCurrent: 19, cpdTotal: 50, isTeacher: true },
  { empId: "T-011", name: "Ms. Ritu Verma",    designation: "TGT",              subject: "Computer Science",  qualification: "MCA B.Ed",       status: "Present",  cpdCurrent: 44, cpdTotal: 50, isTeacher: true },
  { empId: "T-012", name: "Mr. Harish Patel",  designation: "PRT",              subject: "Primary (All)",     qualification: "B.Ed",           status: "Present",  cpdCurrent: 29, cpdTotal: 50, isTeacher: true },
  { empId: "T-013", name: "Mrs. Kamla Devi",   designation: "PRT",              subject: "Primary (All)",     qualification: "B.Ed",           status: "Absent",   cpdCurrent: 15, cpdTotal: 50, isTeacher: true },
  { empId: "T-014", name: "Mr. Sanjay Tiwari", designation: "PET",              subject: "Physical Education",qualification: "B.P.Ed",         status: "Present",  cpdCurrent: 33, cpdTotal: 50, isTeacher: true },
  { empId: "T-015", name: "Ms. Anjali Nair",   designation: "Special Educator", subject: "Special Education", qualification: "D.Ed Spl.",      status: "Present",  cpdCurrent: 47, cpdTotal: 50, isTeacher: true },
]

const nonTeachingStaff: NonTeachingStaff[] = [
  { empId: "NT-001", name: "Mr. Rajan Mehta",    designation: "Librarian",     subject: "Library Science",   qualification: "B.Lib",            status: "Present",  isTeacher: false },
  { empId: "NT-002", name: "Ms. Geeta Singh",    designation: "Lab Assistant", subject: "—",                 qualification: "B.Sc.",            status: "Present",  isTeacher: false },
  { empId: "NT-003", name: "Mr. Sunil Kumar",    designation: "Office Clerk",  subject: "—",                 qualification: "Accounts",         status: "Present",  isTeacher: false },
  { empId: "NT-004", name: "Mrs. Poonam Bhatia", designation: "Counsellor",    subject: "—",                 qualification: "M.Sc. Psychology", status: "On Leave", isTeacher: false },
  { empId: "NT-005", name: "Mr. Arvind Roy",     designation: "IT Coordinator",subject: "—",                 qualification: "B.Tech",           status: "Present",  isTeacher: false },
]

const allStaff: StaffMember[] = [...teachingStaff, ...nonTeachingStaff]

const vacancies = [
  { post: "PGT",  subject: "English",     sanctioned: 3, inPosition: 1, vacancy: 2, recruitmentStatus: "Advertised",              actionLabel: "Track",   actionVariant: "outline" as const },
  { post: "PGT",  subject: "Mathematics", sanctioned: 2, inPosition: 1, vacancy: 1, recruitmentStatus: "Recruitment in progress", actionLabel: "Track",   actionVariant: "outline" as const },
  { post: "TGT",  subject: "Biology",     sanctioned: 1, inPosition: 0, vacancy: 1, recruitmentStatus: "Pending DPC approval",    actionLabel: "Escalate",actionVariant: "destructive" as const },
  { post: "TGT",  subject: "Hindi",       sanctioned: 2, inPosition: 2, vacancy: 0, recruitmentStatus: "Filled",                  actionLabel: "View",    actionVariant: "ghost" as const },
]

const cpdCategories = [
  { label: "PGT Teachers",      avg: 31.2, total: 50, pct: 62.4, color: "bg-blue-500" },
  { label: "TGT Teachers",      avg: 26.8, total: 50, pct: 53.6, color: "bg-teal-500" },
  { label: "PRT Teachers",      avg: 22.0, total: 50, pct: 44.0, color: "bg-purple-500" },
  { label: "Special Educators", avg: 47.0, total: 50, pct: 94.0, color: "bg-indigo-500" },
]

const filterTabs = ["All Staff", "Teachers", "Non-Teaching", "On Leave", "Vacant Posts"] as const

// --- Helper badge components ---

function StatusBadge({ status }: { status: StaffStatus }) {
  const map: Record<StaffStatus, string> = {
    Present:  "bg-green-100 text-green-700",
    Absent:   "bg-red-100 text-red-700",
    "On Leave": "bg-yellow-100 text-yellow-700",
  }
  return (
    <Badge className={`${map[status]} border-0 text-xs font-medium`}>{status}</Badge>
  )
}

function DesignationBadge({ designation }: { designation: Designation }) {
  const map: Partial<Record<Designation, string>> = {
    PGT:              "bg-blue-100 text-blue-700",
    TGT:              "bg-teal-100 text-teal-700",
    PRT:              "bg-purple-100 text-purple-700",
    PET:              "bg-orange-100 text-orange-700",
    "Special Educator": "bg-indigo-100 text-indigo-700",
  }
  const cls = map[designation] ?? "bg-gray-100 text-gray-600"
  return (
    <Badge className={`${cls} border-0 text-xs font-medium`}>{designation}</Badge>
  )
}

function VacancyStatusBadge({ status }: { status: string }) {
  if (status === "Advertised") return <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">Advertised</Badge>
  if (status === "Recruitment in progress") return <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">In Progress</Badge>
  if (status === "Pending DPC approval") return <Badge className="bg-red-100 text-red-700 border-0 text-xs">Pending DPC</Badge>
  return <Badge className="bg-green-100 text-green-700 border-0 text-xs">{status}</Badge>
}

function CpdBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100)
  const colorClass =
    pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500"
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-600 whitespace-nowrap">
        {current}/{total}
      </span>
    </div>
  )
}

export default async function StaffPage() {
  return (
    <Shell>
      {/* Page Header */}
      <PageHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <PageHeaderHeading>Staff Management</PageHeaderHeading>
            <PageHeaderDescription>
              Teaching &amp; Non-Teaching Staff &middot; Govt. SSS Delhi
            </PageHeaderDescription>
          </div>
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs self-start sm:self-center">
            <Briefcase className="h-3 w-3 mr-1" /> Module 13.2
          </Badge>
        </div>
      </PageHeader>

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

      {/* Filter Tab Row */}
      <div className="flex flex-wrap gap-2 mb-5">
        {filterTabs.map((tab, idx) => (
          <Button
            key={tab}
            variant={idx === 0 ? "default" : "outline"}
            size="sm"
            className={
              idx === 0
                ? "bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
                : "h-8 text-xs"
            }
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* Main Staff Table */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">All Staff</CardTitle>
              <CardDescription className="text-xs">
                Showing all 20 staff members &middot; Teaching &amp; Non-teaching
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-600 pl-6">Emp ID</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Name</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Designation</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Subject / Role</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Qualification</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center">CPD Hours</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Teaching staff */}
                <TableRow className="bg-blue-50/40">
                  <TableCell colSpan={8} className="pl-6 py-2">
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" /> Teaching Staff (15)
                    </span>
                  </TableCell>
                </TableRow>
                {teachingStaff.map((member) => (
                  <TableRow
                    key={member.empId}
                    className={`text-sm hover:bg-gray-50 transition-colors ${
                      member.status === "Absent" ? "bg-red-50/30" : member.status === "On Leave" ? "bg-yellow-50/30" : ""
                    }`}
                  >
                    <TableCell className="pl-6 font-mono text-xs text-gray-500">{member.empId}</TableCell>
                    <TableCell>
                      <span className="font-medium text-gray-800">{member.name}</span>
                    </TableCell>
                    <TableCell>
                      <DesignationBadge designation={member.designation} />
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">{member.subject}</TableCell>
                    <TableCell className="text-xs text-gray-500">{member.qualification}</TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={member.status} />
                    </TableCell>
                    <TableCell className="text-center">
                      <CpdBar current={member.cpdCurrent} total={member.cpdTotal} />
                    </TableCell>
                    <TableCell className="text-center pr-6">
                      <Button variant="outline" size="sm" className="h-7 px-3 text-xs" asChild>
                        <Link href={`/principal/staff/${member.empId}`}>
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Non-teaching staff */}
                <TableRow className="bg-gray-100/60">
                  <TableCell colSpan={8} className="pl-6 py-2">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" /> Non-Teaching Staff (5)
                    </span>
                  </TableCell>
                </TableRow>
                {nonTeachingStaff.map((member) => (
                  <TableRow
                    key={member.empId}
                    className={`text-sm hover:bg-gray-50 transition-colors ${
                      member.status === "On Leave" ? "bg-yellow-50/30" : ""
                    }`}
                  >
                    <TableCell className="pl-6 font-mono text-xs text-gray-500">{member.empId}</TableCell>
                    <TableCell>
                      <span className="font-medium text-gray-800">{member.name}</span>
                    </TableCell>
                    <TableCell>
                      <DesignationBadge designation={member.designation} />
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">{member.subject}</TableCell>
                    <TableCell className="text-xs text-gray-500">{member.qualification}</TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={member.status} />
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs text-muted-foreground">&mdash;</span>
                    </TableCell>
                    <TableCell className="text-center pr-6">
                      <Button variant="outline" size="sm" className="h-7 px-3 text-xs" asChild>
                        <Link href={`/principal/staff/${member.empId}`}>
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
              Showing <span className="font-medium text-gray-700">1–20</span> of{" "}
              <span className="font-medium text-gray-700">50</span> staff members
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
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Section: Vacancies + CPD side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Vacancy Positions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Vacancy Positions
            </CardTitle>
            <CardDescription className="text-xs">
              4 unfilled posts requiring action
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600 pl-6">Post</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Subject</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-center">Sanctioned</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-center">In Position</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-center">Vacancy</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-center pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vacancies.map((v, idx) => (
                    <TableRow
                      key={idx}
                      className={`text-sm hover:bg-gray-50 transition-colors ${
                        v.vacancy > 0 ? "bg-red-50/20" : ""
                      }`}
                    >
                      <TableCell className="pl-6">
                        <DesignationBadge designation={v.post as Designation} />
                      </TableCell>
                      <TableCell className="text-xs font-medium text-gray-700">{v.subject}</TableCell>
                      <TableCell className="text-center text-xs text-gray-600">{v.sanctioned}</TableCell>
                      <TableCell className="text-center text-xs text-gray-600">{v.inPosition}</TableCell>
                      <TableCell className="text-center">
                        {v.vacancy > 0 ? (
                          <span className="text-xs font-bold text-red-600">{v.vacancy}</span>
                        ) : (
                          <span className="text-xs text-green-600 font-semibold">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <VacancyStatusBadge status={v.recruitmentStatus} />
                      </TableCell>
                      <TableCell className="text-center pr-6">
                        <Button
                          variant={v.actionVariant}
                          size="sm"
                          className={`h-7 px-3 text-xs ${
                            v.actionVariant === "destructive"
                              ? "bg-red-600 hover:bg-red-700 text-white"
                              : ""
                          }`}
                        >
                          {v.actionLabel}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* CPD Compliance Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              CPD Compliance Summary
            </CardTitle>
            <CardDescription className="text-xs">
              Continuous Professional Development — 50 hrs annual target
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            {cpdCategories.map((cat) => (
              <div key={cat.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">{cat.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      {cat.avg}/{cat.total} hrs
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        cat.pct >= 80
                          ? "text-green-600"
                          : cat.pct >= 50
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {cat.pct}%
                    </span>
                  </div>
                </div>
                <Progress
                  value={cat.pct}
                  className={`h-2.5 bg-gray-100 [&>div]:${cat.color}`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {cat.pct >= 80
                    ? "On track — excellent compliance"
                    : cat.pct >= 50
                    ? "Moderate — follow-up recommended"
                    : "Below target — intervention required"}
                </p>
              </div>
            ))}

            {/* CPD legend */}
            <div className="flex flex-wrap gap-3 pt-2 border-t">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                &ge;80% On track
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
                50–79% Follow up
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                &lt;50% Intervene
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </Shell>
  )
}

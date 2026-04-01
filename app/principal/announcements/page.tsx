import {
  Megaphone,
  CheckCircle2,
  BarChart2,
  Send,
  FileText,
  Archive,
  MessageSquare,
  Bell,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Building2,
  Users,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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

// ─── Module 28.1 — School Announcement Management System ───────────────────

type Priority = "High" | "Medium" | "Low"
type AnnCategory = "Academic" | "Administrative" | "Event" | "Alert" | "Government"

interface ActiveAnnouncement {
  id: string
  title: string
  category: AnnCategory
  audience: string
  priority: Priority
  publishedDate: string
  validUntil: string
  ackCount: number
  ackTotal: number
  ackPct: number
}

const activeAnnouncements: ActiveAnnouncement[] = [
  {
    id: "ANN-2025-047",
    title: "Board Exam Fee Submission Reminder",
    category: "Academic",
    audience: "All",
    priority: "High",
    publishedDate: "12 Oct 2025",
    validUntil: "31 Oct 2025",
    ackCount: 1099,
    ackTotal: 1235,
    ackPct: 89,
  },
  {
    id: "ANN-2025-046",
    title: "Annual Sports Day Participation Notice",
    category: "Event",
    audience: "Students",
    priority: "Medium",
    publishedDate: "10 Oct 2025",
    validUntil: "05 Nov 2025",
    ackCount: 722,
    ackTotal: 793,
    ackPct: 91,
  },
  {
    id: "ANN-2025-045",
    title: "NIPUN Bharat Assessment Schedule",
    category: "Government",
    audience: "Teachers + Parents",
    priority: "High",
    publishedDate: "08 Oct 2025",
    validUntil: "20 Oct 2025",
    ackCount: 114,
    ackTotal: 150,
    ackPct: 76,
  },
  {
    id: "ANN-2025-044",
    title: "RTE Admission Open 2025-26",
    category: "Government",
    audience: "Parents",
    priority: "High",
    publishedDate: "05 Oct 2025",
    validUntil: "30 Nov 2025",
    ackCount: 352,
    ackTotal: 400,
    ackPct: 88,
  },
  {
    id: "ANN-2025-043",
    title: "Scholarship Application — Pre-Matric",
    category: "Academic",
    audience: "Students Grade 6+",
    priority: "High",
    publishedDate: "01 Oct 2025",
    validUntil: "15 Nov 2025",
    ackCount: 563,
    ackTotal: 760,
    ackPct: 74,
  },
  {
    id: "ANN-2025-042",
    title: "POCSO Awareness Session",
    category: "Administrative",
    audience: "All Staff",
    priority: "Medium",
    publishedDate: "28 Sep 2025",
    validUntil: "28 Oct 2025",
    ackCount: 78,
    ackTotal: 85,
    ackPct: 92,
  },
  {
    id: "ANN-2025-041",
    title: "PMO School Excellence Award Nomination",
    category: "Administrative",
    audience: "All",
    priority: "Medium",
    publishedDate: "25 Sep 2025",
    validUntil: "10 Nov 2025",
    ackCount: 839,
    ackTotal: 1235,
    ackPct: 68,
  },
  {
    id: "ANN-2025-040",
    title: "Textbook Distribution Schedule",
    category: "Academic",
    audience: "All",
    priority: "Medium",
    publishedDate: "20 Sep 2025",
    validUntil: "05 Oct 2025",
    ackCount: 1173,
    ackTotal: 1235,
    ackPct: 95,
  },
  {
    id: "ANN-2025-039",
    title: "Digital Library Access Credentials",
    category: "Academic",
    audience: "Teachers + Students",
    priority: "Low",
    publishedDate: "15 Sep 2025",
    validUntil: "31 Dec 2025",
    ackCount: 920,
    ackTotal: 1296,
    ackPct: 71,
  },
  {
    id: "ANN-2025-038",
    title: "Health Check-up Camp (RBSK)",
    category: "Administrative",
    audience: "All",
    priority: "Medium",
    publishedDate: "10 Sep 2025",
    validUntil: "20 Oct 2025",
    ackCount: 1025,
    ackTotal: 1235,
    ackPct: 83,
  },
  {
    id: "ANN-2025-037",
    title: "Parent-Teacher Meeting November",
    category: "Event",
    audience: "Parents + Teachers",
    priority: "High",
    publishedDate: "05 Sep 2025",
    validUntil: "15 Nov 2025",
    ackCount: 380,
    ackTotal: 481,
    ackPct: 79,
  },
  {
    id: "ANN-2025-036",
    title: "Annual Day Function Rehearsal",
    category: "Event",
    audience: "Students",
    priority: "Low",
    publishedDate: "01 Sep 2025",
    validUntil: "30 Nov 2025",
    ackCount: 492,
    ackTotal: 793,
    ackPct: 62,
  },
]

interface GovtCircular {
  orderNo: string
  subject: string
  date: string
  issuedBy: string
  actionRequired: string
  status: "Complied" | "In Progress" | "Pending"
}

const govtCirculars: GovtCircular[] = [
  {
    orderNo: "MoE/SE/2025/1048",
    subject: "Implementation of NEP 2020 — Activity-Based Learning Norms",
    date: "08 Oct 2025",
    issuedBy: "MoE, GoI",
    actionRequired: "Submit compliance report by 31 Oct",
    status: "In Progress",
  },
  {
    orderNo: "DSE/DEL/2025/891",
    subject: "NIPUN Bharat Baseline Assessment — Class I–III",
    date: "05 Oct 2025",
    issuedBy: "State Dept. of Education",
    actionRequired: "Conduct assessment, upload data on NIPUN portal",
    status: "In Progress",
  },
  {
    orderNo: "MoE/RTE/2025/312",
    subject: "RTE Section 12(1)(c) — Admission & Reimbursement Cycle",
    date: "01 Oct 2025",
    issuedBy: "MoE, GoI",
    actionRequired: "Submit enrolment data to UDISE+",
    status: "Complied",
  },
  {
    orderNo: "DSE/DEL/2025/874",
    subject: "Swachh Vidyalaya Puraskar 2025 — Nomination Deadline",
    date: "28 Sep 2025",
    issuedBy: "State Dept. of Education",
    actionRequired: "Submit nomination form online",
    status: "Complied",
  },
  {
    orderNo: "MoE/DIKSHA/2025/220",
    subject: "DIKSHA Energised Textbooks — QR Code Verification",
    date: "20 Sep 2025",
    issuedBy: "MoE / NCERT",
    actionRequired: "Verify QR codes, report missing links",
    status: "Complied",
  },
  {
    orderNo: "DSE/DEL/2025/844",
    subject: "Mid-Day Meal Scheme — Menu Revision & Compliance",
    date: "15 Sep 2025",
    issuedBy: "State Dept. of Education",
    actionRequired: "Update MDM register and daily report",
    status: "Complied",
  },
  {
    orderNo: "MoHFW/RBSK/2025/178",
    subject: "Rashtriya Bal Swasthya Karyakram — School Health Screening",
    date: "10 Sep 2025",
    issuedBy: "Ministry of Health & Family Welfare",
    actionRequired: "Facilitate health team access, upload screening data",
    status: "Complied",
  },
  {
    orderNo: "DSE/DEL/2025/821",
    subject: "Pre-Matric Scholarship — Disbursement List Verification",
    date: "02 Sep 2025",
    issuedBy: "State Dept. of Education",
    actionRequired: "Verify beneficiary list, certify bank details",
    status: "Pending",
  },
]

interface Channel {
  name: string
  icon: React.ElementType
  reach: number
  openRate: number
  color: string
}

const channels: Channel[] = [
  { name: "WhatsApp (School Group)", icon: MessageSquare, reach: 94, openRate: 94, color: "bg-green-500" },
  { name: "SMS Broadcast", icon: MessageSquare, reach: 78, openRate: 78, color: "bg-blue-500" },
  { name: "School App (VASA-EOS)", icon: Bell, reach: 67, openRate: 67, color: "bg-purple-500" },
  { name: "Notice Board (Physical)", icon: FileText, reach: 45, openRate: 45, color: "bg-yellow-500" },
  { name: "Email", icon: Send, reach: 52, openRate: 52, color: "bg-gray-500" },
]

interface ArchivedAnn {
  id: string
  title: string
  category: AnnCategory
  expiredOn: string
  finalAckPct: number
}

const archivedAnnouncements: ArchivedAnn[] = [
  {
    id: "ANN-2025-035",
    title: "Half-Yearly Examination Timetable",
    category: "Academic",
    expiredOn: "31 Aug 2025",
    finalAckPct: 97,
  },
  {
    id: "ANN-2025-034",
    title: "Teachers' Day Celebration Programme",
    category: "Event",
    expiredOn: "05 Sep 2025",
    finalAckPct: 100,
  },
  {
    id: "ANN-2025-033",
    title: "Uniform & ID Card Compliance Notice",
    category: "Administrative",
    expiredOn: "20 Aug 2025",
    finalAckPct: 88,
  },
  {
    id: "ANN-2025-032",
    title: "Independence Day Parade Rehearsal Schedule",
    category: "Event",
    expiredOn: "15 Aug 2025",
    finalAckPct: 93,
  },
  {
    id: "ANN-2025-031",
    title: "Summer Remedial Classes — Registration",
    category: "Academic",
    expiredOn: "10 Jun 2025",
    finalAckPct: 81,
  },
]

// ─── Badge helpers ──────────────────────────────────────────────────────────

function PriorityBadge({ p }: { p: Priority }) {
  const map: Record<Priority, string> = {
    High: "bg-red-100 text-red-700",
    Medium: "bg-yellow-100 text-yellow-700",
    Low: "bg-gray-100 text-gray-600",
  }
  return <Badge className={`${map[p]} border-0 text-xs font-medium`}>{p}</Badge>
}

function CategoryBadge({ c }: { c: AnnCategory }) {
  const map: Record<AnnCategory, string> = {
    Academic: "bg-blue-100 text-blue-700",
    Administrative: "bg-purple-100 text-purple-700",
    Event: "bg-green-100 text-green-700",
    Alert: "bg-red-100 text-red-700",
    Government: "bg-orange-100 text-orange-700",
  }
  return <Badge className={`${map[c]} border-0 text-xs font-medium`}>{c}</Badge>
}

function CircularStatusBadge({ s }: { s: GovtCircular["status"] }) {
  const map: Record<GovtCircular["status"], string> = {
    Complied: "bg-green-100 text-green-700",
    "In Progress": "bg-yellow-100 text-yellow-700",
    Pending: "bg-red-100 text-red-700",
  }
  return <Badge className={`${map[s]} border-0 text-xs`}>{s}</Badge>
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function PrincipalAnnouncementsPage() {
  const totalAnn = 47
  const activeCount = 12
  const ackRate = 84.3

  return (
    <Shell>
      {/* ── Header ── */}
      <PageHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <PageHeaderHeading>School Announcement Management</PageHeaderHeading>
            <PageHeaderDescription>
              Module 28.1 &mdash; Principal&apos;s Communication Centre &middot; Govt. Sr. Sec. School, Delhi
            </PageHeaderDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" disabled>
              <Send className="h-4 w-4 mr-1.5" />
              Compose Announcement
            </Button>
          </div>
        </div>
      </PageHeader>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 mb-3">
              <Megaphone className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600">{totalAnn}</div>
            <div className="text-sm font-semibold text-gray-700 mt-0.5">Total Announcements</div>
            <div className="text-xs text-muted-foreground">This term (Jul–Dec 2025)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600">{activeCount}</div>
            <div className="text-sm font-semibold text-gray-700 mt-0.5">Currently Active</div>
            <div className="text-xs text-muted-foreground">Visible to stakeholders</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50 mb-3">
              <BarChart2 className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600">{ackRate}%</div>
            <div className="text-sm font-semibold text-gray-700 mt-0.5">Acknowledgement Rate</div>
            <div className="text-xs text-muted-foreground">Across all active notices</div>
          </CardContent>
        </Card>
      </div>

      {/* ── Active Announcements Table ── */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-600" />
                Active Announcements
              </CardTitle>
              <CardDescription className="text-xs">12 announcements currently live</CardDescription>
            </div>
            <Badge className="bg-blue-50 text-blue-700 border-0 text-xs">Module 28.1</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-600 pl-5">ID</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Title</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Category</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Target Audience</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Priority</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Published</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Valid Until</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-right pr-5">Acknowledgements</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAnnouncements.map((ann) => (
                  <TableRow key={ann.id} className="text-sm hover:bg-gray-50">
                    <TableCell className="pl-5 font-mono text-xs text-gray-500">{ann.id}</TableCell>
                    <TableCell className="font-medium text-gray-800 max-w-[220px]">
                      {ann.priority === "High" && (
                        <AlertTriangle className="inline h-3 w-3 text-red-500 mr-1 mb-0.5" />
                      )}
                      {ann.title}
                    </TableCell>
                    <TableCell><CategoryBadge c={ann.category} /></TableCell>
                    <TableCell className="text-xs text-gray-600">{ann.audience}</TableCell>
                    <TableCell><PriorityBadge p={ann.priority} /></TableCell>
                    <TableCell className="text-xs text-gray-600">{ann.publishedDate}</TableCell>
                    <TableCell className="text-xs text-gray-600">{ann.validUntil}</TableCell>
                    <TableCell className="text-right pr-5">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-semibold text-gray-700">
                          {ann.ackCount}/{ann.ackTotal} &middot; {ann.ackPct}%
                        </span>
                        <div className="w-24">
                          <Progress
                            value={ann.ackPct}
                            className="h-1.5"
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Government Circulars Log ── */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-orange-600" />
            Government Circulars &amp; Orders Log
          </CardTitle>
          <CardDescription className="text-xs">8 recent circulars from MoE / State Department of Education</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-600 pl-5">Order No.</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Subject</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Date</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Issued By</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Action Required</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 pr-5">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {govtCirculars.map((c) => (
                  <TableRow key={c.orderNo} className="text-sm hover:bg-gray-50">
                    <TableCell className="pl-5 font-mono text-xs text-gray-500">{c.orderNo}</TableCell>
                    <TableCell className="font-medium text-gray-800 max-w-[240px] text-xs">{c.subject}</TableCell>
                    <TableCell className="text-xs text-gray-600">{c.date}</TableCell>
                    <TableCell className="text-xs text-gray-600">{c.issuedBy}</TableCell>
                    <TableCell className="text-xs text-gray-600 max-w-[180px]">{c.actionRequired}</TableCell>
                    <TableCell className="pr-5"><CircularStatusBadge s={c.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Bottom Row: Channels + Archive ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Communication Channels Effectiveness */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-purple-600" />
              Communication Channel Effectiveness
            </CardTitle>
            <CardDescription className="text-xs">Reach &amp; open rate by channel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {channels.map((ch) => (
              <div key={ch.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">{ch.name}</span>
                  <span className="font-bold text-gray-800">{ch.openRate}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${ch.color}`}
                    style={{ width: `${ch.openRate}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Archived Announcements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Archive className="h-4 w-4 text-gray-500" />
              Archive — Recently Expired Announcements
            </CardTitle>
            <CardDescription className="text-xs">5 most recently expired notices</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-600 pl-5">ID</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Title</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Category</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Expired On</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-right pr-5">Final Ack %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedAnnouncements.map((a) => (
                  <TableRow key={a.id} className="text-sm hover:bg-gray-50">
                    <TableCell className="pl-5 font-mono text-xs text-gray-500">{a.id}</TableCell>
                    <TableCell className="text-xs text-gray-700 font-medium max-w-[160px]">{a.title}</TableCell>
                    <TableCell><CategoryBadge c={a.category} /></TableCell>
                    <TableCell className="text-xs text-gray-500">{a.expiredOn}</TableCell>
                    <TableCell className="text-right pr-5">
                      <span
                        className={`text-xs font-bold ${
                          a.finalAckPct >= 90
                            ? "text-green-600"
                            : a.finalAckPct >= 75
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {a.finalAckPct}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ── Summary Footer ── */}
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground border-t pt-4">
        <Users className="h-3.5 w-3.5" />
        <span>Total stakeholder reach: 1,235 students &middot; 85 staff &middot; ~400 parents &middot; Communication data refreshed daily at 06:00 IST</span>
        <Badge className="bg-gray-100 text-gray-600 border-0 text-xs ml-auto">
          <BookOpen className="h-3 w-3 mr-1" />
          Module 28.1 — VASA-EOS SE
        </Badge>
        <Badge className="bg-orange-50 text-orange-700 border-0 text-xs">
          <CalendarDays className="h-3 w-3 mr-1" />
          Term: Jul–Dec 2025
        </Badge>
      </div>
    </Shell>
  )
}

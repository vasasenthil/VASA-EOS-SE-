"use client"

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  Flag,
  MapPin,
} from "lucide-react"

// ── Mock Data ────────────────────────────────────────────────────────────────

const STAT_CARDS = [
  {
    title: "Total Milestones",
    value: "247",
    sub: "NEP 2020 mandated",
    icon: ListTodo,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Completed",
    value: "89",
    sub: "36.0% of total",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "In Progress",
    value: "103",
    sub: "41.7% of total",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    title: "Delayed",
    value: "34",
    sub: "13.8% of total",
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
]

type MilestoneStatus = "Completed" | "In Progress" | "Delayed" | "Not Started"

interface Milestone {
  id: string
  thrustArea: string
  description: string
  owner: string
  targetDate: string
  actualDate: string | null
  status: MilestoneStatus
  progress: number
}

const MILESTONES: Milestone[] = [
  {
    id: "MS-001",
    thrustArea: "Early Childhood Care (5+3+3+4)",
    description: "Restructure school education into 5+3+3+4 stages replacing 10+2",
    owner: "NCERT / MoE",
    targetDate: "Mar 2023",
    actualDate: "Jun 2023",
    status: "Completed",
    progress: 100,
  },
  {
    id: "MS-002",
    thrustArea: "Foundational Literacy (NIPUN Bharat)",
    description: "Achieve universal foundational literacy & numeracy by Grade 3 for all children",
    owner: "DoSEL / States",
    targetDate: "Mar 2026",
    actualDate: null,
    status: "In Progress",
    progress: 62,
  },
  {
    id: "MS-003",
    thrustArea: "Curriculum Reform (NCF 2023)",
    description: "Develop and roll out National Curriculum Framework for School Education",
    owner: "NCERT",
    targetDate: "Dec 2022",
    actualDate: "Aug 2023",
    status: "Completed",
    progress: 100,
  },
  {
    id: "MS-004",
    thrustArea: "Teacher Education (4-yr B.Ed.)",
    description: "Transition to integrated 4-year B.Ed. programme; phase out shorter programmes",
    owner: "NCTE / UGC",
    targetDate: "Mar 2024",
    actualDate: null,
    status: "Delayed",
    progress: 38,
  },
  {
    id: "MS-005",
    thrustArea: "Assessment Reform (PARAKH)",
    description: "Establish PARAKH as national assessment regulator; reform board exams",
    owner: "PARAKH / CBSE",
    targetDate: "Sep 2023",
    actualDate: "Nov 2023",
    status: "Completed",
    progress: 100,
  },
  {
    id: "MS-006",
    thrustArea: "Digital Education (PM eVIDYA)",
    description: "Scale PM eVIDYA DTH channels to 200 channels covering all languages",
    owner: "MoE / CIET",
    targetDate: "Mar 2025",
    actualDate: null,
    status: "In Progress",
    progress: 74,
  },
  {
    id: "MS-007",
    thrustArea: "Inclusive Education (RPwD)",
    description: "Universal inclusive education for children with disabilities in regular schools",
    owner: "DEPwD / States",
    targetDate: "Mar 2025",
    actualDate: null,
    status: "Delayed",
    progress: 29,
  },
  {
    id: "MS-008",
    thrustArea: "Vocational Education (Grade 6 onwards)",
    description: "Integrate vocational education from Grade 6 in 25% schools by 2025",
    owner: "MSDE / States",
    targetDate: "Mar 2025",
    actualDate: null,
    status: "In Progress",
    progress: 51,
  },
  {
    id: "MS-009",
    thrustArea: "Multilingualism (Mother Tongue Instruction)",
    description: "Implement mother tongue / home language as medium of instruction up to Grade 5",
    owner: "States / UTs",
    targetDate: "Jun 2024",
    actualDate: null,
    status: "Delayed",
    progress: 44,
  },
  {
    id: "MS-010",
    thrustArea: "Governance (UDISE+)",
    description: "Achieve 100% real-time school data on UDISE+ including teacher & student profiles",
    owner: "DoSEL / NIC",
    targetDate: "Mar 2024",
    actualDate: "Jan 2024",
    status: "Completed",
    progress: 100,
  },
  {
    id: "MS-011",
    thrustArea: "School Accreditation (SIQE)",
    description: "Establish State Institute of Quality Education in all states for school grading",
    owner: "States / MoE",
    targetDate: "Dec 2024",
    actualDate: null,
    status: "In Progress",
    progress: 57,
  },
  {
    id: "MS-012",
    thrustArea: "Higher Education Linkage",
    description: "Create seamless credit transfer between school & HEIs via Academic Bank of Credits",
    owner: "UGC / AICTE",
    targetDate: "Mar 2025",
    actualDate: null,
    status: "Not Started",
    progress: 8,
  },
  {
    id: "MS-013",
    thrustArea: "Gender Inclusion (KGBV)",
    description: "Upgrade and expand Kasturba Gandhi Balika Vidyalayas to Grade 12 in 740 districts",
    owner: "DoSEL / States",
    targetDate: "Mar 2026",
    actualDate: null,
    status: "In Progress",
    progress: 45,
  },
  {
    id: "MS-014",
    thrustArea: "Library Development",
    description: "Establish functional libraries with minimum 500 books in all primary schools",
    owner: "States / KVS / NVS",
    targetDate: "Mar 2025",
    actualDate: null,
    status: "Delayed",
    progress: 33,
  },
  {
    id: "MS-015",
    thrustArea: "Sports & Art Integration",
    description: "Make sports, yoga and performing arts part of core curriculum (Grades 1–12)",
    owner: "SAI / Lalit Kala Akademi",
    targetDate: "Apr 2024",
    actualDate: null,
    status: "In Progress",
    progress: 66,
  },
]

const DELAYED_ALERTS = [
  {
    id: "MS-004",
    description: "4-year integrated B.Ed. programme rollout",
    entity: "NCTE",
    delayDays: 390,
    severity: "Critical",
  },
  {
    id: "MS-007",
    description: "Inclusive education for children with disabilities",
    entity: "DEPwD / State Govts",
    delayDays: 210,
    severity: "High",
  },
  {
    id: "MS-009",
    description: "Mother tongue instruction mandate up to Grade 5",
    entity: "State Education Depts",
    delayDays: 298,
    severity: "Critical",
  },
  {
    id: "MS-014",
    description: "School library development (500+ books target)",
    entity: "State Education Depts",
    delayDays: 156,
    severity: "Medium",
  },
  {
    id: "MS-016",
    description: "District Institutes of Education & Training reform",
    entity: "SCERTs / DIETs",
    delayDays: 445,
    severity: "Critical",
  },
]

const STATE_PROGRESS = [
  { state: "Kerala", completed: 82, inProgress: 14, delayed: 4, pct: 82 },
  { state: "Tamil Nadu", completed: 76, inProgress: 18, delayed: 6, pct: 76 },
  { state: "Maharashtra", completed: 68, inProgress: 22, delayed: 10, pct: 68 },
  { state: "Gujarat", completed: 61, inProgress: 28, delayed: 11, pct: 61 },
  { state: "Rajasthan", completed: 47, inProgress: 33, delayed: 20, pct: 47 },
  { state: "Uttar Pradesh", completed: 39, inProgress: 38, delayed: 23, pct: 39 },
  { state: "Bihar", completed: 31, inProgress: 42, delayed: 27, pct: 31 },
  { state: "Jharkhand", completed: 28, inProgress: 40, delayed: 32, pct: 28 },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MilestoneStatus }) {
  const map: Record<MilestoneStatus, string> = {
    Completed: "bg-green-100 text-green-800 border-green-200",
    "In Progress": "bg-amber-100 text-amber-800 border-amber-200",
    Delayed: "bg-red-100 text-red-800 border-red-200",
    "Not Started": "bg-slate-100 text-slate-600 border-slate-200",
  }
  return (
    <Badge variant="outline" className={`text-xs font-medium ${map[status]}`}>
      {status}
    </Badge>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    Critical: "bg-red-100 text-red-800 border-red-200",
    High: "bg-orange-100 text-orange-800 border-orange-200",
    Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  }
  return (
    <Badge variant="outline" className={`text-xs font-medium ${map[severity] ?? ""}`}>
      {severity}
    </Badge>
  )
}

// ── Page Component ────────────────────────────────────────────────────────────

export default function MilestonesPage() {
  return (
    <Shell>
      <PageHeader>
        <div className="flex items-center gap-2">
          <Flag className="h-6 w-6 text-blue-600" />
          <PageHeaderHeading>NEP 2020 Implementation Milestones Tracker</PageHeaderHeading>
        </div>
        <PageHeaderDescription>
          Module 25.5 — Real-time tracking of National Education Policy 2020 implementation milestones across thrust areas, states and responsible entities.
        </PageHeaderDescription>
      </PageHeader>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="border shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                  </div>
                  <div className={`rounded-lg p-2.5 ${card.bg}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Milestone List Table */}
      <Card className="mb-8 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Milestone Register</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-24 font-semibold">Milestone ID</TableHead>
                  <TableHead className="font-semibold">NEP Thrust Area</TableHead>
                  <TableHead className="font-semibold min-w-[260px]">Milestone Description</TableHead>
                  <TableHead className="font-semibold">Owner</TableHead>
                  <TableHead className="font-semibold">Target Date</TableHead>
                  <TableHead className="font-semibold">Actual Date</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold min-w-[120px]">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MILESTONES.map((m) => (
                  <TableRow key={m.id} className="hover:bg-slate-50/60">
                    <TableCell className="font-mono text-xs font-semibold text-blue-700">{m.id}</TableCell>
                    <TableCell className="text-sm font-medium">{m.thrustArea}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.description}</TableCell>
                    <TableCell className="text-sm">{m.owner}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{m.targetDate}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {m.actualDate ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={m.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={m.progress} className="h-2 w-20" />
                        <span className="text-xs font-medium text-muted-foreground">{m.progress}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Delayed Milestones Alert Panel */}
        <Card className="shadow-sm border-red-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg text-red-700">Critical Delayed Milestones</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-red-50">
                  <TableHead className="font-semibold text-red-800">ID</TableHead>
                  <TableHead className="font-semibold text-red-800">Description</TableHead>
                  <TableHead className="font-semibold text-red-800">Responsible Entity</TableHead>
                  <TableHead className="font-semibold text-red-800">Delay (Days)</TableHead>
                  <TableHead className="font-semibold text-red-800">Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DELAYED_ALERTS.map((d) => (
                  <TableRow key={d.id} className="hover:bg-red-50/40">
                    <TableCell className="font-mono text-xs font-semibold text-red-700">{d.id}</TableCell>
                    <TableCell className="text-sm">{d.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.entity}</TableCell>
                    <TableCell>
                      <span className="font-bold text-red-600">{d.delayDays}</span>
                    </TableCell>
                    <TableCell>
                      <SeverityBadge severity={d.severity} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* State-wise Milestone Progress */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">State-wise Milestone Progress</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">State</TableHead>
                  <TableHead className="font-semibold text-green-700">Completed %</TableHead>
                  <TableHead className="font-semibold text-amber-700">In Progress %</TableHead>
                  <TableHead className="font-semibold text-red-700">Delayed %</TableHead>
                  <TableHead className="font-semibold min-w-[130px]">Overall</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STATE_PROGRESS.map((s) => (
                  <TableRow key={s.state} className="hover:bg-slate-50/60">
                    <TableCell className="font-medium text-sm">{s.state}</TableCell>
                    <TableCell className="text-sm text-green-700 font-semibold">{s.completed}%</TableCell>
                    <TableCell className="text-sm text-amber-700 font-semibold">{s.inProgress}%</TableCell>
                    <TableCell className="text-sm text-red-700 font-semibold">{s.delayed}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={s.pct} className="h-2 w-20" />
                        <span className="text-xs font-medium">{s.pct}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

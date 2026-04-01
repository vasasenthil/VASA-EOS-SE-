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
  Users,
  MessageSquare,
  Star,
  CalendarCheck,
  Network,
  Activity,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from "lucide-react"

// ── Mock Data ────────────────────────────────────────────────────────────────

const STAT_CARDS = [
  {
    title: "Total Stakeholders",
    value: "1,847",
    sub: "In engagement registry",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Engaged This Month",
    value: "423",
    sub: "March 2026",
    icon: Network,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    title: "Feedback Received",
    value: "312",
    sub: "From 423 engagements",
    icon: MessageSquare,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Satisfaction Score",
    value: "74.3%",
    sub: "Composite index",
    icon: Star,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
]

type StakeholderType = "Ministry" | "State Dept" | "NGO" | "UN Agency" | "Industry" | "Civil Society" | "Regulatory Body" | "Academic"
type EngagementStatus = "Active" | "Engaged" | "Inactive" | "Pending"

interface Stakeholder {
  id: string
  name: string
  type: StakeholderType
  roleInNEP: string
  contactLevel: string
  engagementStatus: EngagementStatus
  lastInteraction: string
}

const STAKEHOLDERS: Stakeholder[] = [
  {
    id: "SH-001",
    name: "Ministry of Education (MoE)",
    type: "Ministry",
    roleInNEP: "Nodal ministry for NEP 2020 implementation; policy mandates, fund release, inter-ministerial coordination",
    contactLevel: "Secretary / JS Level",
    engagementStatus: "Active",
    lastInteraction: "28 Mar 2026",
  },
  {
    id: "SH-002",
    name: "NCERT (National Council of Educational Research and Training)",
    type: "Regulatory Body",
    roleInNEP: "Curriculum design, NCF 2023 development, textbook revision, NISHTHA teacher training",
    contactLevel: "Director / Deputy Director",
    engagementStatus: "Active",
    lastInteraction: "25 Mar 2026",
  },
  {
    id: "SH-003",
    name: "CBSE (Central Board of Secondary Education)",
    type: "Regulatory Body",
    roleInNEP: "Exam reform, CCE framework, competency-based assessment rollout, student data",
    contactLevel: "Chairman / Controller",
    engagementStatus: "Active",
    lastInteraction: "22 Mar 2026",
  },
  {
    id: "SH-004",
    name: "NTA (National Testing Agency)",
    type: "Regulatory Body",
    roleInNEP: "CUET implementation, national entrance testing reform, assessment standardisation",
    contactLevel: "Director General",
    engagementStatus: "Engaged",
    lastInteraction: "18 Mar 2026",
  },
  {
    id: "SH-005",
    name: "NITI Aayog",
    type: "Ministry",
    roleInNEP: "NEP outcome monitoring, SDG 4 tracking, district education index, PM-SHRI review",
    contactLevel: "CEO / Advisor Level",
    engagementStatus: "Active",
    lastInteraction: "20 Mar 2026",
  },
  {
    id: "SH-006",
    name: "UNICEF India",
    type: "UN Agency",
    roleInNEP: "Technical support on ECCE, inclusive education, out-of-school children data, WASH",
    contactLevel: "Chief of Education",
    engagementStatus: "Active",
    lastInteraction: "24 Mar 2026",
  },
  {
    id: "SH-007",
    name: "World Bank — Education for All Project",
    type: "UN Agency",
    roleInNEP: "Samagra Shiksha financing, learning assessment support, results-based financing",
    contactLevel: "Task Team Leader",
    engagementStatus: "Engaged",
    lastInteraction: "15 Mar 2026",
  },
  {
    id: "SH-008",
    name: "Azim Premji Foundation",
    type: "NGO",
    roleInNEP: "Field implementation support in tribal and rural districts; teacher professional development",
    contactLevel: "Executive Director",
    engagementStatus: "Active",
    lastInteraction: "26 Mar 2026",
  },
  {
    id: "SH-009",
    name: "Pratham Education Foundation",
    type: "NGO",
    roleInNEP: "ASER learning outcome measurement; FLN community programme; dropout prevention",
    contactLevel: "CEO / State Heads",
    engagementStatus: "Active",
    lastInteraction: "21 Mar 2026",
  },
  {
    id: "SH-010",
    name: "CII — National Committee on Education",
    type: "Industry",
    roleInNEP: "Industry-school linkage for vocational education; internship MoUs; PM-SHRI adoption",
    contactLevel: "Committee Chair",
    engagementStatus: "Engaged",
    lastInteraction: "12 Mar 2026",
  },
  {
    id: "SH-011",
    name: "State SCERTs (Representative Consortium)",
    type: "State Dept",
    roleInNEP: "State curriculum adaptation, teacher training cascade, SEF monitoring, NEP SPD reviews",
    contactLevel: "SCERT Directors",
    engagementStatus: "Active",
    lastInteraction: "27 Mar 2026",
  },
  {
    id: "SH-012",
    name: "District Education Officers (DEOs) Network",
    type: "State Dept",
    roleInNEP: "Ground-level NEP rollout, school mapping, enrolment drive, Samagra grant utilisation",
    contactLevel: "District Collector / DEO",
    engagementStatus: "Engaged",
    lastInteraction: "19 Mar 2026",
  },
  {
    id: "SH-013",
    name: "SMC Federation (School Management Committee)",
    type: "Civil Society",
    roleInNEP: "Community participation, school development plans, grievance redressal, enrolment support",
    contactLevel: "Block & District Level",
    engagementStatus: "Pending",
    lastInteraction: "08 Mar 2026",
  },
  {
    id: "SH-014",
    name: "AIFTO (All India Federation of Teachers' Organisations)",
    type: "Civil Society",
    roleInNEP: "Teacher policy advocacy, B.Ed. reform feedback, workload norms, service conditions",
    contactLevel: "National General Secretary",
    engagementStatus: "Engaged",
    lastInteraction: "14 Mar 2026",
  },
  {
    id: "SH-015",
    name: "National Parent Associations Consortium",
    type: "Civil Society",
    roleInNEP: "CCE acceptance, mother tongue instruction awareness, RTE monitoring, school safety advocacy",
    contactLevel: "National & State Conveners",
    engagementStatus: "Inactive",
    lastInteraction: "22 Feb 2026",
  },
]

interface ActivityLog {
  id: string
  date: string
  event: string
  type: string
  participants: string
  outcome: string
}

const ACTIVITY_LOG: ActivityLog[] = [
  {
    id: "EV-001",
    date: "28 Mar 2026",
    event: "NEP Annual Progress Review — Quarter 4 FY 2025-26",
    type: "Review Meeting",
    participants: "MoE, NCERT, CBSE, State Secretaries (28)",
    outcome: "15 action points issued; revised timelines agreed for 3 delayed milestones",
  },
  {
    id: "EV-002",
    date: "24 Mar 2026",
    event: "ECCE Policy Consultation — WCD & MoE Joint Workshop",
    type: "Workshop",
    participants: "UNICEF, Azim Premji Foundation, WCD, 6 State SCERTs",
    outcome: "Draft ECCE curriculum framework shared; NISHTHA ECE module finalised",
  },
  {
    id: "EV-003",
    date: "21 Mar 2026",
    event: "FLN Assessment Field Visit — Bihar & UP Districts",
    type: "Field Visit",
    participants: "NCERT, Pratham, DoSEL officials, 4 DEOs",
    outcome: "NIPUN assessment data collected from 312 schools; remediation plan drafted",
  },
  {
    id: "EV-004",
    date: "18 Mar 2026",
    event: "Vocational Education Industry Roundtable",
    type: "Consultation",
    participants: "CII, NSDC, MSDE, 12 Industry Partners, 5 State VE Coordinators",
    outcome: "34 new school-industry MoUs signed; NSQF Level 2 curriculum modules agreed",
  },
  {
    id: "EV-005",
    date: "14 Mar 2026",
    event: "Teacher Policy Dialogue — AIFTO & NCTE",
    type: "Consultation",
    participants: "AIFTO, NCTE, MoE JS, 3 State Education Secretaries",
    outcome: "4-year B.Ed. phased roadmap discussed; workload norms revision noted",
  },
  {
    id: "EV-006",
    date: "12 Mar 2026",
    event: "PM-SHRI Schools Capacity Building — Regional Workshop (North Zone)",
    type: "Workshop",
    participants: "700+ principals, 5 State SCERTs, CBSE, KVIC",
    outcome: "Quality benchmarks training completed; 680 schools onboarded to QMS portal",
  },
  {
    id: "EV-007",
    date: "08 Mar 2026",
    event: "Inclusive Education Review — DEPwD & MoE",
    type: "Review Meeting",
    participants: "DEPwD, RCI, UNICEF, 8 State Special Education Coordinators",
    outcome: "Special educator vacancy data updated; RCI expansion proposal forwarded to Cabinet",
  },
  {
    id: "EV-008",
    date: "05 Mar 2026",
    event: "UDISE+ Data Quality Audit — National Coordination Meet",
    type: "Review Meeting",
    participants: "NIC, DoSEL, 14 State UDISE+ Nodal Officers",
    outcome: "18% mismatch records flagged; APAAR ID integration timeline set for Jun 2026",
  },
]

type Sentiment = "Positive" | "Negative" | "Neutral"

interface FeedbackTheme {
  theme: string
  count: number
  sentiment: Sentiment
  summary: string
}

const FEEDBACK_THEMES: FeedbackTheme[] = [
  {
    theme: "Teacher Training (NISHTHA)",
    count: 87,
    sentiment: "Positive",
    summary: "Majority appreciate online modular format but request more subject-specific modules",
  },
  {
    theme: "Assessment Reform (CCE / PARAKH)",
    count: 64,
    sentiment: "Neutral",
    summary: "Mixed responses — progressive educators supportive, parent community apprehensive about rigour",
  },
  {
    theme: "Digital Infrastructure Gaps",
    count: 71,
    sentiment: "Negative",
    summary: "Strong negative sentiment on rural connectivity; device shortages cited as barrier to PM eVIDYA",
  },
  {
    theme: "Early Childhood Education (ECCE)",
    count: 53,
    sentiment: "Positive",
    summary: "Anganwadi workers and parents receptive to play-based learning; demand for trained teachers high",
  },
  {
    theme: "Mother Tongue Instruction Policy",
    count: 37,
    sentiment: "Neutral",
    summary: "Regional variation in acceptance; urban parents concerned about English proficiency impact",
  },
]

interface PlannedEngagement {
  id: string
  event: string
  date: string
  stakeholders: string
  objective: string
  lead: string
}

const PLANNED_ENGAGEMENTS: PlannedEngagement[] = [
  {
    id: "PE-001",
    event: "NEP Implementation Review — Inter-State Conference",
    date: "10 Apr 2026",
    stakeholders: "State Education Secretaries (All 28 States + 8 UTs)",
    objective: "Review FY 2025-26 milestone completion; set FY 2026-27 annual plan targets",
    lead: "Secretary, MoE",
  },
  {
    id: "PE-002",
    event: "ECCE National Conclave",
    date: "18 Apr 2026",
    stakeholders: "NCERT, WCD, UNICEF, State SCERTs, NGO partners",
    objective: "Launch ECCE curriculum pack; sensitisation on play-based pedagogy rollout",
    lead: "NCERT Director",
  },
  {
    id: "PE-003",
    event: "Industry-Academia Linkage Summit",
    date: "25 Apr 2026",
    stakeholders: "CII, FICCI, NSDC, AICTE, 20 HEIs, 15 Industry Sectors",
    objective: "Sign MoUs for apprenticeship in schools; ABC credit transfer pilot launch",
    lead: "MSDE Secretary",
  },
  {
    id: "PE-004",
    event: "Parent & Community Awareness Campaign Launch",
    date: "05 May 2026",
    stakeholders: "SMC Federation, Parent Associations, Gram Panchayats (5 focus states)",
    objective: "Build demand for CCE, mother tongue instruction; reduce dropout through community pledge",
    lead: "DoSEL JS",
  },
  {
    id: "PE-005",
    event: "Global Education Coalition — India NEP Showcase",
    date: "20 May 2026",
    stakeholders: "UNESCO, UNICEF, World Bank, 12 Country Delegations",
    objective: "Showcase India's NEP implementation learnings for South-South cooperation",
    lead: "MoE Secretary",
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: StakeholderType }) {
  const map: Record<StakeholderType, string> = {
    Ministry: "bg-blue-100 text-blue-800 border-blue-200",
    "State Dept": "bg-cyan-100 text-cyan-800 border-cyan-200",
    NGO: "bg-green-100 text-green-800 border-green-200",
    "UN Agency": "bg-purple-100 text-purple-800 border-purple-200",
    Industry: "bg-orange-100 text-orange-800 border-orange-200",
    "Civil Society": "bg-pink-100 text-pink-800 border-pink-200",
    "Regulatory Body": "bg-indigo-100 text-indigo-800 border-indigo-200",
    Academic: "bg-teal-100 text-teal-800 border-teal-200",
  }
  return (
    <Badge variant="outline" className={`text-xs font-medium whitespace-nowrap ${map[type]}`}>
      {type}
    </Badge>
  )
}

function EngagementBadge({ status }: { status: EngagementStatus }) {
  const map: Record<EngagementStatus, string> = {
    Active: "bg-green-100 text-green-800 border-green-200",
    Engaged: "bg-amber-100 text-amber-800 border-amber-200",
    Inactive: "bg-slate-100 text-slate-600 border-slate-200",
    Pending: "bg-red-100 text-red-700 border-red-200",
  }
  return (
    <Badge variant="outline" className={`text-xs font-medium ${map[status]}`}>
      {status}
    </Badge>
  )
}

function ActivityTypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    "Review Meeting": "bg-blue-100 text-blue-800 border-blue-200",
    Workshop: "bg-indigo-100 text-indigo-800 border-indigo-200",
    "Field Visit": "bg-green-100 text-green-800 border-green-200",
    Consultation: "bg-amber-100 text-amber-800 border-amber-200",
  }
  return (
    <Badge variant="outline" className={`text-xs font-medium whitespace-nowrap ${map[type] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}>
      {type}
    </Badge>
  )
}

function SentimentIcon({ sentiment }: { sentiment: Sentiment }) {
  if (sentiment === "Positive") return <ThumbsUp className="h-4 w-4 text-green-600" />
  if (sentiment === "Negative") return <ThumbsDown className="h-4 w-4 text-red-600" />
  return <Minus className="h-4 w-4 text-amber-600" />
}

function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const map: Record<Sentiment, string> = {
    Positive: "bg-green-100 text-green-800 border-green-200",
    Negative: "bg-red-100 text-red-800 border-red-200",
    Neutral: "bg-amber-100 text-amber-800 border-amber-200",
  }
  return (
    <Badge variant="outline" className={`text-xs font-medium flex items-center gap-1 ${map[sentiment]}`}>
      <SentimentIcon sentiment={sentiment} />
      {sentiment}
    </Badge>
  )
}

// ── Page Component ────────────────────────────────────────────────────────────

export default function StakeholdersPage() {
  return (
    <Shell>
      <PageHeader>
        <div className="flex items-center gap-2">
          <Network className="h-6 w-6 text-blue-600" />
          <PageHeaderHeading>NEP Stakeholder Engagement Registry</PageHeaderHeading>
        </div>
        <PageHeaderDescription>
          Module 25.7 — Comprehensive registry of NEP 2020 stakeholders, engagement activities, feedback analysis and upcoming communication plan.
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

      {/* Stakeholder Registry Table */}
      <Card className="mb-8 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Stakeholder Registry</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold w-24">ID</TableHead>
                  <TableHead className="font-semibold min-w-[200px]">Name</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold min-w-[280px]">Role in NEP</TableHead>
                  <TableHead className="font-semibold min-w-[160px]">Contact Level</TableHead>
                  <TableHead className="font-semibold">Engagement Status</TableHead>
                  <TableHead className="font-semibold whitespace-nowrap">Last Interaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STAKEHOLDERS.map((s) => (
                  <TableRow key={s.id} className="hover:bg-slate-50/60">
                    <TableCell className="font-mono text-xs font-semibold text-blue-700">{s.id}</TableCell>
                    <TableCell className="text-sm font-medium">{s.name}</TableCell>
                    <TableCell>
                      <TypeBadge type={s.type} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.roleInNEP}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.contactLevel}</TableCell>
                    <TableCell>
                      <EngagementBadge status={s.engagementStatus} />
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{s.lastInteraction}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card className="mb-8 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg">Engagement Activity Log</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold w-24">Event ID</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold min-w-[240px]">Event</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold min-w-[260px]">Participants</TableHead>
                  <TableHead className="font-semibold min-w-[260px]">Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ACTIVITY_LOG.map((ev) => (
                  <TableRow key={ev.id} className="hover:bg-slate-50/60">
                    <TableCell className="font-mono text-xs font-semibold text-indigo-700">{ev.id}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{ev.date}</TableCell>
                    <TableCell className="text-sm font-medium">{ev.event}</TableCell>
                    <TableCell>
                      <ActivityTypeBadge type={ev.type} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{ev.participants}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{ev.outcome}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Feedback Analysis */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Feedback Analysis — Key Themes</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">Based on 312 stakeholder feedback submissions (March 2026)</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {FEEDBACK_THEMES.map((ft) => (
                <div key={ft.theme} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{ft.theme}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <SentimentBadge sentiment={ft.sentiment} />
                      <span className="text-xs font-semibold text-muted-foreground">{ft.count} responses</span>
                    </div>
                  </div>
                  <Progress
                    value={Math.round((ft.count / 312) * 100)}
                    className={`h-2 ${
                      ft.sentiment === "Positive"
                        ? "[&>div]:bg-green-500"
                        : ft.sentiment === "Negative"
                        ? "[&>div]:bg-red-500"
                        : "[&>div]:bg-amber-500"
                    }`}
                  />
                  <p className="text-xs text-muted-foreground">{ft.summary}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Communication Plan */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-lg">Upcoming Communication Plan</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">Planned stakeholder engagements — April to May 2026</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {PLANNED_ENGAGEMENTS.map((pe) => (
                <div
                  key={pe.id}
                  className="rounded-lg border border-amber-100 bg-amber-50/40 p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-amber-700">{pe.id}</span>
                    <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      {pe.date}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-snug">{pe.event}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Stakeholders:</span> {pe.stakeholders}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Objective:</span> {pe.objective}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Lead:</span> {pe.lead}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

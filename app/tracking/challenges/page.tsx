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
  AlertOctagon,
  ShieldAlert,
  CheckCircle2,
  ArrowUpCircle,
  Flame,
  TrendingUp,
  Users,
} from "lucide-react"

// ── Mock Data ────────────────────────────────────────────────────────────────

const STAT_CARDS = [
  {
    title: "Open Challenges",
    value: "67",
    sub: "Across all categories",
    icon: AlertOctagon,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "High Priority",
    value: "23",
    sub: "Critical + High severity",
    icon: ShieldAlert,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    title: "Resolved This Quarter",
    value: "12",
    sub: "Q1 FY 2025-26",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Escalated",
    value: "8",
    sub: "To national level",
    icon: ArrowUpCircle,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
]

type Severity = "Critical" | "High" | "Medium" | "Low"
type ChallengeStatus = "Open" | "In Progress" | "Resolved" | "Escalated"

interface Challenge {
  id: string
  category: string
  description: string
  severity: Severity
  affectedStates: string
  rootCause: string
  mitigationAction: string
  status: ChallengeStatus
}

const CHALLENGES: Challenge[] = [
  {
    id: "CH-001",
    category: "Human Resources",
    description: "Acute teacher shortage in rural and tribal areas — vacancy rate exceeding 35% in remote blocks",
    severity: "Critical",
    affectedStates: "UP, MP, Bihar, Jharkhand, Rajasthan",
    rootCause: "Absence of rural service incentives; long pending state recruitment drives",
    mitigationAction: "Accelerate state TET recruitment; deploy para-teachers under Samagra Shiksha",
    status: "In Progress",
  },
  {
    id: "CH-002",
    category: "Infrastructure",
    description: "Severe infrastructure deficit in OBC-dominated districts — 42% schools lack functional toilets or electricity",
    severity: "High",
    affectedStates: "Bihar, Odisha, West Bengal, UP",
    rootCause: "Fund utilisation below 55% under PM-POSHAN and Samagra Shiksha",
    mitigationAction: "Enhanced fund-flow monitoring; district-level infrastructure task forces",
    status: "Open",
  },
  {
    id: "CH-003",
    category: "Digital Access",
    description: "Persistent digital divide — 61% rural households lack internet connectivity for PM eVIDYA access",
    severity: "Critical",
    affectedStates: "Northeast, Bihar, MP, Chhattisgarh, Rajasthan",
    rootCause: "BharatNet Phase II delays; device affordability for low-income families",
    mitigationAction: "Offline DIKSHA content packs; community learning centres with shared devices",
    status: "Escalated",
  },
  {
    id: "CH-004",
    category: "Curriculum & Pedagogy",
    description: "Language barrier in implementing multilingual / mother tongue instruction policy for 22 scheduled languages",
    severity: "High",
    affectedStates: "Nagaland, Manipur, Meghalaya, Arunachal, Tribal districts pan-India",
    rootCause: "Absence of bilingual textbooks; trained teachers in tribal languages unavailable",
    mitigationAction: "Tribal language textbook development under NCERT; DIET training modules",
    status: "In Progress",
  },
  {
    id: "CH-005",
    category: "Financial Management",
    description: "Budget under-utilisation of Samagra Shiksha grants — national average utilisation 68% against 90% target",
    severity: "Medium",
    affectedStates: "Uttar Pradesh, Rajasthan, Assam",
    rootCause: "Delayed state counterpart share; weak procurement planning at district level",
    mitigationAction: "PFM strengthening workshops; monthly utilisation review with State Finance Secretaries",
    status: "Open",
  },
  {
    id: "CH-006",
    category: "Governance & Policy",
    description: "Regulatory misalignment between Centre and State on 4-year B.Ed. transition timeline and fee structures",
    severity: "High",
    affectedStates: "All states (systemic)",
    rootCause: "Education in Concurrent List; states citing capacity constraints for 2-year to 4-year shift",
    mitigationAction: "Joint Secretary-level consultation; NCTE issuance of phased compliance orders",
    status: "Escalated",
  },
  {
    id: "CH-007",
    category: "Assessment Reform",
    description: "Community and parent resistance to Continuous & Comprehensive Evaluation replacing annual board exams",
    severity: "Medium",
    affectedStates: "Maharashtra, Tamil Nadu, Karnataka, Delhi NCR",
    rootCause: "Perception that CCE reduces rigour; teacher unpreparedness for portfolio assessment",
    mitigationAction: "Parent awareness campaigns; PARAKH evidence dissemination; teacher training modules",
    status: "In Progress",
  },
  {
    id: "CH-008",
    category: "Equity & Inclusion",
    description: "Post-COVID learning loss and increased dropout — Secondary enrolment ratio dropped 4.2 pp in FY 2021-23",
    severity: "Critical",
    affectedStates: "Bihar, UP, Rajasthan, Odisha, MP",
    rootCause: "School closures; child labour reversion; adolescent girls' marriage spike during lockdown",
    mitigationAction: "Bridge camps; conditional cash transfer expansion; targeted outreach through SMCs",
    status: "Escalated",
  },
  {
    id: "CH-009",
    category: "Early Childhood",
    description: "Early childhood workforce quality gap — 78% Anganwadi workers lack ECE-specific pedagogical training",
    severity: "High",
    affectedStates: "All states (national systemic gap)",
    rootCause: "ECCE certification not yet mandatory; WCD–MoE coordination gap in NISHTHA ECE modules",
    mitigationAction: "Joint MoE-WCD training calendar; mandatory ECCE diploma by 2026",
    status: "In Progress",
  },
  {
    id: "CH-010",
    category: "Vocational Education",
    description: "Weak industry-school linkage for vocational education — only 12% VE schools have active industry MoUs",
    severity: "Medium",
    affectedStates: "All states (low penetration outside metro districts)",
    rootCause: "MSDE-state coordination gaps; curriculum misaligned with NSQF levels",
    mitigationAction: "NSDC sector-skill councils engagement; CII-FICCI partnership under PM-SHRI",
    status: "Open",
  },
  {
    id: "CH-011",
    category: "Inclusive Education",
    description: "Acute special educator shortage — 1 special educator per 3,200 CWSN against norm of 1:100",
    severity: "High",
    affectedStates: "Bihar, UP, MP, Odisha, Jharkhand",
    rootCause: "Limited RCI-accredited training institutions; unattractive salary scales",
    mitigationAction: "RCI institute expansion; DEPwD special educator incentive scheme",
    status: "Escalated",
  },
  {
    id: "CH-012",
    category: "Data & Governance",
    description: "UDISE+ data quality issues — 18% records have mismatches between infrastructure and enrolment data",
    severity: "Medium",
    affectedStates: "Uttar Pradesh, Bihar, West Bengal, Rajasthan",
    rootCause: "Manual data entry at school level; absence of triangulation with Aadhaar/APAAR ID",
    mitigationAction: "APAAR ID rollout; auto-validation rules in UDISE+ portal; district data audits",
    status: "In Progress",
  },
]

// Risk heat-map data: rows = Probability (5=Almost Certain → 1=Rare), cols = Impact (1=Negligible → 5=Catastrophic)
const RISK_HEATMAP: { prob: string; cells: number[] }[] = [
  { prob: "Almost Certain (5)", cells: [0, 1, 2, 3, 2] },
  { prob: "Likely (4)", cells: [0, 1, 3, 2, 1] },
  { prob: "Possible (3)", cells: [1, 2, 2, 1, 0] },
  { prob: "Unlikely (2)", cells: [1, 1, 1, 0, 0] },
  { prob: "Rare (1)", cells: [0, 1, 0, 0, 0] },
]

const IMPACT_LABELS = ["Negligible", "Minor", "Moderate", "Major", "Catastrophic"]

interface MitigationAction {
  id: string
  action: string
  owner: string
  deadline: string
  progress: number
}

const MITIGATION_ACTIONS: MitigationAction[] = [
  {
    id: "MA-001",
    action: "State-level TET recruitment drive for 85,000 teacher vacancies in 7 high-deficit states",
    owner: "DoSEL / State Govts",
    deadline: "Jun 2026",
    progress: 48,
  },
  {
    id: "MA-002",
    action: "BharatNet last-mile connectivity to 45,000 unconnected government schools",
    owner: "DoT / MoE",
    deadline: "Mar 2026",
    progress: 62,
  },
  {
    id: "MA-003",
    action: "ECCE workforce upskilling — 1.8 lakh Anganwadi workers trained via NISHTHA ECE",
    owner: "WCD / NCERT",
    deadline: "Dec 2025",
    progress: 73,
  },
  {
    id: "MA-004",
    action: "APAAR ID rollout to eliminate UDISE+ duplicate and ghost student records",
    owner: "NIC / DoSEL",
    deadline: "Sep 2025",
    progress: 55,
  },
  {
    id: "MA-005",
    action: "Post-COVID dropout re-enrolment drive targeting 14 lakh out-of-school children",
    owner: "State Education Depts",
    deadline: "Mar 2026",
    progress: 37,
  },
]

interface EscalationEntry {
  id: string
  challenge: string
  escalatedBy: string
  escalatedTo: string
  date: string
  outcome: string
}

const ESCALATION_LOG: EscalationEntry[] = [
  {
    id: "ESC-001",
    challenge: "CH-003 — Digital divide blocking PM eVIDYA access",
    escalatedBy: "Joint Secretary, DoSEL",
    escalatedTo: "Secretary, MoE & DoT",
    date: "14 Jan 2026",
    outcome: "Inter-ministerial task force constituted; BharatNet deadline revised to Mar 2026",
  },
  {
    id: "ESC-002",
    challenge: "CH-006 — Centre-State misalignment on 4-year B.Ed. rollout",
    escalatedBy: "NCTE Chairperson",
    escalatedTo: "Education Secretary / CABE",
    date: "02 Feb 2026",
    outcome: "CABE sub-committee formed; phased compliance plan under review",
  },
  {
    id: "ESC-003",
    challenge: "CH-008 — Post-COVID dropout surge in 5 high-burden states",
    escalatedBy: "State Education Secretaries (5-state consortium)",
    escalatedTo: "MoE Secretary / PMO Education Cell",
    date: "19 Feb 2026",
    outcome: "Emergency bridge course funding Rs 480 Cr approved; monitoring dashboard live",
  },
  {
    id: "ESC-004",
    challenge: "CH-011 — Special educator shortage blocking CWSN integration",
    escalatedBy: "DEPwD Commissioner",
    escalatedTo: "Secretary, MoE & Social Justice",
    date: "08 Mar 2026",
    outcome: "RCI capacity expansion plan approved; salary revision under Finance Ministry review",
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: Severity }) {
  const map: Record<Severity, string> = {
    Critical: "bg-red-100 text-red-800 border-red-200",
    High: "bg-orange-100 text-orange-800 border-orange-200",
    Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Low: "bg-slate-100 text-slate-600 border-slate-200",
  }
  return (
    <Badge variant="outline" className={`text-xs font-medium ${map[severity]}`}>
      {severity}
    </Badge>
  )
}

function ChallengeStatusBadge({ status }: { status: ChallengeStatus }) {
  const map: Record<ChallengeStatus, string> = {
    Open: "bg-blue-100 text-blue-800 border-blue-200",
    "In Progress": "bg-amber-100 text-amber-800 border-amber-200",
    Resolved: "bg-green-100 text-green-800 border-green-200",
    Escalated: "bg-purple-100 text-purple-800 border-purple-200",
  }
  return (
    <Badge variant="outline" className={`text-xs font-medium ${map[status]}`}>
      {status}
    </Badge>
  )
}

function heatmapColor(count: number): string {
  if (count === 0) return "bg-slate-50 text-slate-400"
  if (count === 1) return "bg-yellow-100 text-yellow-800"
  if (count === 2) return "bg-orange-200 text-orange-900"
  return "bg-red-300 text-red-900 font-bold"
}

// ── Page Component ────────────────────────────────────────────────────────────

export default function ChallengesPage() {
  return (
    <Shell>
      <PageHeader>
        <div className="flex items-center gap-2">
          <Flame className="h-6 w-6 text-red-600" />
          <PageHeaderHeading>NEP Implementation Challenges & Risk Register</PageHeaderHeading>
        </div>
        <PageHeaderDescription>
          Module 25.6 — Systematic tracking of implementation challenges, risk heat-map, mitigation actions and escalation log for NEP 2020 execution across India.
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

      {/* Challenge Register Table */}
      <Card className="mb-8 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Challenge Register</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold w-24">Challenge ID</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold min-w-[240px]">Description</TableHead>
                  <TableHead className="font-semibold">Severity</TableHead>
                  <TableHead className="font-semibold min-w-[180px]">Affected States</TableHead>
                  <TableHead className="font-semibold min-w-[200px]">Root Cause</TableHead>
                  <TableHead className="font-semibold min-w-[220px]">Mitigation Action</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CHALLENGES.map((c) => (
                  <TableRow key={c.id} className="hover:bg-slate-50/60">
                    <TableCell className="font-mono text-xs font-semibold text-red-700">{c.id}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs whitespace-nowrap">
                        {c.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.description}</TableCell>
                    <TableCell>
                      <SeverityBadge severity={c.severity} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.affectedStates}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.rootCause}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.mitigationAction}</TableCell>
                    <TableCell>
                      <ChallengeStatusBadge status={c.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Risk Heat-map */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">Risk Heat-Map (Probability × Impact)</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Numbers indicate count of challenges in each cell. Darker = higher risk.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="text-left pr-3 pb-2 text-muted-foreground font-medium w-36">Probability \ Impact</th>
                    {IMPACT_LABELS.map((label) => (
                      <th key={label} className="text-center pb-2 font-medium text-muted-foreground px-2">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RISK_HEATMAP.map((row) => (
                    <tr key={row.prob}>
                      <td className="pr-3 py-1 text-muted-foreground font-medium">{row.prob}</td>
                      {row.cells.map((count, idx) => (
                        <td key={idx} className="py-1 px-2 text-center">
                          <div
                            className={`rounded w-10 h-10 flex items-center justify-center mx-auto font-semibold text-sm ${heatmapColor(count)}`}
                          >
                            {count > 0 ? count : "—"}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-4 mt-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" />
                <span className="text-xs text-muted-foreground">Low risk (1)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-orange-200 border border-orange-300" />
                <span className="text-xs text-muted-foreground">Medium risk (2)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-red-300 border border-red-400" />
                <span className="text-xs text-muted-foreground">High risk (3+)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mitigation Action Tracker */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Top Mitigation Actions Tracker</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {MITIGATION_ACTIONS.map((ma) => (
                <div key={ma.id} className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-xs font-bold text-green-700">{ma.id}</span>
                        <span className="text-xs text-muted-foreground">· Due {ma.deadline}</span>
                      </div>
                      <p className="text-sm font-medium leading-snug">{ma.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Owner: {ma.owner}</p>
                    </div>
                    <span className="text-sm font-bold text-green-700 shrink-0">{ma.progress}%</span>
                  </div>
                  <Progress value={ma.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Escalation Log */}
      <Card className="shadow-sm border-purple-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg text-purple-800">Escalation Log — National Level</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-purple-50">
                  <TableHead className="font-semibold text-purple-800 w-24">Escalation ID</TableHead>
                  <TableHead className="font-semibold text-purple-800 min-w-[220px]">Challenge</TableHead>
                  <TableHead className="font-semibold text-purple-800">Escalated By</TableHead>
                  <TableHead className="font-semibold text-purple-800">Escalated To</TableHead>
                  <TableHead className="font-semibold text-purple-800">Date</TableHead>
                  <TableHead className="font-semibold text-purple-800 min-w-[260px]">Outcome / Action Taken</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ESCALATION_LOG.map((e) => (
                  <TableRow key={e.id} className="hover:bg-purple-50/40">
                    <TableCell className="font-mono text-xs font-bold text-purple-700">{e.id}</TableCell>
                    <TableCell className="text-sm font-medium">{e.challenge}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.escalatedBy}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.escalatedTo}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{e.date}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.outcome}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </Shell>
  )
}

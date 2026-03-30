"use client"

import {
  Target,
  TrendingUp,
  Lightbulb,
  Shield,
  Users,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  IndianRupee,
  Star,
  Activity,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

// --- Module 70.2a: Strategic Planning & Vision ---

const strategicPillars = [
  {
    id: "P1",
    name: "Universal Access",
    progress: 82,
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bg: "bg-blue-50",
    icon: Users,
    description: "Enrolment, retention and completion for all age groups",
  },
  {
    id: "P2",
    name: "Quality Enhancement",
    progress: 67,
    color: "bg-green-500",
    textColor: "text-green-700",
    bg: "bg-green-50",
    icon: Star,
    description: "Learning outcomes, teacher quality and assessment reform",
  },
  {
    id: "P3",
    name: "Equity & Inclusion",
    progress: 71,
    color: "bg-purple-500",
    textColor: "text-purple-700",
    bg: "bg-purple-50",
    icon: Shield,
    description: "Gender, SC/ST/OBC, RPwD and minority focused interventions",
  },
  {
    id: "P4",
    name: "Innovation & Technology",
    progress: 58,
    color: "bg-orange-500",
    textColor: "text-orange-700",
    bg: "bg-orange-50",
    icon: Lightbulb,
    description: "Digital infrastructure, EdTech and blended learning",
  },
  {
    id: "P5",
    name: "Governance Excellence",
    progress: 74,
    color: "bg-teal-500",
    textColor: "text-teal-700",
    bg: "bg-teal-50",
    icon: BarChart3,
    description: "Transparency, accountability and data-driven management",
  },
]

const kpiCards = [
  {
    label: "Strategic Score",
    value: "72.4",
    unit: "/100",
    sub: "Composite index Q4 FY25",
    icon: TrendingUp,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Initiatives Active",
    value: "18",
    unit: "",
    sub: "Across 5 strategic pillars",
    icon: Activity,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    label: "On-Track",
    value: "11",
    unit: "",
    sub: "≥70% progress to target",
    icon: CheckCircle2,
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    label: "At-Risk",
    value: "4",
    unit: "",
    sub: "Requires corrective action",
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
]

type InitiativeStatus = "On Track" | "At Risk" | "Delayed" | "Completed"

interface Initiative {
  name: string
  pillar: string
  owner: string
  budget: string
  spent: string
  status: InitiativeStatus
  targetYear: string
}

const initiatives: Initiative[] = [
  {
    name: "School Consolidation Plan",
    pillar: "Governance Excellence",
    owner: "DE (Planning)",
    budget: "12.40",
    spent: "4.80",
    status: "On Track",
    targetYear: "2026-27",
  },
  {
    name: "PM SHRI School Upgradation (50 schools)",
    pillar: "Quality Enhancement",
    owner: "DE (Infrastructure)",
    budget: "84.00",
    spent: "56.20",
    status: "On Track",
    targetYear: "2025-26",
  },
  {
    name: "Digital Infrastructure Rollout",
    pillar: "Innovation & Technology",
    owner: "DE (IT Cell)",
    budget: "38.50",
    spent: "18.40",
    status: "At Risk",
    targetYear: "2025-26",
  },
  {
    name: "Teacher Capacity Building (NEP)",
    pillar: "Quality Enhancement",
    owner: "SCERT Delhi",
    budget: "22.00",
    spent: "14.70",
    status: "On Track",
    targetYear: "2025-26",
  },
  {
    name: "ECCE Centre Establishment (248 centres)",
    pillar: "Universal Access",
    owner: "DE (Elementary)",
    budget: "31.20",
    spent: "19.80",
    status: "On Track",
    targetYear: "2026-27",
  },
  {
    name: "Vocational Lab Setup Grade 6–8",
    pillar: "Innovation & Technology",
    owner: "DE (Vocational)",
    budget: "18.60",
    spent: "6.20",
    status: "Delayed",
    targetYear: "2026-27",
  },
  {
    name: "School Health Programme",
    pillar: "Equity & Inclusion",
    owner: "DE (Health Cell)",
    budget: "9.80",
    spent: "7.40",
    status: "On Track",
    targetYear: "2025-26",
  },
  {
    name: "Community Engagement (SMC Training)",
    pillar: "Governance Excellence",
    owner: "DE (Community)",
    budget: "4.20",
    spent: "3.60",
    status: "Completed",
    targetYear: "2024-25",
  },
  {
    name: "Dropout Prevention Intervention",
    pillar: "Universal Access",
    owner: "DE (Secondary)",
    budget: "14.50",
    spent: "8.90",
    status: "At Risk",
    targetYear: "2025-26",
  },
  {
    name: "Girls' Education (KGBV Strengthening)",
    pillar: "Equity & Inclusion",
    owner: "DE (Girls Edu.)",
    budget: "26.80",
    spent: "20.10",
    status: "On Track",
    targetYear: "2025-26",
  },
]

const annualTargets = [
  { metric: "Gross Enrolment Ratio (GER) Secondary", target: "98.5%", achieved: "96.2%", gap: "-2.3%", onTrack: true },
  { metric: "Net Attendance Rate", target: "88.0%", achieved: "84.7%", gap: "-3.3%", onTrack: false },
  { metric: "Learning Outcome (Grade 3 Literacy)", target: "75.0%", achieved: "71.4%", gap: "-3.6%", onTrack: false },
  { metric: "Teacher Qualification (B.Ed+)", target: "95.0%", achieved: "93.8%", gap: "-1.2%", onTrack: true },
  { metric: "Girls' Retention Rate (Sec.)", target: "92.0%", achieved: "91.4%", gap: "-0.6%", onTrack: true },
  { metric: "Schools with Functional Toilets (Girls)", target: "100%", achieved: "100%", gap: "0%", onTrack: true },
  { metric: "ICT Labs Operational", target: "80.0%", achieved: "54.0%", gap: "-26.0%", onTrack: false },
  { metric: "PTR ≤30:1 (Secondary)", target: "100%", achieved: "87.5%", gap: "-12.5%", onTrack: false },
]

const stakeholderSatisfaction = [
  { group: "Parents / Guardians", score: 74, responses: 1284, color: "bg-blue-500" },
  { group: "Teaching Staff", score: 68, responses: 892, color: "bg-green-500" },
  { group: "SMC Members", score: 81, responses: 248, color: "bg-purple-500" },
  { group: "Students (Sec.)", score: 77, responses: 3640, color: "bg-orange-500" },
  { group: "NGO / CSR Partners", score: 83, responses: 42, color: "bg-teal-500" },
]

function StatusBadge({ status }: { status: InitiativeStatus }) {
  const map: Record<InitiativeStatus, string> = {
    "On Track": "bg-green-100 text-green-700",
    "At Risk": "bg-red-100 text-red-700",
    "Delayed": "bg-yellow-100 text-yellow-700",
    "Completed": "bg-blue-100 text-blue-700",
  }
  return <Badge className={`${map[status]} border-0 text-xs font-medium`}>{status}</Badge>
}

export default function StrategyPage() {
  return (
    <Shell>
      <PageHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <PageHeaderHeading>Strategic Planning &amp; Vision</PageHeaderHeading>
            <PageHeaderDescription>
              Module 70.2a &mdash; Director of Education, Delhi NCT &mdash; FY 2025–26 Strategic Dashboard
            </PageHeaderDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm">
              <Clock className="h-4 w-4 mr-1.5" />
              Review Schedule
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Target className="h-4 w-4 mr-1.5" />
              Update Targets
            </Button>
          </div>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${k.bg} mb-2`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div className={`text-2xl font-bold ${k.color}`}>
                {k.value}<span className="text-sm font-normal text-muted-foreground">{k.unit}</span>
              </div>
              <div className="text-xs font-semibold text-gray-700 mt-0.5">{k.label}</div>
              <div className="text-xs text-muted-foreground">{k.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Strategic Pillars */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Five Strategic Pillars — Progress</CardTitle>
              <CardDescription className="text-xs">NEP 2020 aligned strategic framework for Delhi NCT education system</CardDescription>
            </div>
            <Badge className="bg-blue-50 text-blue-700 border-0 text-xs">FY 2025–26</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {strategicPillars.map((p) => (
            <div key={p.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`inline-flex items-center justify-center w-7 h-7 rounded-md ${p.bg}`}>
                    <p.icon className={`h-4 w-4 ${p.textColor}`} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-800">{p.name}</span>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${p.textColor}`}>{p.progress}%</span>
              </div>
              <Progress value={p.progress} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Strategic Initiatives Table */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Strategic Initiatives</CardTitle>
              <CardDescription className="text-xs">All active, completed and at-risk initiatives across pillars — Budget in ₹ Crore</CardDescription>
            </div>
            <Badge className="bg-purple-50 text-purple-700 border-0 text-xs">10 Initiatives</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-600 pl-6">Initiative</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Pillar</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Owner</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-right">Budget ₹Cr</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-right">Spent ₹Cr</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center pr-6">Target Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initiatives.map((ini) => (
                  <TableRow key={ini.name} className="text-sm hover:bg-gray-50">
                    <TableCell className="pl-6 font-medium text-gray-800 max-w-[220px]">{ini.name}</TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-600">{ini.pillar}</span>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">{ini.owner}</TableCell>
                    <TableCell className="text-right font-semibold text-gray-700">
                      <span className="flex items-center justify-end gap-0.5">
                        <IndianRupee className="h-3 w-3" />{ini.budget}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-700">
                      <span className="flex items-center justify-end gap-0.5">
                        <IndianRupee className="h-3 w-3" />{ini.spent}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={ini.status} />
                    </TableCell>
                    <TableCell className="text-center pr-6 text-xs text-gray-600">{ini.targetYear}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Annual Targets vs Achievement */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Annual Targets vs Achievement</CardTitle>
            <CardDescription className="text-xs">Key performance metrics for FY 2025–26 (as of Q3)</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-600 pl-6">Metric</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center">Target</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center">Achieved</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center pr-4">Gap</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {annualTargets.map((t) => (
                  <TableRow key={t.metric} className="text-xs hover:bg-gray-50">
                    <TableCell className="pl-6 text-gray-700 font-medium max-w-[180px] leading-tight py-2">{t.metric}</TableCell>
                    <TableCell className="text-center font-semibold text-gray-700">{t.target}</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-semibold ${t.onTrack ? "text-green-700" : "text-red-700"}`}>{t.achieved}</span>
                    </TableCell>
                    <TableCell className="text-center pr-4">
                      <Badge className={`border-0 text-xs ${t.onTrack ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{t.gap}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Stakeholder Satisfaction */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Stakeholder Satisfaction Scores</CardTitle>
            <CardDescription className="text-xs">Annual perception survey FY 2025–26 (scale: 0–100)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {stakeholderSatisfaction.map((s) => (
              <div key={s.group} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{s.group}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">n={s.responses.toLocaleString()}</span>
                    <span className="font-bold text-gray-800">{s.score}/100</span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.score}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Overall satisfaction: <span className="font-bold text-gray-800">76.6/100</span> — weighted average across all stakeholder groups
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

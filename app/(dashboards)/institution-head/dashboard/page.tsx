import Link from "next/link"
import {
  Building2,
  Users,
  GraduationCap,
  Activity,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Clock,
  BarChart3,
  Globe,
  Target,
  Layers,
  Cpu,
  BookOpen,
  Flag,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { HorizontalBarChart } from "@/components/charts/horizontal-bar-chart"
import { DonutChart } from "@/components/charts/donut-chart"
import { GroupedBarChart } from "@/components/charts/grouped-bar-chart"
import { CHART_COLORS } from "@/components/charts/chart-colors"

// ── Mock Data ──────────────────────────────────────────────────────────────────

const kpis = [
  {
    label: "Schools Under Jurisdiction",
    value: "248",
    sub: "schools",
    icon: Building2,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Total Students",
    value: "3,12,480",
    sub: "enrolled",
    icon: GraduationCap,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    label: "Total Teachers",
    value: "8,946",
    sub: "Vacancy: 12.4%",
    icon: Users,
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    label: "Average Attendance",
    value: "83.7%",
    sub: "across all schools",
    icon: Activity,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    label: "Budget Utilised (FY 2024-25)",
    value: "₹847 Cr",
    sub: "of ₹1,240 Cr — 68.3%",
    icon: IndianRupee,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    label: "Compliance Score",
    value: "76.2%",
    sub: "RTE norms",
    icon: ShieldCheck,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
]

const policyPillars = [
  { name: "Foundational Literacy (NIPUN)", pct: 78 },
  { name: "Digital Infrastructure (smart classrooms)", pct: 62 },
  { name: "Teacher Training (NEP-aligned CPD)", pct: 71 },
  { name: "Vocational Education Integration", pct: 41 },
  { name: "Inclusive Education (IEP coverage)", pct: 58 },
  { name: "Assessment Reform (FA/SA balance)", pct: 64 },
]

const schoolDistribution = [
  { category: "High Performing", count: 48, pct: "19.4%", ner: "96.2", outcome: 71 },
  { category: "Average Performing", count: 142, pct: "57.3%", ner: "87.4", outcome: 54 },
  { category: "Needs Improvement", count: 38, pct: "15.3%", ner: "76.1", outcome: 41 },
  { category: "Critical Attention", count: 20, pct: "8.1%", ner: "68.3", outcome: 32 },
]

const schemeFunds = [
  { name: "Samagra Shiksha", utilised: 428, total: 580, pct: 73.8 },
  { name: "PM POSHAN", utilised: 142, total: 190, pct: 74.7 },
  { name: "PM SHRI (3 schools)", utilised: 28, total: 45, pct: 62.2 },
  { name: "State Schemes", utilised: 249, total: 425, pct: 58.6 },
]

const schemeStatus = [
  {
    scheme: "Samagra Shiksha",
    awpb: "Approved",
    ucStatus: "Q3 UC Submitted",
    nextAction: "Await Q4 release",
  },
  {
    scheme: "PM POSHAN",
    awpb: "Approved",
    ucStatus: "Q3 UC Pending",
    nextAction: "Submit by Apr 10",
  },
  {
    scheme: "PM SHRI",
    awpb: "Approved",
    ucStatus: "Q2 UC Done",
    nextAction: "Q3 Submission Apr 5",
  },
  {
    scheme: "NIPUN Bharat",
    awpb: "Approved",
    ucStatus: "Up to date",
    nextAction: "Mid-year review",
  },
]

const governanceAlerts = [
  {
    text: "20 schools require urgent infrastructure repair (fire safety overdue)",
    level: "Critical",
  },
  {
    text: "Teacher recruitment: 1,108 posts pending approval from PSC",
    level: "High",
  },
  {
    text: "UDISE+ data discrepancy in 14 schools — validation needed",
    level: "Medium",
  },
  {
    text: "PARAKH competency test results: 3 districts below state average",
    level: "Medium",
  },
]

const convergence = [
  { ministry: "MoHFW", programme: "School Health Screening", status: "Partial", updated: "Feb 2025" },
  { ministry: "MoWCD", programme: "Anganwadi-School Transition", status: "In Progress", updated: "Mar 2025" },
  { ministry: "MoTA", programme: "EMRS Data Sync", status: "Completed", updated: "Mar 2025" },
  { ministry: "MoSJE", programme: "SC Scholarship Verification", status: "Partial", updated: "Jan 2025" },
  { ministry: "MSDE", programme: "Vocational Ed (Grade 6–8)", status: "Planning", updated: "Dec 2024" },
]

const initiatives = [
  { name: "PM SHRI expansion (5 more schools)", status: "In Progress", target: "Sep 2025", pct: 45 },
  { name: "NIPUN Bharat Block Saturation", status: "In Progress", target: "Mar 2026", pct: 62 },
  { name: "AI Lab setup (50 schools)", status: "Planning", target: "Dec 2025", pct: 18 },
  { name: "Teacher Rationalisation Drive", status: "Approved", target: "May 2025", pct: 30 },
]

// ── Helper components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Completed: "bg-green-100 text-green-700",
    "In Progress": "bg-blue-100 text-blue-700",
    Partial: "bg-yellow-100 text-yellow-700",
    Planning: "bg-gray-100 text-gray-600",
    Approved: "bg-teal-100 text-teal-700",
    Critical: "bg-red-100 text-red-700",
    High: "bg-orange-100 text-orange-700",
    Medium: "bg-yellow-100 text-yellow-700",
  }
  return (
    <Badge className={`${map[status] ?? "bg-gray-100 text-gray-600"} border-0 text-xs`}>
      {status}
    </Badge>
  )
}

function distCategoryColor(cat: string) {
  if (cat === "High Performing") return "text-green-600"
  if (cat === "Average Performing") return "text-blue-600"
  if (cat === "Needs Improvement") return "text-yellow-600"
  return "text-red-600"
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function InstitutionHeadDashboardPage() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="container mx-auto py-6 px-4 md:px-8 space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Institution Head Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dr. Suresh Menon · Director of Education, Delhi NCT
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3" /> {today}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className="bg-blue-100 text-blue-700 border-0 text-xs px-3 py-1">
            <BarChart3 className="h-3 w-3 mr-1" /> Module 70.2 — State/UT Strategic View
          </Badge>
        </div>
      </div>

      {/* ── Section 1 — KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${k.bg} mb-2`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div className={`text-xl font-bold leading-tight ${k.color}`}>{k.value}</div>
              <div className="text-xs font-medium text-gray-600 mt-0.5 leading-snug">{k.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{k.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Section 2 — Policy Implementation + School Distribution ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Policy Implementation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Flag className="h-4 w-4 text-blue-600" /> NEP 2020 Policy Implementation Status
            </CardTitle>
            <CardDescription className="text-xs">
              Progress across key pillars — percentage of schools implementing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart
              data={policyPillars.map((p) => ({
                label: p.name,
                value: p.pct,
                color: p.pct >= 70 ? CHART_COLORS.green : p.pct >= 55 ? CHART_COLORS.blue : CHART_COLORS.orange,
              }))}
              height={280}
              yAxisWidth={220}
            />
          </CardContent>
        </Card>

        {/* School Performance Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-600" /> School Performance Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              248 schools categorised by outcome index
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <DonutChart
                data={[
                  { name: "High Performing", value: 48, color: CHART_COLORS.green },
                  { name: "Average Performing", value: 142, color: CHART_COLORS.blue },
                  { name: "Needs Improvement", value: 38, color: CHART_COLORS.amber },
                  { name: "Critical Attention", value: 20, color: CHART_COLORS.red },
                ]}
                height={240}
                centerLabel="Schools"
                centerValue="248"
                showLegend={false}
              />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs text-center">Count</TableHead>
                    <TableHead className="text-xs text-center">Avg NER</TableHead>
                    <TableHead className="text-xs text-center">Outcome</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schoolDistribution.map((r) => (
                    <TableRow key={r.category} className="text-xs">
                      <TableCell className={`font-semibold ${distCategoryColor(r.category)}`}>
                        {r.category}
                      </TableCell>
                      <TableCell className="text-center">{r.count}</TableCell>
                      <TableCell className="text-center">{r.ner}%</TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-semibold ${
                            r.outcome >= 60
                              ? "text-green-600"
                              : r.outcome >= 45
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {r.outcome}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Section 3 — Budget + Scheme Status + Governance Alerts ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Scheme Fund Utilisation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-purple-600" /> Scheme Fund Utilisation
            </CardTitle>
            <CardDescription className="text-xs">FY 2024-25 fund release vs utilisation</CardDescription>
          </CardHeader>
          <CardContent>
            <GroupedBarChart
              data={schemeFunds.map((s) => ({
                label: s.name.length > 16 ? s.name.slice(0, 14) + "…" : s.name,
                utilised: s.utilised,
                total: s.total,
              }))}
              xKey="label"
              series={[
                { key: "utilised", name: "Utilised (₹Cr)", color: CHART_COLORS.green },
                { key: "total", name: "Released (₹Cr)", color: CHART_COLORS.blue },
              ]}
              height={220}
              unit="Cr"
              xAxisAngle={-20}
            />
          </CardContent>
        </Card>

        {/* Scheme Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" /> Scheme AWP&amp;B Status
            </CardTitle>
            <CardDescription className="text-xs">
              Utilisation certificate tracking and next actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Scheme</TableHead>
                  <TableHead className="text-xs">AWP&amp;B</TableHead>
                  <TableHead className="text-xs">UC Status</TableHead>
                  <TableHead className="text-xs">Next Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schemeStatus.map((s) => (
                  <TableRow key={s.scheme} className="text-xs">
                    <TableCell className="font-medium">{s.scheme}</TableCell>
                    <TableCell>
                      <StatusBadge status={s.awpb} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.ucStatus}</TableCell>
                    <TableCell className="text-blue-600">{s.nextAction}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Governance Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Governance Alerts
            </CardTitle>
            <CardDescription className="text-xs">Issues requiring director-level attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {governanceAlerts.map((a, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border text-xs ${
                  a.level === "Critical"
                    ? "bg-red-50 border-red-200"
                    : a.level === "High"
                    ? "bg-orange-50 border-orange-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-gray-800 leading-snug">{a.text}</p>
                  <StatusBadge status={a.level} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Section 4 — Convergence + Strategic Initiatives ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Inter-Ministerial Convergence */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" /> Inter-Ministerial Convergence Status
            </CardTitle>
            <CardDescription className="text-xs">
              Cross-ministry programme integration — as of March 2025
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Ministry/Dept</TableHead>
                  <TableHead className="text-xs">Programme</TableHead>
                  <TableHead className="text-xs">Integration Status</TableHead>
                  <TableHead className="text-xs">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {convergence.map((c) => (
                  <TableRow key={c.ministry} className="text-xs">
                    <TableCell className="font-semibold text-gray-800">{c.ministry}</TableCell>
                    <TableCell className="text-muted-foreground">{c.programme}</TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.updated}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Strategic Initiatives Pipeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-teal-600" /> Strategic Initiatives Pipeline
            </CardTitle>
            <CardDescription className="text-xs">
              Key projects under Director&apos;s strategic oversight
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Initiative</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Target Date</TableHead>
                  <TableHead className="text-xs text-center">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initiatives.map((init) => (
                  <TableRow key={init.name} className="text-xs">
                    <TableCell className="font-medium text-gray-800">{init.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={init.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{init.target}</TableCell>
                    <TableCell className="min-w-[100px]">
                      <div className="flex items-center gap-2">
                        <Progress value={init.pct} className="h-1.5 flex-1" />
                        <span className="font-semibold text-gray-700 w-7 text-right">{init.pct}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ── Footer — SDG Summary Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-600 to-green-800 text-white border-0">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-medium text-green-200">SDG 4.1</div>
                <div className="text-2xl font-bold">94.2%</div>
                <div className="text-xs text-green-100">Primary Completion Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-medium text-blue-200">Gender Parity Index</div>
                <div className="text-2xl font-bold">0.97</div>
                <div className="text-xs text-blue-100">Secondary level · Near parity</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600 to-orange-800 text-white border-0">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-medium text-orange-200">Out-of-School Children</div>
                <div className="text-2xl font-bold">
                  1,960 <span className="text-base font-medium">mainstreamed</span>
                </div>
                <div className="text-xs text-orange-100">of 2,840 identified in district</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}

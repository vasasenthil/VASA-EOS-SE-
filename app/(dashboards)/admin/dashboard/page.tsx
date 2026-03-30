import Link from "next/link"
import {
  Users,
  FileText,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  School,
  Target,
  Landmark,
  ShieldCheck,
  Activity,
  BarChart3,
  ArrowRight,
  Clock,
  MapPin,
  Layers,
  Network,
  GraduationCap,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// --- Mock KPI Data (Education Command Centre — Module 70.1) ---
const kpiStats = [
  {
    title: "Net Enrolment Ratio",
    value: "87.4%",
    subtext: "+1.2% vs last year",
    trend: "up",
    icon: GraduationCap,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Teacher Vacancy Rate",
    value: "18.3%",
    subtext: "−3.1% improvement",
    trend: "down-good",
    icon: Users,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    title: "Attendance Rate (Today)",
    value: "82.1%",
    subtext: "Schools reporting: 94.7%",
    trend: "up",
    icon: Activity,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Scheme Fund Utilisation",
    value: "68.5%",
    subtext: "Samagra Shiksha Q3",
    trend: "neutral",
    icon: Landmark,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    title: "Learning Outcome Index",
    value: "54.2",
    subtext: "NAS 2024 composite",
    trend: "up",
    icon: TrendingUp,
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    title: "Schools Online Today",
    value: "11,42,830",
    subtext: "of 15,00,000 total",
    trend: "neutral",
    icon: School,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
]

// --- NEP 2020 Implementation Status ---
const nepImplementation = [
  { thrust: "Foundational Literacy & Numeracy (NIPUN)", progress: 72, status: "In Progress" },
  { thrust: "5+3+3+4 Curricular Restructuring", progress: 45, status: "In Progress" },
  { thrust: "Vocational Education (Grade 6+)", progress: 38, status: "Planning" },
  { thrust: "Teacher Education Reform (4-yr B.Ed.)", progress: 61, status: "In Progress" },
  { thrust: "Assessment Reform (PARAKH)", progress: 55, status: "In Progress" },
  { thrust: "Digital Education (DIKSHA/NDEAR)", progress: 80, status: "Implemented" },
  { thrust: "Multilingual Education (Mother Tongue)", progress: 42, status: "In Progress" },
  { thrust: "Inclusive Education (RPwD integration)", progress: 58, status: "In Progress" },
]

// --- Scheme Fund Flow ---
const schemeData = [
  { scheme: "Samagra Shiksha", released: 34200, utilised: 23600 },
  { scheme: "PM POSHAN", released: 12400, utilised: 11200 },
  { scheme: "PM SHRI Schools", released: 4500, utilised: 2800 },
  { scheme: "NIPUN Bharat", released: 1800, utilised: 1200 },
]

// --- State Performance Overview ---
const statePerformance = [
  { state: "Kerala", ner: 98.2, attendance: 91.4, outcome: 72, status: "High" },
  { state: "Himachal Pradesh", ner: 95.8, attendance: 89.2, outcome: 68, status: "High" },
  { state: "Tamil Nadu", ner: 94.1, attendance: 87.6, outcome: 65, status: "High" },
  { state: "Maharashtra", ner: 89.3, attendance: 83.1, outcome: 58, status: "Medium" },
  { state: "Rajasthan", ner: 82.7, attendance: 76.4, outcome: 48, status: "Medium" },
  { state: "Uttar Pradesh", ner: 78.4, attendance: 71.2, outcome: 41, status: "Low" },
  { state: "Bihar", ner: 74.2, attendance: 68.9, outcome: 37, status: "Low" },
  { state: "Jharkhand", ner: 76.8, attendance: 70.3, outcome: 39, status: "Low" },
]

// --- Critical Alerts ---
const criticalAlerts = [
  { type: "critical", title: "Examination Paper Leak — Rajasthan Board", time: "2 hrs ago", action: "Investigate" },
  { type: "warning", title: "48 schools in Bihar unreachable (flood)", time: "4 hrs ago", action: "View" },
  { type: "warning", title: "Samagra Shiksha UC overdue — 6 states", time: "1 day ago", action: "Follow up" },
  { type: "info", title: "NAS Round 2024 data upload complete — 34 states", time: "2 days ago", action: "Review" },
  { type: "info", title: "PARAKH inter-board comparability report ready", time: "3 days ago", action: "View" },
]

// --- Quick Access Modules ---
const quickModules = [
  { label: "Policies", href: "/policies", icon: FileText, color: "bg-blue-100 text-blue-700" },
  { label: "Schemes", href: "/schemes", icon: Layers, color: "bg-purple-100 text-purple-700" },
  { label: "NEP Tracking", href: "/tracking/dashboard", icon: Target, color: "bg-green-100 text-green-700" },
  { label: "Governance", href: "/governance/organizational-units", icon: Network, color: "bg-orange-100 text-orange-700" },
  { label: "User Mgmt", href: "/admin/governance/users", icon: Users, color: "bg-teal-100 text-teal-700" },
  { label: "Analytics", href: "/tracking/milestones", icon: BarChart3, color: "bg-indigo-100 text-indigo-700" },
  { label: "Challenges", href: "/tracking/challenges", icon: AlertTriangle, color: "bg-red-100 text-red-700" },
  { label: "Stakeholders", href: "/tracking/stakeholders", icon: GraduationCap, color: "bg-yellow-100 text-yellow-700" },
]

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    High: "bg-green-100 text-green-700",
    Medium: "bg-yellow-100 text-yellow-700",
    Low: "bg-red-100 text-red-700",
    "In Progress": "bg-blue-100 text-blue-700",
    Implemented: "bg-green-100 text-green-700",
    Planning: "bg-yellow-100 text-yellow-700",
  }
  return (
    <Badge className={`${map[status] || "bg-gray-100 text-gray-700"} border-0 text-xs font-medium`}>
      {status}
    </Badge>
  )
}

export default function AdminDashboardPage() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="container mx-auto py-6 px-4 md:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Education Command Centre</h1>
          <p className="text-sm text-muted-foreground mt-1">National Overview · VASA-EOS (SE) · {today}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/tracking/dashboard">
              <Target className="h-4 w-4 mr-1" /> NEP Dashboard
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/policies/create">
              <FileText className="h-4 w-4 mr-1" /> New Policy
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiStats.map((stat) => (
          <Card key={stat.title} className="border shadow-sm">
            <CardContent className="pt-4 pb-3 px-4">
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${stat.bg} mb-3`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs font-medium text-gray-700 mt-0.5 leading-tight">{stat.title}</div>
              <div className="flex items-center gap-1 mt-1">
                {stat.trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
                {stat.trend === "down-good" && <TrendingDown className="h-3 w-3 text-green-500" />}
                <span className="text-xs text-muted-foreground">{stat.subtext}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* NEP 2020 Implementation */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">NEP 2020 — Implementation Status</CardTitle>
                <CardDescription className="text-xs">Key thrust areas · National average</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs text-blue-600">
                <Link href="/tracking/dashboard">
                  Full Tracker <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {nepImplementation.map((item) => (
              <div key={item.thrust} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700 truncate max-w-[70%]">{item.thrust}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-900">{item.progress}%</span>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
                <Progress value={item.progress} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Critical Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Alerts &amp; Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalAlerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-2.5 rounded-lg border text-xs ${
                  alert.type === "critical"
                    ? "bg-red-50 border-red-200"
                    : alert.type === "warning"
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 leading-snug">{alert.title}</p>
                  <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" /> {alert.time}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs h-6 px-2 shrink-0">
                  {alert.action}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* State Performance Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">State Performance Overview</CardTitle>
                <CardDescription className="text-xs">NER, Attendance &amp; Learning Outcome · Selected states</CardDescription>
              </div>
              <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                28 States · 8 UTs
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">State</TableHead>
                  <TableHead className="text-xs text-center">NER (%)</TableHead>
                  <TableHead className="text-xs text-center">Attendance (%)</TableHead>
                  <TableHead className="text-xs text-center">Outcome Index</TableHead>
                  <TableHead className="text-xs text-center">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statePerformance.map((s) => (
                  <TableRow key={s.state} className="text-xs">
                    <TableCell className="font-medium">{s.state}</TableCell>
                    <TableCell className="text-center">{s.ner}</TableCell>
                    <TableCell className="text-center">{s.attendance}</TableCell>
                    <TableCell className="text-center">{s.outcome}</TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={s.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Right column: Quick Access + Fund Flow */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quick Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {quickModules.map((mod) => (
                  <Link
                    key={mod.label}
                    href={mod.href}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg border hover:shadow-sm transition-shadow"
                  >
                    <div className={`w-9 h-9 flex items-center justify-center rounded-lg ${mod.color}`}>
                      <mod.icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium text-gray-700 text-center leading-tight">{mod.label}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Scheme Fund Flow</CardTitle>
              <CardDescription className="text-xs">Utilisation vs. release (₹ Crore)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {schemeData.map((s) => (
                <div key={s.scheme} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-gray-700">{s.scheme}</span>
                    <span className="text-muted-foreground">
                      ₹{s.utilised.toLocaleString()} / ₹{s.released.toLocaleString()} Cr
                    </span>
                  </div>
                  <Progress value={Math.round((s.utilised / s.released) * 100)} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SDG 4 & Governance Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-medium text-blue-200">SDG 4 Progress</div>
                <div className="text-2xl font-bold">62%</div>
                <div className="text-xs text-blue-100">Quality Education · India 2030 Target</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-600 to-green-800 text-white border-0">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-medium text-green-200">RTE Compliance</div>
                <div className="text-2xl font-bold">74.8%</div>
                <div className="text-xs text-green-100">Schools meeting all RTE norms</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-600 to-purple-800 text-white border-0">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-medium text-purple-200">Governance Tiers Active</div>
                <div className="text-2xl font-bold">7 / 7</div>
                <div className="text-xs text-purple-100">National → Learner · All tiers live</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

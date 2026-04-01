import Link from "next/link"
import {
  FileText,
  BarChart3,
  Download,
  Clock,
  CheckCircle2,
  Globe,
  Target,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  CalendarDays,
  Users,
  Activity,
  Database,
  Layers,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

// ── Report Categories ─────────────────────────────────────────────────────────
const categories = [
  {
    title: "Consolidated Reports",
    description: "Annual, quarterly, and periodic reports auto-generated from operational data",
    icon: Database,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    reports: [
      "Annual Education Performance Report",
      "Quarterly Scheme Implementation Report",
      "Annual UDISE+ Statistical Report",
      "Board Examination Results Statistical Report",
      "Teacher Workforce Annual Report",
    ],
  },
  {
    title: "Dynamic / Ad Hoc Reports",
    description: "On-demand reports generated via natural language queries or visual builder",
    icon: BarChart3,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    reports: [
      "Ad Hoc Query Reports (any dimension)",
      "Comparative Benchmarking Reports",
      "Longitudinal Cohort Analysis",
      "What-If Scenario Projections",
      "Equity Deep-Dive Reports",
    ],
  },
  {
    title: "Statutory & Compliance Reports",
    description: "Auto-generated reports for regulatory compliance and parliamentary accountability",
    icon: ShieldCheck,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    reports: [
      "RTE Act Compliance Report (quarterly)",
      "RPwD Act Inclusion Status Report",
      "DPDP Act Data Protection Report",
      "SDG 4 Indicator Report (UNESCO format)",
      "Parliamentary Question Response Reports",
    ],
  },
  {
    title: "Real-Time Dashboards",
    description: "Live operational dashboards refreshed continuously from field data",
    icon: Activity,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    reports: [
      "Education Command Centre (National)",
      "State / District / Block Dashboard",
      "School Principal Operational Dashboard",
      "Teacher & Student Dashboards",
      "Parent Portal Live View",
    ],
  },
]

// ── Recently Generated Reports ────────────────────────────────────────────────
const recentReports = [
  { name: "NEP 2020 Q4 Implementation Report",         type: "Consolidated",  by: "System Auto",       date: "Apr 1, 2025",  status: "Ready", format: "PDF",      exportId: "annual-education-performance" },
  { name: "State Equity Scorecard 2024–25",             type: "Consolidated",  by: "Secretary DoSEL",   date: "Mar 28, 2025", status: "Ready", format: "PDF/XLSX", exportId: "quarterly-scheme-implementation" },
  { name: "RTE Compliance Report Q3 2024–25",           type: "Statutory",     by: "Compliance Engine", date: "Mar 25, 2025", status: "Ready", format: "PDF",      exportId: "milestone-progress" },
  { name: "Samagra Shiksha Physical Progress",          type: "Scheme",        by: "PAB Desk",          date: "Mar 22, 2025", status: "Ready", format: "XLSX",     exportId: "quarterly-scheme-implementation" },
  { name: "SDG 4 Indicator Report 2024",                type: "Statutory",     by: "System Auto",       date: "Mar 20, 2025", status: "Ready", format: "PDF",      exportId: "stakeholder-report" },
  { name: "Dropout Risk Analysis — 12 States",          type: "Dynamic",       by: "DEO Analytics",     date: "Mar 18, 2025", status: "Ready", format: "PDF",      exportId: "annual-education-performance" },
  { name: "Teacher Vacancy Heat Map",                   type: "Dynamic",       by: "HR Cell",           date: "Mar 15, 2025", status: "Ready", format: "PDF/XLSX", exportId: "stakeholder-report" },
  { name: "NIPUN Bharat Progress Report",               type: "Consolidated",  by: "NIPUN PMU",         date: "Mar 12, 2025", status: "Ready", format: "PDF",      exportId: "milestone-progress" },
]

// ── Scheduled Auto-Reports ────────────────────────────────────────────────────
const scheduled = [
  { report: "Annual Education Performance Report",   freq: "Yearly",   next: "Apr 30, 2025",    recipients: "Secretary, CABE, Parliament",  status: "Scheduled" },
  { report: "Quarterly Scheme Implementation",        freq: "Quarterly", next: "Apr 15, 2025",    recipients: "PAB Members, State SPDs",      status: "Scheduled" },
  { report: "Monthly UDISE+ Update",                  freq: "Monthly",  next: "May 1, 2025",     recipients: "DEOs, NIEPA",                  status: "Scheduled" },
  { report: "Weekly Attendance Summary",              freq: "Weekly",   next: "Apr 7, 2025",     recipients: "DEOs, Block Officers",         status: "Scheduled" },
  { report: "Daily Alert Digest",                     freq: "Daily",    next: "Tomorrow 8:00 AM", recipients: "Command Centre",              status: "Active" },
]

// ── SDG 4 Indicator Tracker ───────────────────────────────────────────────────
const sdgIndicators = [
  { code: "4.1.1a", desc: "Reading proficiency — end of primary", current: 54.2, target: 100, trend: "up" },
  { code: "4.1.2",  desc: "Completion rate (secondary)",           current: 71.4, target: 100, trend: "up" },
  { code: "4.2.2",  desc: "Pre-primary participation (5 yrs)",     current: 88.6, target: 100, trend: "stable" },
  { code: "4.3.1",  desc: "Youth/adult in formal education (%)",   current: 28.4, target: 40,  trend: "up" },
  { code: "4.5.1a", desc: "Gender Parity Index — primary",         current: 1.00, target: 1.00,trend: "achieved" },
  { code: "4.5.1b", desc: "Gender Parity Index — secondary",       current: 0.97, target: 1.00,trend: "stable" },
  { code: "4.6.1",  desc: "Adult literacy rate (15+ yrs)",         current: 74.4, target: 100, trend: "up" },
  { code: "4.a.1a", desc: "Schools with electricity (%)",          current: 82.3, target: 100, trend: "up" },
  { code: "4.a.1b", desc: "Schools with safe drinking water (%)",  current: 78.6, target: 100, trend: "up" },
  { code: "4.a.1c", desc: "Schools with basic sanitation (%)",     current: 71.4, target: 100, trend: "up" },
  { code: "4.c.1a", desc: "Trained teachers — primary (%)",        current: 87.2, target: 100, trend: "up" },
  { code: "4.c.1b", desc: "Trained teachers — secondary (%)",      current: 91.4, target: 100, trend: "up" },
]

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    Consolidated: "bg-blue-100 text-blue-700",
    Statutory: "bg-green-100 text-green-700",
    Scheme: "bg-purple-100 text-purple-700",
    Dynamic: "bg-orange-100 text-orange-700",
    Active: "bg-green-100 text-green-700",
    Scheduled: "bg-blue-100 text-blue-700",
    Ready: "bg-green-100 text-green-700",
  }
  return <Badge className={`${map[type] ?? "bg-gray-100 text-gray-600"} border-0 text-xs`}>{type}</Badge>
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-green-500 inline" />
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-red-500 inline" />
  if (trend === "achieved") return <CheckCircle2 className="h-3.5 w-3.5 text-green-600 inline" />
  return <Minus className="h-3.5 w-3.5 text-gray-400 inline" />
}

export default async function ReportsPage() {
  return (
    <Shell>
      <PageHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 w-full">
          <div>
            <PageHeaderHeading>Reports &amp; Analytics Centre</PageHeaderHeading>
            <PageHeaderDescription>
              Volume V — VASA-EOS (SE) Blueprint · Consolidated, Dynamic, Statutory &amp; Real-Time Reports
            </PageHeaderDescription>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm"><CalendarDays className="h-4 w-4 mr-1" /> Schedule Report</Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <BarChart3 className="h-4 w-4 mr-1" /> Generate Ad Hoc
            </Button>
          </div>
        </div>
      </PageHeader>

      {/* Report Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {categories.map((cat) => (
          <Card key={cat.title} className={`border ${cat.border}`}>
            <CardHeader className="pb-2">
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${cat.bg} mb-2`}>
                <cat.icon className={`h-5 w-5 ${cat.color}`} />
              </div>
              <CardTitle className="text-sm font-semibold">{cat.title}</CardTitle>
              <CardDescription className="text-xs">{cat.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {cat.reports.map((r) => (
                <div key={r} className="flex items-center gap-1.5 text-xs text-gray-700">
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span>{r}</span>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full mt-2 text-xs">
                <Download className="h-3 w-3 mr-1" /> Generate
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Reports + Scheduled */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" /> Recently Generated Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Report Name</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Generated By</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Date</TableHead>
                  <TableHead className="text-xs text-center">Format</TableHead>
                  <TableHead className="text-xs text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentReports.map((r) => (
                  <TableRow key={r.name} className="text-xs">
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell><TypeBadge type={r.type} /></TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">{r.by}</TableCell>
                    <TableCell className="text-muted-foreground hidden lg:table-cell">{r.date}</TableCell>
                    <TableCell className="text-center text-gray-600">{r.format}</TableCell>
                    <TableCell className="text-center">
                      <a
                        href={`/api/export/reports?reportId=${r.exportId}&format=csv`}
                        download
                        className="inline-flex items-center justify-center h-6 px-2 rounded text-xs text-blue-600 hover:bg-blue-50"
                        title="Download CSV"
                      >
                        <Download className="h-3 w-3" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-purple-600" /> Auto-Scheduled Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {scheduled.map((s) => (
              <div key={s.report} className={`p-2.5 rounded-lg border text-xs ${s.status === "Active" ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-gray-800 leading-snug">{s.report}</span>
                  <TypeBadge type={s.status} />
                </div>
                <div className="flex items-center gap-3 text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.freq}</span>
                  <span className="font-medium text-blue-700">Next: {s.next}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                  <Users className="h-3 w-3" />{s.recipients}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* SDG 4 Tracker */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-teal-600" /> SDG 4 — Quality Education Indicator Tracker
              </CardTitle>
              <CardDescription className="text-xs">
                UN SDG 4 · 12 global indicators · India 2030 targets · Mapped to VASA-EOS operational data
              </CardDescription>
            </div>
            <Badge className="bg-teal-100 text-teal-700 border-0 text-xs">
              <Target className="h-3 w-3 mr-1" /> UNESCO Reporting Format
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Indicator</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="text-xs text-center">Current Value</TableHead>
                <TableHead className="text-xs text-center">2030 Target</TableHead>
                <TableHead className="text-xs text-center">Progress</TableHead>
                <TableHead className="text-xs text-center">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sdgIndicators.map((s) => {
                const rawVal = typeof s.current === "number" && s.current <= 1.1 ? s.current * 100 : s.current
                const pct = s.target === 1.00 ? (s.current / s.target) * 100 : (s.current / s.target) * 100
                return (
                  <TableRow key={s.code} className="text-xs">
                    <TableCell className="font-mono font-semibold text-teal-700">{s.code}</TableCell>
                    <TableCell className="font-medium">{s.desc}</TableCell>
                    <TableCell className="text-center font-bold">
                      {s.target === 1.00 ? s.current.toFixed(2) : `${s.current}%`}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {s.target === 1.00 ? s.target.toFixed(2) : `${s.target}%`}
                    </TableCell>
                    <TableCell className="w-24">
                      <Progress value={Math.min(100, pct)} className="h-1.5" />
                    </TableCell>
                    <TableCell className="text-center">
                      <TrendIcon trend={s.trend} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <div className="mt-3 p-2.5 bg-teal-50 border border-teal-200 rounded text-xs text-teal-800">
            SDG 4.5.1a (Gender Parity Index — primary) has been achieved (GPI = 1.00). India is on track for SDG 4.c.1 (trained teachers). Foundational literacy (4.1.1a) at 54.2% requires accelerated NIPUN Bharat implementation to meet 2030 targets.
          </div>
        </CardContent>
      </Card>

      {/* Navigation to live modules */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        {[
          { label: "NEP Tracking", href: "/tracking/dashboard", icon: Target, color: "bg-green-100 text-green-700" },
          { label: "Milestones", href: "/tracking/milestones", icon: CheckCircle2, color: "bg-blue-100 text-blue-700" },
          { label: "Challenges", href: "/tracking/challenges", icon: Layers, color: "bg-red-100 text-red-700" },
          { label: "Stakeholders", href: "/tracking/stakeholders", icon: Users, color: "bg-purple-100 text-purple-700" },
        ].map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:shadow-sm transition-shadow text-sm font-medium text-gray-700"
          >
            <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${link.color}`}>
              <link.icon className="h-4 w-4" />
            </div>
            {link.label}
            <ArrowRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
          </Link>
        ))}
      </div>
    </Shell>
  )
}

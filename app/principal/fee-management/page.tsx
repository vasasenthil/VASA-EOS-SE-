import {
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  FileText,
  ArrowUpRight,
  BarChart3,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

// ── Mock Data — Module 31.1 Fee Management ────────────────────────────────────

const kpis = [
  { label: "Total Annual Billing", value: "₹1.49 Cr", sub: "1,248 students", icon: IndianRupee, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Collected to Date", value: "₹1.01 Cr", sub: "68.0% collection rate", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
  { label: "Outstanding Balance", value: "₹47.6L", sub: "32.0% pending", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  { label: "RTE Reimbursement Due", value: "₹21.4L", sub: "from State Govt.", icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
]

const feeHeads = [
  { head: "Tuition Fee",        rate: 6000,  billed: 7488000, collected: 5421600, outstanding: 2066400, pct: 72.4 },
  { head: "Development Fee",   rate: 2400,  billed: 2995200, collected: 1857024, outstanding: 1138176, pct: 62.0 },
  { head: "Examination Fee",   rate: 800,   billed: 998400,  collected: 798720,  outstanding: 199680,  pct: 80.0 },
  { head: "Library Fee",       rate: 600,   billed: 748800,  collected: 561600,  outstanding: 187200,  pct: 75.0 },
  { head: "Sports & Activity", rate: 1200,  billed: 1497600, collected: 973440,  outstanding: 524160,  pct: 65.0 },
  { head: "Computer Lab Fee",  rate: 1200,  billed: 1136000, collected: 495536,  outstanding: 640464,  pct: 43.6 },
]

const monthlyTrend = [
  { month: "April 2024",    billed: "₹24.8L", collected: "₹21.2L", pct: 85.5, defaulters: 38 },
  { month: "May 2024",      billed: "₹12.4L", collected: "₹9.8L",  pct: 79.0, defaulters: 62 },
  { month: "June 2024",     billed: "₹12.4L", collected: "₹8.1L",  pct: 65.3, defaulters: 88 },
  { month: "July 2024",     billed: "₹12.4L", collected: "₹7.9L",  pct: 63.7, defaulters: 94 },
  { month: "August 2024",   billed: "₹12.4L", collected: "₹8.4L",  pct: 67.7, defaulters: 87 },
]

const categories = [
  { cat: "SC (100% concession)",    students: 224, fee: 0,      concession: "₹26.9L", netPayable: "₹0",     status: "Govt. Funded" },
  { cat: "ST (100% concession)",    students: 100, fee: 0,      concession: "₹12.0L", netPayable: "₹0",     status: "Govt. Funded" },
  { cat: "EWS/RTE 25%",             students: 213, fee: 0,      concession: "₹25.6L", netPayable: "₹0",     status: "RTE Act" },
  { cat: "OBC (25% concession)",    students: 274, fee: "75%",  concession: "₹8.2L",  netPayable: "₹24.7L", status: "Partial" },
  { cat: "PwD (50% concession)",    students: 14,  fee: "50%",  concession: "₹0.84L", netPayable: "₹0.84L", status: "Partial" },
]

const rteReimbursement = [
  { quarter: "Q1 (Apr–Jun 2024)", amount: "₹4.26L", status: "Submitted", action: "Awaiting release" },
  { quarter: "Q2 (Jul–Sep 2024)", amount: "₹4.26L", status: "Submitted", action: "Awaiting release" },
  { quarter: "Q3 (Oct–Dec 2024)", amount: "₹4.26L", status: "In Preparation", action: "Submit by Apr 10" },
  { quarter: "Q4 (Jan–Mar 2025)", amount: "₹4.26L", status: "Pending", action: "Due Jun 2025" },
  { quarter: "FY 2023–24 (outstanding)", amount: "₹8.52L", status: "Overdue", action: "Escalate to DEO" },
]

const defaulters = [
  { name: "Raju Prasad",   cls: "VI-B",  balance: "₹8,400", overdue: 45, lastReminder: "Apr 1", action: "Teacher Outreach", severity: "High" },
  { name: "Meena Kumari",  cls: "VII-A", balance: "₹12,000", overdue: 60, lastReminder: "Mar 28", action: "Parent Meeting", severity: "High" },
  { name: "Mohammed Arif", cls: "IX-B",  balance: "₹9,200", overdue: 38, lastReminder: "Apr 2", action: "SMS Sent", severity: "Medium" },
  { name: "Fatima Begum",  cls: "IX-C",  balance: "₹10,400", overdue: 52, lastReminder: "Mar 30", action: "3rd Reminder", severity: "High" },
  { name: "Sunita Devi",   cls: "VIII-A",balance: "₹6,000", overdue: 30, lastReminder: "Apr 3", action: "2nd Reminder", severity: "Medium" },
]

const instalments = [
  { name: "Aarav Sharma",  cls: "XI-A", total: "₹14,400", plan: "4 instalments", paid: "₹7,200 (2/4)", next: "₹3,600", due: "May 1" },
  { name: "Priya Gupta",   cls: "X-B",  total: "₹12,000", plan: "3 instalments", paid: "₹8,000 (2/3)", next: "₹4,000", due: "May 1" },
]

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Govt. Funded": "bg-blue-100 text-blue-700",
    "RTE Act": "bg-green-100 text-green-700",
    "Partial": "bg-yellow-100 text-yellow-700",
    "Submitted": "bg-blue-100 text-blue-700",
    "In Preparation": "bg-yellow-100 text-yellow-700",
    "Pending": "bg-gray-100 text-gray-600",
    "Overdue": "bg-red-100 text-red-700",
    "High": "bg-red-100 text-red-700",
    "Medium": "bg-yellow-100 text-yellow-700",
  }
  return <Badge className={`${map[status] ?? "bg-gray-100 text-gray-600"} border-0 text-xs`}>{status}</Badge>
}

function fmt(n: number) {
  return "₹" + (n / 100000).toFixed(2) + "L"
}

export default async function FeeManagementPage() {
  return (
    <Shell>
      <PageHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 w-full">
          <div>
            <PageHeaderHeading>Fee Management</PageHeaderHeading>
            <PageHeaderDescription>
              Module 31.1 · Annual Fee Collection, RTE Reimbursement &amp; Defaulter Management
            </PageHeaderDescription>
          </div>
          <PageHeaderActions>
            <Button variant="outline" size="sm"><FileText className="h-4 w-4 mr-1" /> Generate Report</Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <ArrowUpRight className="h-4 w-4 mr-1" /> Record Payment
            </Button>
          </PageHeaderActions>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${k.bg} mb-2`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
              <div className="text-xs font-medium text-gray-700 mt-0.5">{k.label}</div>
              <div className="text-xs text-muted-foreground">{k.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall progress bar */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Overall Collection Rate — FY 2024-25</CardTitle>
              <CardDescription className="text-xs">Total billed: ₹1,48,64,000 · Collected: ₹1,01,07,920 · Outstanding: ₹47,56,080</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">68.0%</div>
              <div className="text-xs text-muted-foreground">Collection rate</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={68} className="h-3 mb-4" />
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
              <div className="text-xl font-bold text-green-600">₹1.01 Cr</div>
              <div className="text-muted-foreground">Collected</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
              <div className="text-xl font-bold text-red-600">₹47.6L</div>
              <div className="text-muted-foreground">Outstanding</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <div className="text-xl font-bold text-blue-600">213</div>
              <div className="text-muted-foreground">RTE Students (Fee-Free)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Head Summary + Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" /> Collection by Fee Head
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {feeHeads.map((f) => (
              <div key={f.head} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-gray-700">{f.head}</span>
                  <span className="text-muted-foreground">
                    {fmt(f.collected)} / {fmt(f.billed)} —{" "}
                    <span className={f.pct >= 75 ? "text-green-600 font-semibold" : f.pct >= 60 ? "text-yellow-600 font-semibold" : "text-red-600 font-semibold"}>
                      {f.pct}%
                    </span>
                  </span>
                </div>
                <Progress value={f.pct} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" /> Monthly Collection Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Month</TableHead>
                  <TableHead className="text-xs text-center">Billed</TableHead>
                  <TableHead className="text-xs text-center">Collected</TableHead>
                  <TableHead className="text-xs text-center">Rate%</TableHead>
                  <TableHead className="text-xs text-center">Defaulters</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyTrend.map((m) => (
                  <TableRow key={m.month} className="text-xs">
                    <TableCell className="font-medium">{m.month}</TableCell>
                    <TableCell className="text-center">{m.billed}</TableCell>
                    <TableCell className="text-center">{m.collected}</TableCell>
                    <TableCell className={`text-center font-semibold ${m.pct >= 80 ? "text-green-600" : m.pct >= 65 ? "text-yellow-600" : "text-red-600"}`}>
                      {m.pct}%
                    </TableCell>
                    <TableCell className="text-center text-red-600">{m.defaulters}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Category Concessions + RTE Reimbursement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-600" /> Category-wise Concessions
            </CardTitle>
            <CardDescription className="text-xs">Total concessions granted: ₹72.6L</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs text-center">Students</TableHead>
                  <TableHead className="text-xs text-center">Concession</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.cat} className="text-xs">
                    <TableCell className="font-medium">{c.cat}</TableCell>
                    <TableCell className="text-center">{c.students}</TableCell>
                    <TableCell className="text-center text-green-600 font-semibold">{c.concession}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600" /> RTE 25% Reimbursement Tracker
            </CardTitle>
            <CardDescription className="text-xs">213 RTE students · Rate: ₹8,000/student/yr · Total claim: ₹17.04L</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {rteReimbursement.map((r) => (
              <div key={r.quarter} className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border text-xs ${r.status === "Overdue" ? "bg-red-50 border-red-200" : r.status === "Submitted" ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{r.quarter}</p>
                  <p className="text-muted-foreground">{r.action}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-800">{r.amount}</p>
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              FY 2023–24 outstanding of ₹8.52L is overdue. Escalation letter to DEO recommended immediately.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Defaulters + Instalment Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Fee Defaulters — Automated Follow-up
            </CardTitle>
            <CardDescription className="text-xs">
              No student denied education or assessment for fee non-payment (RTE compliance maintained)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">Class</TableHead>
                  <TableHead className="text-xs text-center">Balance</TableHead>
                  <TableHead className="text-xs text-center">Overdue</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {defaulters.map((d) => (
                  <TableRow key={d.name} className="text-xs">
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{d.cls}</TableCell>
                    <TableCell className="text-center font-semibold text-red-600">{d.balance}</TableCell>
                    <TableCell className="text-center">{d.overdue}d</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-gray-700">{d.action}</span>
                        <StatusBadge status={d.severity} />
                      </div>
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
              <CheckCircle2 className="h-4 w-4 text-green-600" /> Active Instalment Plans
            </CardTitle>
            <CardDescription className="text-xs">10 students on structured instalment payment plans</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {instalments.map((ins) => (
              <div key={ins.name} className="p-3 rounded-lg border bg-blue-50 border-blue-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">{ins.name}</span>
                  <span className="text-muted-foreground">{ins.cls} · {ins.plan}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Paid: <strong>{ins.paid}</strong></span>
                  <span className="text-blue-700 font-semibold">Next: {ins.next} due {ins.due}</span>
                </div>
                <Progress value={66} className="h-1.5" />
              </div>
            ))}
            <div className="text-xs text-muted-foreground p-2 bg-gray-50 rounded border">
              8 more students on instalment plans. View full list in fee management portal.
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

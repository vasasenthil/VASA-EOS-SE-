import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Users,
  Accessibility,
  Lock,
  CalendarDays,
  ArrowUpRight,
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

// ── Mock Data — Compliance Module (RTE, RPwD, DPDP) ──────────────────────────

const overallScores = [
  { label: "RTE Act 2009",     score: 81.4, color: "text-green-600",  bg: "bg-green-50",  icon: ShieldCheck },
  { label: "RPwD Act 2016",    score: 68.3, color: "text-yellow-600", bg: "bg-yellow-50", icon: Accessibility },
  { label: "DPDP Act 2023",    score: 71.8, color: "text-blue-600",   bg: "bg-blue-50",   icon: Lock },
  { label: "Board Affiliation",score: 88.6, color: "text-teal-600",   bg: "bg-teal-50",   icon: FileText },
]

const rteChecklist = [
  { provision: "Pupil-Teacher Ratio (Primary 1:30)", norm: "1:30",   status: "1:28",             compliant: "yes" },
  { provision: "Pupil-Teacher Ratio (Upper Primary 1:35)", norm: "1:35", status: "1:31",          compliant: "yes" },
  { provision: "Working Days (Elementary)", norm: "200 days",        status: "198 days",          compliant: "partial" },
  { provision: "Working Instructional Hours", norm: "800 hrs/yr",    status: "776 hrs/yr",        compliant: "partial" },
  { provision: "Teacher Qualification (NCTE norms)", norm: "100%",   status: "92.9% (39/42)",    compliant: "partial" },
  { provision: "Separate Toilets (Girls/Boys)", norm: "Mandatory",   status: "Available",         compliant: "yes" },
  { provision: "Drinking Water",         norm: "Mandatory",          status: "Available",         compliant: "yes" },
  { provision: "Library with Books",     norm: "Mandatory",          status: "Available",         compliant: "yes" },
  { provision: "Playground",            norm: "Mandatory",           status: "Available",         compliant: "yes" },
  { provision: "Ramp / Barrier-free Access", norm: "Mandatory",      status: "Partial (2 bldgs)", compliant: "no" },
  { provision: "SMC Constitution",       norm: "Mandatory",          status: "Constituted (12/15)", compliant: "partial" },
  { provision: "25% RTE Reservation",   norm: "25%",                 status: "213/312 = 68.3%",  compliant: "partial" },
  { provision: "No-detention Policy",   norm: "Implemented",         status: "Implemented",       compliant: "yes" },
  { provision: "Free Textbooks (I–VIII)", norm: "Mandatory",         status: "Fully distributed", compliant: "yes" },
  { provision: "Mid-Day Meal",           norm: "Daily",              status: "Daily delivery",    compliant: "yes" },
]

const rpwdData = [
  { category: "Visual Impairment",        students: 3, iep: "3/3", assistive: "3/3 (spectacles)", educator: "Shared (1 SE)", infra: "Partial" },
  { category: "Hearing Impairment",       students: 2, iep: "2/2", assistive: "2/2 (hearing aids)", educator: "Shared", infra: "Partial" },
  { category: "Locomotor Disability",     students: 4, iep: "4/4", assistive: "2/4 (wheelchairs)", educator: "Shared", infra: "Partial" },
  { category: "Intellectual Disability",  students: 3, iep: "3/3", assistive: "N/A", educator: "Shared", infra: "N/A" },
  { category: "Learning Disability (Dyslexia)", students: 2, iep: "2/2", assistive: "N/A", educator: "Shared", infra: "Assessment accommodation" },
]

const dpdpMetrics = [
  { item: "Parental Consent Obtained",      value: "1,228 / 1,248", pct: 98.4, status: "Good" },
  { item: "Data Minimisation Audit",        value: "Completed (Feb 2025)", pct: 100, status: "Good" },
  { item: "Purpose Limitation Verified",    value: "94.2%", pct: 94, status: "Good" },
  { item: "Storage Limitation Policy",      value: "Implemented", pct: 100, status: "Good" },
  { item: "Data Subject Rights — SLA",      value: "4/4 resolved", pct: 100, status: "Good" },
  { item: "Data Breach Incidents (YTD)",    value: "0 incidents", pct: 100, status: "Good" },
  { item: "Non-compliant Data Fields",      value: "3 flagged", pct: 85, status: "Action Needed" },
]

const upcomingActions = [
  { action: "Barrier-free ramp completion (2 buildings)", deadline: "May 31, 2025", responsible: "Infrastructure Head", status: "In Progress", priority: "High" },
  { action: "Teacher qualification upgrade (3 teachers B.Ed.)", deadline: "Aug 31, 2025", responsible: "Principal", status: "Planning", priority: "High" },
  { action: "Remaining 2 working days completion", deadline: "Jun 30, 2025", responsible: "Principal", status: "Scheduled", priority: "Medium" },
  { action: "SMC annual election (3 vacancies)", deadline: "Apr 30, 2025", responsible: "SMC Secretary", status: "Pending", priority: "Medium" },
  { action: "UDISE+ data validation & submission", deadline: "Apr 10, 2025", responsible: "Data Entry Operator", status: "Overdue", priority: "High" },
  { action: "Consent forms for 20 remaining students", deadline: "Apr 12, 2025", responsible: "Class Teachers", status: "Pending", priority: "Medium" },
]

function ComplianceMark({ compliant }: { compliant: string }) {
  if (compliant === "yes") return <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
  if (compliant === "no") return <XCircle className="h-4 w-4 text-red-500 mx-auto" />
  return <AlertTriangle className="h-4 w-4 text-yellow-500 mx-auto" />
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Good": "bg-green-100 text-green-700",
    "Action Needed": "bg-red-100 text-red-700",
    "In Progress": "bg-blue-100 text-blue-700",
    "Planning": "bg-gray-100 text-gray-600",
    "Scheduled": "bg-teal-100 text-teal-700",
    "Pending": "bg-yellow-100 text-yellow-700",
    "Overdue": "bg-red-100 text-red-700",
    "High": "bg-red-100 text-red-700",
    "Medium": "bg-yellow-100 text-yellow-700",
    "Partial": "bg-yellow-100 text-yellow-700",
    "N/A": "bg-gray-100 text-gray-500",
  }
  return <Badge className={`${map[status] ?? "bg-gray-100 text-gray-600"} border-0 text-xs`}>{status}</Badge>
}

export default async function CompliancePage() {
  const rteYes = rteChecklist.filter(r => r.compliant === "yes").length
  const rteNo = rteChecklist.filter(r => r.compliant === "no").length
  const rtePartial = rteChecklist.filter(r => r.compliant === "partial").length

  return (
    <Shell>
      <PageHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 w-full">
          <div>
            <PageHeaderHeading>Compliance &amp; Regulatory Dashboard</PageHeaderHeading>
            <PageHeaderDescription>
              RTE Act 2009 · RPwD Act 2016 · DPDP Act 2023 · Board Affiliation Norms
            </PageHeaderDescription>
          </div>
          <PageHeaderActions>
            <Button variant="outline" size="sm"><FileText className="h-4 w-4 mr-1" /> Download Report</Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <ArrowUpRight className="h-4 w-4 mr-1" /> Submit to DEO
            </Button>
          </PageHeaderActions>
        </div>
      </PageHeader>

      {/* Overall Score */}
      <Card className="mb-6 border-l-4 border-l-yellow-500">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">Overall Compliance Score</CardTitle>
              <CardDescription className="text-xs">
                Last audit: February 18, 2025 · Next inspection: April 28, 2025
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-600">74.2%</div>
                <Badge className="bg-yellow-100 text-yellow-800 border-0 mt-1">Substantially Compliant</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={74.2} className="h-3 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {overallScores.map((s) => (
              <div key={s.label} className={`rounded-lg p-3 border ${s.bg} text-center`}>
                <s.icon className={`h-5 w-5 ${s.color} mx-auto mb-1`} />
                <div className={`text-xl font-bold ${s.color}`}>{s.score}%</div>
                <div className="text-xs font-medium text-gray-700">{s.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* RTE Checklist */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" /> RTE Act 2009 — Compliance Checklist
              </CardTitle>
              <CardDescription className="text-xs">
                Compliant: {rteYes} ✓ · Partial: {rtePartial} ⚠ · Non-compliant: {rteNo} ✗ — of {rteChecklist.length} provisions
              </CardDescription>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />Yes</span>
              <span className="flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />Partial</span>
              <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-red-500" />No</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Provision</TableHead>
                <TableHead className="text-xs text-center">Norm</TableHead>
                <TableHead className="text-xs">Current Status</TableHead>
                <TableHead className="text-xs text-center">Compliant?</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rteChecklist.map((r) => (
                <TableRow key={r.provision} className={`text-xs ${r.compliant === "no" ? "bg-red-50" : r.compliant === "partial" ? "bg-yellow-50" : ""}`}>
                  <TableCell className="font-medium">{r.provision}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{r.norm}</TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell className="text-center"><ComplianceMark compliant={r.compliant} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* RPwD + DPDP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Accessibility className="h-4 w-4 text-blue-600" /> RPwD Act 2016 — Disability Inclusion
            </CardTitle>
            <CardDescription className="text-xs">
              14 students with disabilities · 1 Special Educator (shared) · IEP coverage: 100%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Disability</TableHead>
                  <TableHead className="text-xs text-center">Students</TableHead>
                  <TableHead className="text-xs text-center">IEP Done</TableHead>
                  <TableHead className="text-xs">Assistive Device</TableHead>
                  <TableHead className="text-xs">Infrastructure</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rpwdData.map((r) => (
                  <TableRow key={r.category} className="text-xs">
                    <TableCell className="font-medium">{r.category}</TableCell>
                    <TableCell className="text-center font-bold">{r.students}</TableCell>
                    <TableCell className="text-center">{r.iep}</TableCell>
                    <TableCell>{r.assistive}</TableCell>
                    <TableCell><StatusBadge status={r.infra} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-3 p-2.5 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              2 of 4 students with locomotor disability require wheelchair ramps. Ramp construction in progress — target completion May 31, 2025.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Lock className="h-4 w-4 text-purple-600" /> DPDP Act 2023 — Data Protection
            </CardTitle>
            <CardDescription className="text-xs">
              Digital Personal Data Protection Act 2023 compliance for student &amp; staff data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dpdpMetrics.map((d) => (
              <div key={d.item} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700">{d.item}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{d.value}</span>
                    <StatusBadge status={d.status} />
                  </div>
                </div>
                <Progress value={d.pct} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Compliance Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-orange-600" /> Upcoming Compliance Actions
          </CardTitle>
          <CardDescription className="text-xs">Track and close all open compliance items before next inspection</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Action Required</TableHead>
                <TableHead className="text-xs">Deadline</TableHead>
                <TableHead className="text-xs">Responsible</TableHead>
                <TableHead className="text-xs text-center">Status</TableHead>
                <TableHead className="text-xs text-center">Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingActions.map((a, i) => (
                <TableRow key={i} className={`text-xs ${a.status === "Overdue" ? "bg-red-50" : ""}`}>
                  <TableCell className="font-medium">{a.action}</TableCell>
                  <TableCell className={a.status === "Overdue" ? "text-red-600 font-semibold" : "text-blue-600 font-medium"}>{a.deadline}</TableCell>
                  <TableCell className="text-muted-foreground">{a.responsible}</TableCell>
                  <TableCell className="text-center"><StatusBadge status={a.status} /></TableCell>
                  <TableCell className="text-center"><StatusBadge status={a.priority} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

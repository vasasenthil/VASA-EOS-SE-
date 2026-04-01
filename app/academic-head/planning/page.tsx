import {
  Calendar, Clock, BookOpen, BarChart3, CheckCircle2, AlertTriangle, Layers,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shell } from "@/components/shell"
import { PageHeader } from "@/components/page-header"

const kpiCards = [
  { label: "Academic Year", value: "2025-26", colour: "text-blue-600" },
  { label: "School Days Planned", value: "220", colour: "text-green-600" },
  { label: "Instructional Hours Target", value: "1,100 hrs", colour: "text-purple-600" },
  { label: "Teaching Days Elapsed", value: "187 / 220", colour: "text-orange-600" },
]

const annualCalendar = [
  { month: "April 2025", workingDays: 26, holidays: 4, events: "New Academic Year, Admission Process, Baseline Assessment", assessments: "Baseline Test" },
  { month: "May 2025", workingDays: 24, holidays: 7, events: "Summer Vacation (15-31 May)", assessments: "—" },
  { month: "June 2025", workingDays: 12, holidays: 18, events: "Summer Vacation ends Jun 14, School Reopens", assessments: "—" },
  { month: "July 2025", workingDays: 26, holidays: 5, events: "FA1 Formative Assessment, Parent-Teacher Meeting", assessments: "FA1 (Jul 21-25)" },
  { month: "August 2025", workingDays: 25, holidays: 6, events: "Independence Day, Science Fair", assessments: "—" },
  { month: "September 2025", workingDays: 26, holidays: 4, events: "FA2, SA1 Prep, National Nutrition Week", assessments: "FA2 (Sep 15-19)" },
  { month: "October 2025", workingDays: 22, holidays: 9, events: "SA1 Examinations, Autumn Break, Annual Health Check", assessments: "SA1 (Oct 6-18)" },
  { month: "November 2025", workingDays: 24, holidays: 6, events: "Children's Day Celebration, NIPUN Assessment Round 2", assessments: "—" },
  { month: "December 2025", workingDays: 23, holidays: 8, events: "FA3, Winter Break (Dec 24-Jan 1)", assessments: "FA3 (Dec 8-12)" },
  { month: "January 2026", workingDays: 25, holidays: 6, events: "Republic Day, FA4 Assessment", assessments: "FA4 (Jan 19-23)" },
  { month: "February 2026", workingDays: 24, holidays: 4, events: "Pre-Board Exams (Class X & XII), Career Fair", assessments: "Pre-Board (Feb 2-13)" },
  { month: "March 2026", workingDays: 26, holidays: 5, events: "SA2 / Annual Exams, Result Day, Farewell", assessments: "SA2 (Mar 2-20)" },
]

const periodAllocation = [
  { subject: "Mathematics", foundational: 5, preparatory: 6, middle: 7, secondary: 8 },
  { subject: "Language 1 (Hindi)", foundational: 7, preparatory: 6, middle: 5, secondary: 5 },
  { subject: "Language 2 (English)", foundational: 6, preparatory: 6, middle: 5, secondary: 5 },
  { subject: "EVS / Science", foundational: 4, preparatory: 5, middle: 6, secondary: 7 },
  { subject: "Social Studies", foundational: 0, preparatory: 4, middle: 5, secondary: 5 },
  { subject: "Art & Craft", foundational: 3, preparatory: 3, middle: 2, secondary: 2 },
  { subject: "Physical Education", foundational: 3, preparatory: 3, middle: 3, secondary: 2 },
  { subject: "Computer Science", foundational: 0, preparatory: 0, middle: 2, secondary: 4 },
]

const instructionalTime = [
  { month: "April", planned: 96, actual: 94, gap: 2 },
  { month: "May", planned: 40, actual: 38, gap: 2 },
  { month: "June", planned: 48, actual: 44, gap: 4 },
  { month: "July", planned: 96, actual: 91, gap: 5 },
  { month: "August", planned: 92, actual: 89, gap: 3 },
  { month: "September", planned: 96, actual: 88, gap: 8 },
  { month: "October", planned: 82, actual: 74, gap: 8 },
  { month: "November", planned: 92, actual: 90, gap: 2 },
  { month: "December", planned: 88, actual: null, gap: null },
  { month: "January", planned: 92, actual: null, gap: null },
  { month: "February", planned: 88, actual: null, gap: null },
  { month: "March", planned: 96, actual: null, gap: null },
]

const upcomingEvents = [
  { date: "2025-12-08", event: "FA3 Formative Assessment — Grade 3 to 10", type: "Assessment", responsible: "All Class Teachers" },
  { date: "2025-12-15", event: "NISHTHA Teacher Training Batch 3", type: "Training", responsible: "Academic Head" },
  { date: "2025-12-22", event: "Annual Cultural Day & Sports Day", type: "Co-curricular", responsible: "Vice-Principal" },
  { date: "2025-12-24", event: "Winter Break Begins (Dec 24 – Jan 1)", type: "Holiday", responsible: "All" },
  { date: "2026-01-15", event: "Annual School Inspection (District Level)", type: "Inspection", responsible: "Principal" },
  { date: "2026-01-19", event: "FA4 Formative Assessment", type: "Assessment", responsible: "All Class Teachers" },
  { date: "2026-02-02", event: "Pre-Board Examinations (Class X & XII) Begins", type: "Examination", responsible: "Exam Controller" },
  { date: "2026-02-20", event: "Parent-Teacher Meeting — Results Discussion", type: "Meeting", responsible: "Class Teachers" },
  { date: "2026-03-02", event: "SA2 / Annual Examinations Begin", type: "Examination", responsible: "Exam Controller" },
  { date: "2026-03-28", event: "Academic Year 2025-26 Closes — Result Compilation", type: "Admin", responsible: "All HODs" },
]

const resourcePlanning = [
  { resource: "NCERT Textbooks (All Grades)", required: 18420, procured: 18420, distributed: 17843, status: "Distributed" },
  { resource: "NCERT Workbooks (Gr 1-8)", required: 9847, procured: 9600, distributed: 9412, status: "Mostly Done" },
  { resource: "Lab Materials (Science Gr 6-10)", required: 1240, procured: 987, distributed: 847, status: "Shortfall" },
  { resource: "Digital Content Licenses (DIKSHA)", required: 18420, procured: 18420, distributed: 18420, status: "Complete" },
  { resource: "Assessment Sheets (FA1-FA4 + SA)", required: 147360, procured: 147360, distributed: 92840, status: "In Progress" },
]

function TypeBadge({ t }: { t: string }) {
  const map: Record<string, string> = {
    Assessment: "bg-orange-100 text-orange-700 border-orange-300",
    Training: "bg-blue-100 text-blue-700 border-blue-300",
    Examination: "bg-red-100 text-red-700 border-red-300",
    "Co-curricular": "bg-green-100 text-green-700 border-green-300",
    Holiday: "bg-gray-100 text-gray-600",
    Inspection: "bg-purple-100 text-purple-700 border-purple-300",
    Meeting: "bg-teal-100 text-teal-700 border-teal-300",
    Admin: "bg-yellow-100 text-yellow-700 border-yellow-300",
  }
  return <Badge className={`${map[t] ?? "bg-gray-100 text-gray-700"} border text-xs`}>{t}</Badge>
}

function ResourceStatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    Distributed: "bg-green-100 text-green-700 border-green-300",
    "Mostly Done": "bg-blue-100 text-blue-700 border-blue-300",
    Shortfall: "bg-red-100 text-red-700 border-red-300",
    Complete: "bg-green-100 text-green-700 border-green-300",
    "In Progress": "bg-yellow-100 text-yellow-700 border-yellow-300",
  }
  return <Badge className={`${map[s] ?? "bg-gray-100 text-gray-700"} border text-xs`}>{s}</Badge>
}

export default function AcademicHeadPlanningPage() {
  return (
    <Shell>
      <PageHeader
        title="Academic Planning & Calendar"
        description="Annual academic calendar, period allocation, instructional time analysis — Module 21.2"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6 text-center">
              <p className={`text-3xl font-bold ${k.colour}`}>{k.value}</p>
              <p className="text-xs text-gray-500 mt-1">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Annual Calendar */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4 text-blue-600" />Annual Academic Calendar 2025-26</CardTitle>
          <CardDescription>Month-by-month schedule — working days, holidays, key events, assessments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-center">Working Days</TableHead>
                <TableHead className="text-center">Holidays</TableHead>
                <TableHead>Key Events</TableHead>
                <TableHead>Assessments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {annualCalendar.map((m) => (
                <TableRow key={m.month}>
                  <TableCell className="font-medium text-sm">{m.month}</TableCell>
                  <TableCell className="text-center text-sm text-green-700 font-medium">{m.workingDays}</TableCell>
                  <TableCell className="text-center text-sm text-gray-500">{m.holidays}</TableCell>
                  <TableCell className="text-sm text-gray-700">{m.events}</TableCell>
                  <TableCell className="text-sm">
                    {m.assessments !== "—" ? (
                      <Badge className="bg-orange-100 text-orange-700 border-orange-300 border text-xs">{m.assessments}</Badge>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Period Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Layers className="h-4 w-4 text-purple-600" />Subject Period Allocation (Periods/Week)</CardTitle>
            <CardDescription>Across four NEP 2020 stages</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-center">Foundational</TableHead>
                  <TableHead className="text-center">Preparatory</TableHead>
                  <TableHead className="text-center">Middle</TableHead>
                  <TableHead className="text-center">Secondary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodAllocation.map((p) => (
                  <TableRow key={p.subject}>
                    <TableCell className="text-sm font-medium">{p.subject}</TableCell>
                    <TableCell className="text-center text-sm">{p.foundational || "—"}</TableCell>
                    <TableCell className="text-center text-sm">{p.preparatory || "—"}</TableCell>
                    <TableCell className="text-center text-sm">{p.middle || "—"}</TableCell>
                    <TableCell className="text-center text-sm font-medium text-blue-700">{p.secondary || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Instructional Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4 text-orange-600" />Instructional Time Analysis (Hours)</CardTitle>
            <CardDescription>Planned vs actual instructional hours by month</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-center">Planned</TableHead>
                  <TableHead className="text-center">Actual</TableHead>
                  <TableHead className="text-center">Gap</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instructionalTime.map((t) => (
                  <TableRow key={t.month}>
                    <TableCell className="text-sm font-medium">{t.month}</TableCell>
                    <TableCell className="text-center text-sm">{t.planned}</TableCell>
                    <TableCell className="text-center text-sm">
                      {t.actual !== null ? (
                        <span className={t.gap! > 5 ? "text-red-600 font-medium" : "text-green-700"}>{t.actual}</span>
                      ) : (
                        <span className="text-gray-400">Upcoming</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {t.gap !== null ? (
                        <span className={t.gap > 5 ? "text-red-600 font-medium" : "text-gray-500"}>-{t.gap}</span>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="h-4 w-4 text-green-600" />Upcoming Academic Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {upcomingEvents.map((e, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-md">
                <div className="bg-blue-50 text-blue-700 text-xs font-bold rounded px-2 py-1 text-center min-w-[44px]">
                  {e.date.split("-")[2]}<br />{new Date(e.date).toLocaleString("default", { month: "short" })}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{e.event}</p>
                  <p className="text-xs text-gray-500">Responsible: {e.responsible}</p>
                </div>
                <TypeBadge t={e.type} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resource Planning */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4 text-teal-600" />Resource Planning Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead className="text-right">Required</TableHead>
                <TableHead className="text-right">Procured</TableHead>
                <TableHead className="text-right">Distributed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resourcePlanning.map((r) => (
                <TableRow key={r.resource}>
                  <TableCell className="text-sm font-medium">{r.resource}</TableCell>
                  <TableCell className="text-right text-sm">{r.required.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-sm text-blue-700">{r.procured.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-sm text-green-700">{r.distributed.toLocaleString()}</TableCell>
                  <TableCell><ResourceStatusBadge s={r.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

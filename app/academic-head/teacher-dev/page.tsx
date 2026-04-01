import {
  GraduationCap, Award, Calendar, TrendingUp, Users, BookOpen, CheckCircle2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shell } from "@/components/shell"
import { PageHeader } from "@/components/page-header"

const kpiCards = [
  { label: "Teachers Enrolled in PD", value: "892", colour: "text-blue-600" },
  { label: "Completed 18hrs+ CPD", value: "543 (60.9%)", colour: "text-green-600" },
  { label: "NISHTHA Certified", value: "678", colour: "text-purple-600" },
  { label: "Avg CPD Hours (This Year)", value: "22.4 hrs", colour: "text-orange-600" },
]

const nishthaModules = [
  { module: "NEP 2020 Orientation & Implementation", enrolled: 892, completed: 812, avgScore: 78.4, certified: 798 },
  { module: "Foundational Literacy & Numeracy (FLN)", enrolled: 420, completed: 367, avgScore: 81.2, certified: 354 },
  { module: "Art Integrated Learning (AIL)", enrolled: 512, completed: 423, avgScore: 74.6, certified: 408 },
  { module: "Activity Based Learning (ABL) — Joyful", enrolled: 634, completed: 548, avgScore: 77.1, certified: 531 },
  { module: "NIPUN Bharat Pedagogy & Assessment", enrolled: 420, completed: 312, avgScore: 79.8, certified: 298 },
  { module: "Inclusive Education & Disability Sensitivity", enrolled: 892, completed: 723, avgScore: 82.3, certified: 711 },
  { module: "Gender Sensitivity & POCSO Awareness", enrolled: 892, completed: 847, avgScore: 88.4, certified: 841 },
  { module: "Digital Teaching Tools & EdTech Integration", enrolled: 756, completed: 512, avgScore: 71.6, certified: 487 },
]

const pdLeaderboard = [
  { rank: 1, name: "Ms. Sunita Sharma", dept: "Mathematics", hours: 68, modules: 8, status: "Certified" },
  { rank: 2, name: "Mr. Rajan Pillai", dept: "Science", hours: 64, modules: 7, status: "Certified" },
  { rank: 3, name: "Ms. Deepa Nair", dept: "English", hours: 61, modules: 8, status: "Certified" },
  { rank: 4, name: "Mr. Arun Mehta", dept: "Mathematics", hours: 58, modules: 7, status: "Certified" },
  { rank: 5, name: "Ms. Priya Sharma", dept: "Mathematics", hours: 54, modules: 6, status: "Certified" },
  { rank: 6, name: "Mr. Suresh Yadav", dept: "Social Studies", hours: 51, modules: 6, status: "In Progress" },
  { rank: 7, name: "Ms. Anita Singh", dept: "Hindi", hours: 48, modules: 6, status: "In Progress" },
  { rank: 8, name: "Mr. Vikram Das", dept: "Science", hours: 44, modules: 5, status: "In Progress" },
  { rank: 9, name: "Ms. Kavya Reddy", dept: "Computer Science", hours: 42, modules: 5, status: "In Progress" },
  { rank: 10, name: "Mr. Prasad Kumar", dept: "Art & Craft", hours: 38, modules: 4, status: "Enrolled" },
]

const trainingCalendar = [
  { date: "2025-12-08", event: "NISHTHA 4.0 — Digital Teaching Tools (Batch 3)", venue: "DIET Delhi", facilitator: "NCERT Master Trainer", capacity: 80, registered: 74 },
  { date: "2025-12-15", event: "AI in Education — Awareness Workshop", venue: "SCERT Auditorium", facilitator: "IIT Delhi EdTech Team", capacity: 120, registered: 98 },
  { date: "2026-01-10", event: "NIPUN Bharat FLN Pedagogy Refresher", venue: "District Training Centre", facilitator: "Pratham Resource Person", capacity: 60, registered: 52 },
  { date: "2026-01-22", event: "PARAKH Assessment Calibration (All Assessment Leads)", venue: "NIC VC", facilitator: "PARAKH Board Expert", capacity: 40, registered: 38 },
  { date: "2026-02-05", event: "Special Education Needs (SEN) Certification Module 2", venue: "RCI Delhi", facilitator: "RCI-Accredited Expert", capacity: 30, registered: 24 },
  { date: "2026-02-18", event: "Annual Teacher Convention — Best Practice Sharing", venue: "Indira Gandhi National Centre", facilitator: "MHRD & State Govt", capacity: 500, registered: 423 },
]

const pdGapAnalysis = [
  { subject: "Mathematics", required: 50, completed: 38, gap: 12 },
  { subject: "Science", required: 50, completed: 41, gap: 9 },
  { subject: "English", required: 40, completed: 37, gap: 3 },
  { subject: "Social Studies", required: 40, completed: 29, gap: 11 },
  { subject: "Hindi", required: 40, completed: 32, gap: 8 },
  { subject: "Computer Science", required: 60, completed: 44, gap: 16 },
  { subject: "Special Education", required: 80, completed: 38, gap: 42 },
  { subject: "Physical Education", required: 30, completed: 26, gap: 4 },
]

const awards = [
  { teacher: "Ms. Sunita Sharma", school: "GGSSS Connaught Place", award: "State Best Teacher Award 2025", date: "2025-09-05" },
  { teacher: "Mr. Rajan Pillai", school: "RPVV Dwarka", award: "National Innovation in Teaching Award", date: "2025-08-15" },
  { teacher: "Ms. Deepa Nair", school: "SV Lajpat Nagar", award: "NISHTHA Master Trainer Recognition", date: "2025-10-12" },
  { teacher: "Mr. Arun Mehta", school: "GBSSS Rohini", award: "District Level Best Mathematics Teacher", date: "2025-11-01" },
  { teacher: "Ms. Priya Sharma", school: "GGSSS Mayur Vihar", award: "Digital Champion Educator Award", date: "2025-11-10" },
]

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    Certified: "bg-green-100 text-green-700 border-green-300",
    "In Progress": "bg-blue-100 text-blue-700 border-blue-300",
    Enrolled: "bg-yellow-100 text-yellow-700 border-yellow-300",
  }
  return <Badge className={`${map[s] ?? "bg-gray-100 text-gray-700"} border text-xs`}>{s}</Badge>
}

export default function AcademicHeadTeacherDevPage() {
  return (
    <Shell>
      <PageHeader
        title="Teacher Professional Development"
        description="NISHTHA modules, CPD tracking, training calendar and gap analysis — Module 13.4"
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

      {/* NISHTHA Modules */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-blue-600" />NISHTHA Module Completion Status</CardTitle>
          <CardDescription>National Initiative for School Heads and Teachers' Holistic Advancement</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead className="text-center">Enrolled</TableHead>
                <TableHead className="text-center">Completed</TableHead>
                <TableHead className="text-center">Avg Score</TableHead>
                <TableHead className="text-center">Certified</TableHead>
                <TableHead>Completion %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nishthaModules.map((m) => {
                const pct = Math.round((m.completed / m.enrolled) * 100)
                return (
                  <TableRow key={m.module}>
                    <TableCell className="text-sm font-medium">{m.module}</TableCell>
                    <TableCell className="text-center text-sm">{m.enrolled}</TableCell>
                    <TableCell className="text-center text-sm text-green-700">{m.completed}</TableCell>
                    <TableCell className="text-center text-sm">{m.avgScore}%</TableCell>
                    <TableCell className="text-center text-sm text-purple-700">{m.certified}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-1.5 w-16" />
                        <span className="text-xs">{pct}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-green-600" />CPD Leaderboard — Top 10 Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead className="text-center">Hours</TableHead>
                  <TableHead className="text-center">Modules</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pdLeaderboard.map((t) => (
                  <TableRow key={t.rank}>
                    <TableCell className="text-sm font-bold text-gray-400">{t.rank}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.dept}</p>
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium text-blue-700">{t.hours}</TableCell>
                    <TableCell className="text-center text-sm">{t.modules}</TableCell>
                    <TableCell><StatusBadge s={t.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* PD Gap Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-orange-600" />Subject-wise PD Gap Analysis</CardTitle>
            <CardDescription>Required vs completed CPD hours per subject department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pdGapAnalysis.map((p) => {
                const pct = Math.round((p.completed / p.required) * 100)
                return (
                  <div key={p.subject}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="font-medium text-gray-700">{p.subject}</span>
                      <span className={p.gap > 15 ? "text-red-600 font-medium" : p.gap > 8 ? "text-yellow-600 font-medium" : "text-green-600 font-medium"}>
                        {p.completed}/{p.required} hrs (gap: {p.gap}h)
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Calendar */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4 text-purple-600" />Upcoming Training Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Programme</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Facilitator</TableHead>
                <TableHead className="text-center">Capacity</TableHead>
                <TableHead className="text-center">Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainingCalendar.map((t) => (
                <TableRow key={t.date}>
                  <TableCell className="text-sm text-gray-600">{t.date}</TableCell>
                  <TableCell className="text-sm font-medium">{t.event}</TableCell>
                  <TableCell className="text-sm text-gray-600">{t.venue}</TableCell>
                  <TableCell className="text-sm text-gray-600">{t.facilitator}</TableCell>
                  <TableCell className="text-center text-sm">{t.capacity}</TableCell>
                  <TableCell className="text-center">
                    <span className={t.registered >= t.capacity * 0.9 ? "text-orange-600 font-medium text-sm" : "text-green-700 text-sm"}>{t.registered}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Awards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Award className="h-4 w-4 text-yellow-600" />Teacher Recognitions & Awards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {awards.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <Award className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{a.teacher} <span className="text-gray-500 font-normal">— {a.school}</span></p>
                  <p className="text-xs text-yellow-700">{a.award}</p>
                  <p className="text-xs text-gray-400">{a.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Shell>
  )
}

import {
  BookOpen, CheckCircle2, RefreshCw, Library, TrendingUp, Calendar, FileText,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shell } from "@/components/shell"
import { PageHeader } from "@/components/page-header"

const kpiCards = [
  { label: "Subjects Under Review", value: "12", colour: "text-blue-600" },
  { label: "NCF 2023 Alignment", value: "77.4%", colour: "text-green-600" },
  { label: "Textbooks Updated", value: "68%", colour: "text-purple-600" },
  { label: "Supplementary Resources", value: "1,847", colour: "text-orange-600" },
]

const stageProgress = [
  { stage: "Foundational (Grades 1-2)", ncfStage: "Foundational Stage", subjects: 6, ncfAlignment: 89, status: "On Track" },
  { stage: "Preparatory (Grades 3-5)", ncfStage: "Preparatory Stage", subjects: 8, ncfAlignment: 84, status: "On Track" },
  { stage: "Middle (Grades 6-8)", ncfStage: "Middle Stage", subjects: 10, ncfAlignment: 76, status: "In Progress" },
  { stage: "Secondary (Grades 9-12)", ncfStage: "Secondary Stage", subjects: 14, ncfAlignment: 68, status: "In Progress" },
]

const subjectNCF = [
  { subject: "Mathematics", domains: "Number Sense, Algebra, Geometry, Statistics", alignment: 82, resources: 324 },
  { subject: "Science (Physics, Chem, Bio)", domains: "Scientific Inquiry, Life Sciences, Physical World", alignment: 79, resources: 487 },
  { subject: "Social Studies", domains: "History, Geography, Civics, Economics", alignment: 74, resources: 298 },
  { subject: "English (Language)", domains: "Listening, Speaking, Reading, Writing", alignment: 88, resources: 213 },
  { subject: "Hindi (Language)", domains: "भाषा, साहित्य, व्याकरण, रचना", alignment: 85, resources: 187 },
  { subject: "Computer Science", domains: "Computational Thinking, Digital Literacy, Coding", alignment: 71, resources: 143 },
  { subject: "Art & Craft", domains: "Visual Arts, Performing Arts, Crafts", alignment: 66, resources: 98 },
  { subject: "Physical Education", domains: "Sports, Yoga, Health & Wellness", alignment: 72, resources: 97 },
]

const textbookStatus = [
  { subject: "Mathematics (All Grades)", edition: "NCERT 2024-25", updated: "2024", status: "Current" },
  { subject: "Science (Grades 6-10)", edition: "NCERT 2024-25", updated: "2024", status: "Current" },
  { subject: "Social Studies (Grades 6-10)", edition: "NCERT 2024-25", updated: "2024", status: "Current" },
  { subject: "English Literature (Gr 9-12)", edition: "NCERT 2024-25", updated: "2024", status: "Current" },
  { subject: "Hindi (Grades 1-8)", edition: "SCERT 2023", updated: "2023", status: "Current" },
  { subject: "EVS (Grades 1-5)", edition: "NCERT 2022", updated: "2022", status: "Under Revision" },
  { subject: "History (Grade 11-12)", edition: "NCERT 2021", updated: "2021", status: "Under Revision" },
  { subject: "Computer Science (Gr 9-12)", edition: "CBSE 2023-24", updated: "2023", status: "Current" },
  { subject: "Art & Craft (Gr 1-8)", edition: "SCERT 2019", updated: "2019", status: "Outdated" },
  { subject: "Physical Education (Gr 9-12)", edition: "CBSE 2022-23", updated: "2022", status: "Under Revision" },
]

const competencyBars = [
  { area: "Cognitive Development", alignment: 82 },
  { area: "Affective & Socio-emotional", alignment: 71 },
  { area: "Psychomotor & Physical", alignment: 68 },
  { area: "Language & Communication", alignment: 86 },
  { area: "Numeracy & Mathematical Thinking", alignment: 79 },
  { area: "Scientific Inquiry & Critical Thinking", alignment: 74 },
  { area: "Values, Ethics & Constitutional Awareness", alignment: 65 },
]

const upcomingReviews = [
  { date: "2025-12-10", event: "NCF 2023 Curriculum Alignment Workshop — Secondary Stage", lead: "Dr. K. Subramaniam" },
  { date: "2025-12-18", event: "Textbook Review Committee Meeting — EVS & Art", lead: "SCERT Academic Council" },
  { date: "2026-01-08", event: "Competency Framework Calibration — All Subject Heads", lead: "Dr. K. Subramaniam" },
  { date: "2026-01-20", event: "PARAKH Assessment-Curriculum Alignment Review", lead: "NTA/PARAKH Board" },
  { date: "2026-02-05", event: "Annual Curriculum Review Submission to SCERT", lead: "Academic Head" },
]

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    "On Track": "bg-green-100 text-green-700 border-green-300",
    "In Progress": "bg-blue-100 text-blue-700 border-blue-300",
    Current: "bg-green-100 text-green-700 border-green-300",
    "Under Revision": "bg-yellow-100 text-yellow-700 border-yellow-300",
    Outdated: "bg-red-100 text-red-700 border-red-300",
  }
  return <Badge className={`${map[s] ?? "bg-gray-100 text-gray-700"} border text-xs`}>{s}</Badge>
}

export default function AcademicHeadCurriculumPage() {
  return (
    <Shell>
      <PageHeader
        title="Curriculum Development"
        description="NCF 2023 alignment, textbook status and competency framework — Module 21.1"
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

      {/* Stage-wise Progress */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-blue-600" />Stage-wise NCF 2023 Curriculum Progress</CardTitle>
          <CardDescription>5+3+3+4 structure — four developmental stages per NEP 2020</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stage</TableHead>
                <TableHead>NCF Stage Name</TableHead>
                <TableHead className="text-center">Subjects</TableHead>
                <TableHead>NCF Alignment</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stageProgress.map((s) => (
                <TableRow key={s.stage}>
                  <TableCell className="font-medium text-sm">{s.stage}</TableCell>
                  <TableCell className="text-sm text-gray-600">{s.ncfStage}</TableCell>
                  <TableCell className="text-center text-sm">{s.subjects}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={s.ncfAlignment} className="h-1.5 w-20" />
                      <span className="text-xs font-medium">{s.ncfAlignment}%</span>
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge s={s.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Subject-wise NCF Mapping */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-purple-600" />Subject-wise NCF 2023 Alignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subjectNCF.map((s) => (
                <div key={s.subject}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="font-medium text-gray-700">{s.subject}</span>
                    <span className={s.alignment >= 80 ? "text-green-600" : s.alignment >= 70 ? "text-yellow-600" : "text-red-600"}>
                      {s.alignment}% · {s.resources} resources
                    </span>
                  </div>
                  <Progress value={s.alignment} className="h-1.5" />
                  <p className="text-xs text-gray-400 mt-0.5">{s.domains}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Competency Alignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-green-600" />NCF 2023 Competency Domain Alignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              {competencyBars.map((c) => (
                <div key={c.area}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-700">{c.area}</span>
                    <span className={c.alignment >= 80 ? "text-green-600 font-medium" : c.alignment >= 70 ? "text-yellow-600 font-medium" : "text-red-600 font-medium"}>
                      {c.alignment}%
                    </span>
                  </div>
                  <Progress value={c.alignment} className="h-2" />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">Target: 100% alignment by March 2026 (NCF 2023 full adoption deadline)</p>
          </CardContent>
        </Card>
      </div>

      {/* Textbook Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Library className="h-4 w-4 text-orange-600" />Textbook Revision Status</CardTitle>
          <CardDescription>Currency of prescribed textbooks across subjects and stages</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Current Edition</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {textbookStatus.map((t) => (
                <TableRow key={t.subject}>
                  <TableCell className="font-medium text-sm">{t.subject}</TableCell>
                  <TableCell className="text-sm text-gray-600">{t.edition}</TableCell>
                  <TableCell className="text-sm text-gray-600">{t.updated}</TableCell>
                  <TableCell><StatusBadge s={t.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upcoming Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4 text-teal-600" />Upcoming Curriculum Review Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {upcomingReviews.map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-md">
                <div className="bg-teal-100 text-teal-700 text-xs font-bold rounded px-2 py-1 text-center min-w-[48px]">
                  {r.date.split("-")[2]}<br />{new Date(r.date).toLocaleString("default", { month: "short" })}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.event}</p>
                  <p className="text-xs text-gray-500">Lead: {r.lead}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Shell>
  )
}

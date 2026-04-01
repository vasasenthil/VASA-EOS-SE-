import {
  Award, TrendingUp, BarChart3, Star, BookOpen, Users,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shell } from "@/components/shell"
import { PageHeader } from "@/components/page-header"

const kpiCards = [
  { label: "Overall Grade", value: "A (87.2%)", colour: "text-green-600" },
  { label: "Class Rank", value: "4th / 42", colour: "text-blue-600" },
  { label: "Best Subject", value: "Physics 94.2%", colour: "text-purple-600" },
  { label: "Improvement vs Last Term", value: "+3.4%", colour: "text-teal-600" },
]

const subjectGrades = [
  { subject: "Mathematics", fa1: 82, fa2: 85, sa1: 84, projSa2: 88, bestFA: 85, total: 84.7, grade: "A", remarks: "Consistent improvement. Strong in algebra & geometry." },
  { subject: "Physics", fa1: 92, fa2: 94, sa1: 95, projSa2: 96, bestFA: 94, total: 94.2, grade: "A1", remarks: "Outstanding. Top performer in class." },
  { subject: "Chemistry", fa1: 84, fa2: 86, sa1: 88, projSa2: 90, bestFA: 86, total: 87.2, grade: "A", remarks: "Good understanding of reactions. Keep up." },
  { subject: "Biology", fa1: 88, fa2: 90, sa1: 89, projSa2: 91, bestFA: 90, total: 89.4, grade: "A", remarks: "Excellent diagrams. Strong on genetics." },
  { subject: "Social Studies", fa1: 78, fa2: 80, sa1: 82, projSa2: 84, bestFA: 80, total: 80.8, grade: "A", remarks: "Good. Improve answer structure in map questions." },
  { subject: "English", fa1: 86, fa2: 88, sa1: 87, projSa2: 90, bestFA: 88, total: 87.6, grade: "A", remarks: "Strong grammar. Creative writing needs more practice." },
  { subject: "Hindi", fa1: 80, fa2: 82, sa1: 84, projSa2: 86, bestFA: 82, total: 82.4, grade: "A", remarks: "Good comprehension. Literature analysis improving." },
  { subject: "Computer Science", fa1: 91, fa2: 93, sa1: 94, projSa2: 95, bestFA: 93, total: 93.1, grade: "A1", remarks: "Exceptional coding skills. Future potential in tech." },
]

const assessmentBreakdown = [
  { type: "Formative Assessment (FA1+FA2 Best)", weight: 40, avg: 87.6 },
  { type: "Summative Assessment (SA1)", weight: 40, avg: 87.9 },
  { type: "Portfolio & Projects", weight: 10, avg: 84.0 },
  { type: "Co-curricular & Activities", weight: 10, avg: 88.0 },
]

const ncfCompetencies = [
  { area: "Critical Thinking", teacherRating: 4.2, selfRating: 4.0 },
  { area: "Communication Skills", teacherRating: 4.4, selfRating: 4.2 },
  { area: "Creativity & Imagination", teacherRating: 3.8, selfRating: 4.1 },
  { area: "Collaboration & Teamwork", teacherRating: 4.5, selfRating: 4.3 },
  { area: "Digital Literacy", teacherRating: 4.7, selfRating: 4.6 },
  { area: "Values & Ethics", teacherRating: 4.8, selfRating: 4.5 },
  { area: "Physical Wellness & Sports", teacherRating: 3.6, selfRating: 3.8 },
]

const gradeTrend = [
  { term: "Term 1 (Gr IX)", overall: 81.4, rank: 7 },
  { term: "Term 2 (Gr IX)", overall: 83.2, rank: 6 },
  { term: "Term 3 (Gr IX)", overall: 83.8, rank: 5 },
  { term: "Term 4 (Gr IX)", overall: 84.6, rank: 5 },
  { term: "Term 1 (Gr X)", overall: 86.3, rank: 4 },
  { term: "Term 2 (Gr X — Current)", overall: 87.2, rank: 4 },
]

const cocurricular = [
  { activity: "Science Olympiad", level: "National", award: "Gold Medal", date: "2025-10" },
  { activity: "Mathematics Quiz Competition", level: "District", award: "1st Place", date: "2025-09" },
  { activity: "School Debate — Technology & Society", level: "School", award: "Best Speaker", date: "2025-08" },
  { activity: "Annual Sports Day — 400m Run", level: "School", award: "Bronze Medal", date: "2025-08" },
  { activity: "CBSE Science Exhibition", level: "Regional", award: "Merit Certificate", date: "2025-11" },
]

function GradeBadge({ g }: { g: string }) {
  const map: Record<string, string> = {
    A1: "bg-green-600 text-white",
    A: "bg-green-100 text-green-700 border-green-300",
    B1: "bg-blue-100 text-blue-700 border-blue-300",
    B2: "bg-yellow-100 text-yellow-700 border-yellow-300",
  }
  return <Badge className={`${map[g] ?? "bg-gray-100 text-gray-700"} border text-xs`}>{g}</Badge>
}

export default function StudentGradesPage() {
  return (
    <Shell>
      <PageHeader
        title="My Grades & Results"
        description="Ananya Mishra — Class X-B | Academic Year 2025-26 · Holistic Progress Card"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6 text-center">
              <p className={`text-2xl font-bold ${k.colour}`}>{k.value}</p>
              <p className="text-xs text-gray-500 mt-1">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subject Grade Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-blue-600" />Subject-wise Grade Card — 2025-26</CardTitle>
          <CardDescription>FA1, FA2, SA1 scores and projected SA2 results (March 2026)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">FA1</TableHead>
                <TableHead className="text-center">FA2</TableHead>
                <TableHead className="text-center">SA1</TableHead>
                <TableHead className="text-center">Proj. SA2</TableHead>
                <TableHead className="text-center">Best FA</TableHead>
                <TableHead className="text-center">Overall %</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjectGrades.map((s) => (
                <TableRow key={s.subject}>
                  <TableCell className="font-medium text-sm">{s.subject}</TableCell>
                  <TableCell className="text-center text-sm">{s.fa1}</TableCell>
                  <TableCell className="text-center text-sm">{s.fa2}</TableCell>
                  <TableCell className="text-center text-sm">{s.sa1}</TableCell>
                  <TableCell className="text-center text-sm text-blue-700 font-medium">{s.projSa2}</TableCell>
                  <TableCell className="text-center text-sm">{s.bestFA}</TableCell>
                  <TableCell className="text-center text-sm font-bold text-green-700">{s.total}%</TableCell>
                  <TableCell><GradeBadge g={s.grade} /></TableCell>
                  <TableCell className="text-xs text-gray-600">{s.remarks}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Assessment Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4 text-purple-600" />Assessment Type Breakdown</CardTitle>
            <CardDescription>Contribution to final grade per PARAKH framework</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assessmentBreakdown.map((a) => (
                <div key={a.type}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="font-medium text-gray-700">{a.type}</span>
                    <span className="text-gray-500">{a.weight}% weight · Avg: <span className="text-green-700 font-medium">{a.avg}%</span></span>
                  </div>
                  <Progress value={a.avg} className="h-2" />
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-center">
              <p className="text-sm font-bold text-green-700">Weighted Overall: 87.2%</p>
              <p className="text-xs text-gray-500">CBSE Grade: A | Class Rank: 4/42</p>
            </div>
          </CardContent>
        </Card>

        {/* Grade Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-teal-600" />Grade Trend — 6 Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Term</TableHead>
                  <TableHead className="text-center">Overall %</TableHead>
                  <TableHead className="text-center">Class Rank</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gradeTrend.map((t) => (
                  <TableRow key={t.term}>
                    <TableCell className="text-sm">{t.term}</TableCell>
                    <TableCell className="text-center text-sm font-medium text-green-700">{t.overall}%</TableCell>
                    <TableCell className="text-center text-sm">{t.rank}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-green-700 mt-3 text-center font-medium">+5.8% improvement over 6 terms. Consistently rising.</p>
          </CardContent>
        </Card>
      </div>

      {/* NCF 2023 Competency Report */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Star className="h-4 w-4 text-yellow-600" />NCF 2023 Competency Profile</CardTitle>
          <CardDescription>Holistic development assessment — teacher rating vs self-assessment (out of 5)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competency Area</TableHead>
                <TableHead className="text-center">Teacher Rating (/5)</TableHead>
                <TableHead className="text-center">Self Rating (/5)</TableHead>
                <TableHead>Teacher Assessment</TableHead>
                <TableHead>Self Assessment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ncfCompetencies.map((c) => (
                <TableRow key={c.area}>
                  <TableCell className="font-medium text-sm">{c.area}</TableCell>
                  <TableCell className="text-center text-sm font-medium text-blue-700">{c.teacherRating}</TableCell>
                  <TableCell className="text-center text-sm text-gray-600">{c.selfRating}</TableCell>
                  <TableCell>
                    <Progress value={c.teacherRating * 20} className="h-1.5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Progress value={c.selfRating * 20} className="h-1.5 w-20" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Co-curricular */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Award className="h-4 w-4 text-orange-600" />Co-curricular Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cocurricular.map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-md bg-orange-50">
                <Award className="h-4 w-4 text-orange-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{c.activity}</p>
                  <p className="text-xs text-gray-500">{c.level} Level · {c.date}</p>
                </div>
                <Badge className="bg-orange-100 text-orange-700 border-orange-300 border text-xs">{c.award}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Shell>
  )
}

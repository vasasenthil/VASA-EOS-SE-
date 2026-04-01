import {
  ClipboardList, BarChart3, CheckCircle2, AlertTriangle, BookOpen, TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shell } from "@/components/shell"
import { PageHeader } from "@/components/page-header"

const kpiCards = [
  { label: "Assessment Compliance", value: "82.3%", colour: "text-green-600" },
  { label: "PARAKH Alignment", value: "71.2%", colour: "text-blue-600" },
  { label: "NIPUN Bharat Coverage", value: "94.8%", colour: "text-purple-600" },
  { label: "ePortfolio Completion", value: "58.4%", colour: "text-orange-600" },
]

const assessmentCalendar = [
  { grade: "Grade 3", fa1: 98, fa2: 96, sa1: 94, sa2: null },
  { grade: "Grade 4", fa1: 97, fa2: 95, sa1: 93, sa2: null },
  { grade: "Grade 5", fa1: 96, fa2: 94, sa1: 91, sa2: null },
  { grade: "Grade 6", fa1: 95, fa2: 92, sa1: 89, sa2: null },
  { grade: "Grade 7", fa1: 94, fa2: 91, sa1: 88, sa2: null },
  { grade: "Grade 8", fa1: 93, fa2: 90, sa1: 87, sa2: null },
  { grade: "Grade 9", fa1: 91, fa2: 88, sa1: 84, sa2: null },
  { grade: "Grade 10", fa1: 92, fa2: 89, sa1: 85, sa2: null },
]

const parakhDimensions = [
  { dimension: "Formative Assessment (FA)", alignment: 84, description: "Continuous classroom assessment — FA1 & FA2 per term" },
  { dimension: "Summative Assessment (SA)", alignment: 91, description: "End-of-term written examinations" },
  { dimension: "Competency-Based Assessment", alignment: 68, description: "NCF 2023 competency mapping to question items" },
  { dimension: "Portfolio Assessment", alignment: 58, description: "Student ePortfolio — projects, artwork, field notes" },
  { dimension: "Holistic Progress Card", alignment: 72, description: "360° student report including co-curricular & values" },
]

const boardExamReadiness = [
  { subject: "Mathematics", class10MockAvg: 64.2, class10Predicted: "Pass 91%", class12MockAvg: 68.4, class12Predicted: "Pass 94%", coachingNeeded: "Yes — 47 students" },
  { subject: "Science", class10MockAvg: 69.1, class10Predicted: "Pass 93%", class12MockAvg: 72.3, class12Predicted: "Pass 96%", coachingNeeded: "No" },
  { subject: "English", class10MockAvg: 71.8, class10Predicted: "Pass 96%", class12MockAvg: 74.2, class12Predicted: "Pass 97%", coachingNeeded: "No" },
  { subject: "Social Studies", class10MockAvg: 66.4, class10Predicted: "Pass 89%", class12MockAvg: 70.1, class12Predicted: "Pass 93%", coachingNeeded: "Yes — 28 students" },
  { subject: "Hindi", class10MockAvg: 73.2, class10Predicted: "Pass 97%", class12MockAvg: 76.4, class12Predicted: "Pass 98%", coachingNeeded: "No" },
  { subject: "Computer Science", class10MockAvg: 78.4, class10Predicted: "Pass 98%", class12MockAvg: 81.2, class12Predicted: "Pass 99%", coachingNeeded: "No" },
]

const nipunData = [
  { grade: "Grade 3", readingProficiency: 72, numeracyProficiency: 68, stateAvgReading: 65, stateAvgNumeracy: 61, status: "Above State Avg" },
  { grade: "Grade 4", readingProficiency: 78, numeracyProficiency: 74, stateAvgReading: 68, stateAvgNumeracy: 64, status: "Above State Avg" },
  { grade: "Grade 5", readingProficiency: 84, numeracyProficiency: 81, stateAvgReading: 73, stateAvgNumeracy: 69, status: "Above State Avg" },
]

const questionBankHealth = [
  { subject: "Mathematics", items: 1842, updated: "2025-10", easy: 30, medium: 45, hard: 25 },
  { subject: "Science", items: 2134, updated: "2025-10", easy: 32, medium: 43, hard: 25 },
  { subject: "English", items: 1456, updated: "2025-09", easy: 35, medium: 42, hard: 23 },
  { subject: "Social Studies", items: 1678, updated: "2025-09", easy: 33, medium: 44, hard: 23 },
  { subject: "Hindi", items: 987, updated: "2025-08", easy: 38, medium: 42, hard: 20 },
  { subject: "Computer Science", items: 743, updated: "2025-10", easy: 28, medium: 46, hard: 26 },
  { subject: "Physics", items: 892, updated: "2025-10", easy: 25, medium: 45, hard: 30 },
  { subject: "Chemistry", items: 834, updated: "2025-10", easy: 27, medium: 44, hard: 29 },
]

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    "Above State Avg": "bg-green-100 text-green-700 border-green-300",
    "Below State Avg": "bg-red-100 text-red-700 border-red-300",
    "At Par": "bg-blue-100 text-blue-700 border-blue-300",
    "Yes — 47 students": "bg-orange-100 text-orange-700 border-orange-300",
    "Yes — 28 students": "bg-yellow-100 text-yellow-700 border-yellow-300",
    No: "bg-green-100 text-green-700 border-green-300",
  }
  return <Badge className={`${map[s] ?? "bg-gray-100 text-gray-700"} border text-xs`}>{s}</Badge>
}

export default function AcademicHeadAssessmentPage() {
  return (
    <Shell>
      <PageHeader
        title="Assessment & Evaluation"
        description="PARAKH framework, board exam readiness, NIPUN Bharat and question bank — Modules 25.4 + 12.1"
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

      {/* Assessment Calendar */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4 text-blue-600" />Assessment Calendar Compliance (%)</CardTitle>
          <CardDescription>Percentage of schools that have completed each assessment for each grade (SA2 due March 2026)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grade</TableHead>
                <TableHead className="text-center">FA1 (%)</TableHead>
                <TableHead className="text-center">FA2 (%)</TableHead>
                <TableHead className="text-center">SA1 (%)</TableHead>
                <TableHead className="text-center">SA2 (due Mar 2026)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessmentCalendar.map((a) => (
                <TableRow key={a.grade}>
                  <TableCell className="font-medium text-sm">{a.grade}</TableCell>
                  <TableCell className="text-center">
                    <span className="text-green-700 font-medium text-sm">{a.fa1}%</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-green-700 font-medium text-sm">{a.fa2}%</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-medium text-sm ${a.sa1 >= 90 ? "text-green-700" : "text-yellow-600"}`}>{a.sa1}%</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-gray-100 text-gray-500 border text-xs">Scheduled</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* PARAKH Alignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4 text-purple-600" />PARAKH Framework Alignment</CardTitle>
            <CardDescription>Performance Assessment Review Analysis & Knowledge for Holistic Development</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {parakhDimensions.map((p) => (
                <div key={p.dimension}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{p.dimension}</span>
                    <span className={p.alignment >= 80 ? "text-green-600 font-medium" : p.alignment >= 65 ? "text-yellow-600 font-medium" : "text-red-600 font-medium"}>
                      {p.alignment}%
                    </span>
                  </div>
                  <Progress value={p.alignment} className="h-2 mb-1" />
                  <p className="text-xs text-gray-400">{p.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* NIPUN Bharat */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="h-4 w-4 text-green-600" />NIPUN Bharat Assessment (FLN)</CardTitle>
            <CardDescription>Foundational Literacy & Numeracy proficiency — Grades 3, 4, 5</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade</TableHead>
                  <TableHead className="text-center">Reading %</TableHead>
                  <TableHead className="text-center">Numeracy %</TableHead>
                  <TableHead className="text-center">State Avg R/N</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nipunData.map((n) => (
                  <TableRow key={n.grade}>
                    <TableCell className="font-medium text-sm">{n.grade}</TableCell>
                    <TableCell className="text-center text-green-700 font-medium text-sm">{n.readingProficiency}%</TableCell>
                    <TableCell className="text-center text-green-700 font-medium text-sm">{n.numeracyProficiency}%</TableCell>
                    <TableCell className="text-center text-sm text-gray-500">{n.stateAvgReading}% / {n.stateAvgNumeracy}%</TableCell>
                    <TableCell><StatusBadge s={n.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-gray-500 mt-3">NIPUN Bharat target: 100% foundational literacy & numeracy by Grade 3 end (2026-27)</p>
          </CardContent>
        </Card>
      </div>

      {/* Board Exam Readiness */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-orange-600" />Board Exam Readiness — Class X & XII</CardTitle>
          <CardDescription>Pre-board mock average scores and predicted pass percentages</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">Class X Mock Avg</TableHead>
                <TableHead className="text-center">Class X Prediction</TableHead>
                <TableHead className="text-center">Class XII Mock Avg</TableHead>
                <TableHead className="text-center">Class XII Prediction</TableHead>
                <TableHead>Coaching Needed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boardExamReadiness.map((b) => (
                <TableRow key={b.subject}>
                  <TableCell className="font-medium text-sm">{b.subject}</TableCell>
                  <TableCell className="text-center text-sm">{b.class10MockAvg}%</TableCell>
                  <TableCell className="text-center text-sm text-green-700">{b.class10Predicted}</TableCell>
                  <TableCell className="text-center text-sm">{b.class12MockAvg}%</TableCell>
                  <TableCell className="text-center text-sm text-green-700">{b.class12Predicted}</TableCell>
                  <TableCell><StatusBadge s={b.coachingNeeded} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Question Bank */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-teal-600" />Question Bank Health</CardTitle>
          <CardDescription>Item bank size, recency and difficulty distribution by subject</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead className="text-right">Total Items</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-center">Easy %</TableHead>
                <TableHead className="text-center">Medium %</TableHead>
                <TableHead className="text-center">Hard %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionBankHealth.map((q) => (
                <TableRow key={q.subject}>
                  <TableCell className="font-medium text-sm">{q.subject}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{q.items.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-gray-600">{q.updated}</TableCell>
                  <TableCell className="text-center text-sm text-green-600">{q.easy}%</TableCell>
                  <TableCell className="text-center text-sm text-yellow-600">{q.medium}%</TableCell>
                  <TableCell className="text-center text-sm text-red-600">{q.hard}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

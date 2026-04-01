import {
  ClipboardList, CheckCircle2, AlertTriangle, Clock, TrendingUp, BookOpen,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shell } from "@/components/shell"
import { PageHeader } from "@/components/page-header"

const stats = [
  { label: "Pending Assignments", value: "3", colour: "text-red-600", icon: AlertTriangle },
  { label: "Submitted This Term", value: "24", colour: "text-green-600", icon: CheckCircle2 },
  { label: "Avg Score", value: "78.4 / 100", colour: "text-blue-600", icon: TrendingUp },
]

const pendingAssignments = [
  {
    subject: "Mathematics",
    title: "Probability Problems — Set 4 (Ch. 15)",
    setBy: "Mr. Arun Mehta",
    givenDate: "2025-11-20",
    dueDate: "2025-11-25",
    maxMarks: 20,
    instructions: "Solve all 8 problems. Show full working. Use NCERT examples as reference.",
    urgency: "URGENT",
  },
  {
    subject: "Science",
    title: "Design an Experiment — Factors affecting Photosynthesis",
    setBy: "Ms. Rekha Pillai",
    givenDate: "2025-11-18",
    dueDate: "2025-11-28",
    maxMarks: 25,
    instructions: "Design a controlled experiment. Draw labelled diagram. Mention hypothesis, variables, and expected results.",
    urgency: "Due Soon",
  },
  {
    subject: "English",
    title: "Book Review: To Kill a Mockingbird",
    setBy: "Ms. Anita Bhatt",
    givenDate: "2025-11-15",
    dueDate: "2025-12-02",
    maxMarks: 30,
    instructions: "Write 600-800 words. Cover plot summary, character analysis, themes, and personal reflection. Typed or handwritten accepted.",
    urgency: "Due Later",
  },
]

const submittedAssignments = [
  { subject: "Mathematics", title: "Statistics — Mean, Median, Mode Problems", submitted: "2025-11-12", marks: 18, max: 20, grade: "A", feedback: "Excellent step-wise working. Minor calculation error in Q6." },
  { subject: "Science", title: "Lab Report — Acid-Base Reactions", submitted: "2025-11-08", marks: 22, max: 25, grade: "A", feedback: "Clear observations and inference. Improve conclusion writing." },
  { subject: "English", title: "Descriptive Essay — My Hometown", submitted: "2025-11-05", marks: 26, max: 30, grade: "A", feedback: "Vivid description. Good vocabulary. Work on paragraph transitions." },
  { subject: "Social Studies", title: "Map Work — Physical Features of India", submitted: "2025-10-30", marks: 19, max: 20, grade: "A1", feedback: "Perfect labelling. Neat and accurate." },
  { subject: "Hindi", title: "पत्र लेखन — औपचारिक पत्र", submitted: "2025-10-25", marks: 14, max: 20, grade: "B1", feedback: "Good language. Format needs improvement. Practice formal letter structure." },
  { subject: "Computer Science", title: "Python Program — Simple Calculator", submitted: "2025-10-22", marks: 28, max: 30, grade: "A", feedback: "Clean code, good comments. Add input validation." },
  { subject: "Mathematics", title: "Coordinate Geometry — Distance Formula", submitted: "2025-10-18", marks: 17, max: 20, grade: "A", feedback: "Good. Double-check section formula in Q4." },
  { subject: "Science", title: "Research Note — Human Nervous System", submitted: "2025-10-10", marks: 21, max: 25, grade: "A", feedback: "Well-researched. Good use of diagrams. Add more detail on reflex arc." },
  { subject: "English", title: "Grammar Exercise — Passive Voice Transformation", submitted: "2025-09-28", marks: 19, max: 20, grade: "A1", feedback: "Excellent. All transformations correct." },
  { subject: "Social Studies", title: "Project — Democracy and Elections in India", submitted: "2025-09-20", marks: 23, max: 30, grade: "B1", feedback: "Good research. Add more data. Presentation could be more organised." },
  { subject: "Mathematics", title: "Trigonometry — Identities Proof Sheet", submitted: "2025-09-15", marks: 16, max: 20, grade: "A", feedback: "3 out of 4 proofs correct. Revisit cosine identities." },
  { subject: "Hindi", title: "कहानी — नैतिक मूल्य आधारित", submitted: "2025-09-08", marks: 17, max: 20, grade: "A", feedback: "Creative and well-written story. Good use of संवाद." },
  { subject: "Science", title: "Poster — Environmental Pollution Awareness", submitted: "2025-08-30", marks: 24, max: 25, grade: "A", feedback: "Visually impactful. All key points covered." },
  { subject: "Computer Science", title: "HTML/CSS Mini Website — Personal Portfolio", submitted: "2025-08-22", marks: 27, max: 30, grade: "A", feedback: "Good design. Add responsive layout next time." },
  { subject: "Mathematics", title: "Polynomial Division — Long Division Practice", submitted: "2025-08-12", marks: 15, max: 20, grade: "A", feedback: "Mostly correct. Step 3 in Q2 has systematic error — review." },
]

const subjectSummary = [
  { subject: "Mathematics", total: 8, completed: 8, pending: 0, avgScore: 81.2 },
  { subject: "Science", total: 5, completed: 5, pending: 1, avgScore: 83.6 },
  { subject: "English", total: 5, completed: 4, pending: 1, avgScore: 76.7 },
  { subject: "Social Studies", total: 4, completed: 4, pending: 0, avgScore: 73.3 },
  { subject: "Hindi", total: 4, completed: 4, pending: 0, avgScore: 77.5 },
  { subject: "Computer Science", total: 3, completed: 3, pending: 1, avgScore: 90.0 },
]

const recentFeedback = [
  { teacher: "Mr. Arun Mehta", subject: "Mathematics", comment: "Ananya, your step-wise approach in Statistics was exemplary. Keep up the detailed working — it shows deep conceptual understanding.", date: "2025-11-12" },
  { teacher: "Ms. Rekha Pillai", subject: "Science", comment: "Good experimental design. Focus on writing more precise hypothesis statements for your next lab report.", date: "2025-11-08" },
  { teacher: "Ms. Anita Bhatt", subject: "English", comment: "Your essay writing has improved significantly this term. Your descriptive vocabulary is growing — work on smooth transitions between ideas.", date: "2025-11-05" },
]

function UrgencyBadge({ u }: { u: string }) {
  const map: Record<string, string> = {
    URGENT: "bg-red-600 text-white",
    "Due Soon": "bg-orange-100 text-orange-700 border-orange-300",
    "Due Later": "bg-green-100 text-green-700 border-green-300",
  }
  return <Badge className={`${map[u] ?? "bg-gray-100 text-gray-700"} border text-xs`}>{u}</Badge>
}

function GradeBadge({ g }: { g: string }) {
  const map: Record<string, string> = {
    A1: "bg-green-600 text-white",
    A: "bg-green-100 text-green-700 border-green-300",
    B1: "bg-blue-100 text-blue-700 border-blue-300",
    B2: "bg-yellow-100 text-yellow-700 border-yellow-300",
  }
  return <Badge className={`${map[g] ?? "bg-gray-100 text-gray-700"} border text-xs`}>{g}</Badge>
}

export default function StudentAssignmentsPage() {
  return (
    <Shell>
      <PageHeader
        title="My Assignments"
        description="Ananya Mishra — Class X-B | All assignments, submissions and teacher feedback"
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6 text-center">
              <s.icon className={`h-6 w-6 mx-auto mb-2 ${s.colour}`} />
              <p className={`text-2xl font-bold ${s.colour}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Assignments */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-orange-700"><AlertTriangle className="h-4 w-4" />Pending Assignments ({pendingAssignments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingAssignments.map((a, i) => (
              <div key={i} className={`border rounded-lg p-4 ${a.urgency === "URGENT" ? "border-red-300 bg-red-50" : a.urgency === "Due Soon" ? "border-orange-200 bg-orange-50" : "border-gray-200"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{a.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.subject} · Set by {a.setBy}</p>
                  </div>
                  <UrgencyBadge u={a.urgency} />
                </div>
                <p className="text-xs text-gray-600 mt-2">{a.instructions}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span><Clock className="h-3 w-3 inline mr-0.5" />Given: {a.givenDate}</span>
                  <span className="font-medium text-red-600"><Clock className="h-3 w-3 inline mr-0.5" />Due: {a.dueDate}</span>
                  <span>Max Marks: {a.maxMarks}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submitted Assignments */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="h-4 w-4 text-green-600" />Submitted Assignments — This Term</CardTitle>
          <CardDescription>24 submissions — average score 78.4/100</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Feedback</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submittedAssignments.map((a, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 border text-xs">{a.subject}</Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{a.title}</TableCell>
                  <TableCell className="text-sm text-gray-600">{a.submitted}</TableCell>
                  <TableCell className="text-center text-sm font-medium">{a.marks}/{a.max}</TableCell>
                  <TableCell><GradeBadge g={a.grade} /></TableCell>
                  <TableCell className="text-xs text-gray-600 max-w-[200px]">{a.feedback}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-purple-600" />Subject-wise Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Done</TableHead>
                  <TableHead className="text-center">Pending</TableHead>
                  <TableHead className="text-center">Avg Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjectSummary.map((s) => (
                  <TableRow key={s.subject}>
                    <TableCell className="text-sm font-medium">{s.subject}</TableCell>
                    <TableCell className="text-center text-sm">{s.total}</TableCell>
                    <TableCell className="text-center text-sm text-green-700">{s.completed}</TableCell>
                    <TableCell className="text-center">
                      {s.pending > 0 ? <Badge className="bg-red-100 text-red-700 border-red-300 border text-xs">{s.pending}</Badge> : <span className="text-gray-400 text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium text-blue-700">{s.avgScore}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Feedback */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-teal-600" />Recent Teacher Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentFeedback.map((f, i) => (
                <div key={i} className="p-3 bg-teal-50 border border-teal-100 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-medium text-teal-800">{f.teacher}</p>
                    <span className="text-xs text-gray-400">{f.date}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{f.subject}</p>
                  <p className="text-xs text-gray-700 italic">&ldquo;{f.comment}&rdquo;</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

"use client"

import {
  BookOpen,
  BookMarked,
  RefreshCw,
  Package,
  BarChart3,
  ClipboardList,
  Users,
  Layers,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Shell } from "@/components/shell"
import {
  PageHeader,
  PageHeaderHeading,
  PageHeaderDescription,
} from "@/components/page-header"

// ─── Mock Data ────────────────────────────────────────────────────────────────

const kpiCards = [
  {
    label: "Topics in Curriculum",
    value: "248",
    sub: "Across Class VI–X · All chapters",
    icon: BookOpen,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Covered This Term",
    value: "174",
    sub: "70.2% of annual curriculum",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    label: "Revision Topics",
    value: "34",
    sub: "Scheduled for repeat coverage",
    icon: RefreshCw,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    label: "Resources Mapped",
    value: "1,247",
    sub: "Textbooks, worksheets, digital",
    icon: Package,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
]

const topicCoverageMap = [
  {
    chapter: "Number System",
    classVI: 92, classVII: 88, classVIII: 76, classIX: 84, classX: 0,
    lessonsCompleted: 48, lessonsPending: 4, status: "On Track",
  },
  {
    chapter: "Algebra",
    classVI: 70, classVII: 78, classVIII: 82, classIX: 65, classX: 72,
    lessonsCompleted: 62, lessonsPending: 14, status: "On Track",
  },
  {
    chapter: "Geometry",
    classVI: 85, classVII: 80, classVIII: 68, classIX: 58, classX: 74,
    lessonsCompleted: 55, lessonsPending: 11, status: "On Track",
  },
  {
    chapter: "Mensuration",
    classVI: 90, classVII: 88, classVIII: 72, classIX: 60, classX: 55,
    lessonsCompleted: 44, lessonsPending: 8, status: "Slightly Behind",
  },
  {
    chapter: "Statistics",
    classVI: 0, classVII: 0, classVIII: 78, classIX: 70, classX: 68,
    lessonsCompleted: 28, lessonsPending: 6, status: "On Track",
  },
  {
    chapter: "Probability",
    classVI: 0, classVII: 0, classVIII: 0, classIX: 52, classX: 48,
    lessonsCompleted: 14, lessonsPending: 10, status: "At Risk",
  },
  {
    chapter: "Coordinate Geometry",
    classVI: 0, classVII: 0, classVIII: 0, classIX: 74, classX: 62,
    lessonsCompleted: 18, lessonsPending: 5, status: "On Track",
  },
  {
    chapter: "Trigonometry",
    classVI: 0, classVII: 0, classVIII: 0, classIX: 0, classX: 44,
    lessonsCompleted: 10, lessonsPending: 12, status: "At Risk",
  },
]

const ncfCompetencies = [
  { skill: "Number Sense & Operations", topicsMapped: "Number System, Algebra", mappedPct: 94, grade: "A" },
  { skill: "Algebraic Thinking", topicsMapped: "Algebra, Coordinate Geometry", mappedPct: 87, grade: "A" },
  { skill: "Spatial Reasoning", topicsMapped: "Geometry, Mensuration", mappedPct: 82, grade: "B+" },
  { skill: "Measurement & Estimation", topicsMapped: "Mensuration, Statistics", mappedPct: 78, grade: "B" },
  { skill: "Data Handling & Interpretation", topicsMapped: "Statistics, Probability", mappedPct: 71, grade: "B" },
  { skill: "Probabilistic Reasoning", topicsMapped: "Probability", mappedPct: 60, grade: "C+" },
  { skill: "Mathematical Communication", topicsMapped: "All Chapters", mappedPct: 76, grade: "B" },
  { skill: "Problem Solving", topicsMapped: "All Chapters", mappedPct: 88, grade: "A" },
  { skill: "Mathematical Reasoning", topicsMapped: "Algebra, Geometry", mappedPct: 85, grade: "A" },
  { skill: "Pattern Recognition", topicsMapped: "Number System, Algebra", mappedPct: 90, grade: "A" },
  { skill: "Proportional Reasoning", topicsMapped: "Mensuration, Algebra", mappedPct: 73, grade: "B" },
  { skill: "Mathematical Modelling", topicsMapped: "Statistics, Coordinate Geometry", mappedPct: 65, grade: "C+" },
]

const teacherProgress = [
  { name: "Mr. Arun Mehta", classes: "VIII–X", currentChapter: "Quadratic Equations", totalChapters: 15, completed: 10, pct: 67 },
  { name: "Ms. Rekha Sharma", classes: "VI–VII", currentChapter: "Fractions & Decimals", totalChapters: 14, completed: 12, pct: 86 },
  { name: "Mr. Suresh Yadav", classes: "IX–X", currentChapter: "Coordinate Geometry", totalChapters: 15, completed: 8, pct: 53 },
  { name: "Ms. Anita Singh", classes: "VI–VIII", currentChapter: "Basic Geometry", totalChapters: 14, completed: 13, pct: 93 },
  { name: "Mr. Praveen Kumar", classes: "VII–IX", currentChapter: "Linear Equations", totalChapters: 15, completed: 10, pct: 67 },
  { name: "Ms. Deepa Nair", classes: "X–XII", currentChapter: "Trigonometric Identities", totalChapters: 16, completed: 13, pct: 81 },
]

const activityLog = [
  { activity: "Math Fair 2024–25", class: "VI–X", date: "15 Jan 2025", status: "Completed", type: "Exhibition" },
  { activity: "Vedic Math Workshop", class: "VII–IX", date: "03 Feb 2025", status: "Completed", type: "Workshop" },
  { activity: "Financial Literacy Module", class: "IX–X", date: "20 Feb 2025", status: "Completed", type: "Module" },
  { activity: "Geometric Art Project", class: "VI–VIII", date: "10 Mar 2025", status: "In Progress", type: "Project" },
  { activity: "Data Collection Project", class: "VIII–X", date: "25 Mar 2025", status: "In Progress", type: "Project" },
  { activity: "Mental Math Olympiad Prep", class: "VI–X", date: "05 Apr 2025", status: "Upcoming", type: "Competition" },
  { activity: "Statistical Survey Activity", class: "IX–X", date: "18 Apr 2025", status: "Upcoming", type: "Activity" },
  { activity: "Probability Games Day", class: "VIII–IX", date: "30 Apr 2025", status: "Upcoming", type: "Activity" },
]

const resourceUtilisation = [
  { type: "Textbook (NCERT)", available: 1247, required: 1247, availabilityPct: 100, condition: "Good" },
  { type: "Workbook / Practice Book", available: 1180, required: 1247, availabilityPct: 95, condition: "Good" },
  { type: "Math Lab Kit", available: 22, required: 30, availabilityPct: 73, condition: "Fair" },
  { type: "Digital Simulation Access", available: 8, required: 10, availabilityPct: 80, condition: "Good" },
  { type: "Flash Cards (Topic-wise)", available: 340, required: 400, availabilityPct: 85, condition: "Fair" },
  { type: "Activity Sheets", available: 980, required: 1000, availabilityPct: 98, condition: "Good" },
]

// ─── Helper Components ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "On Track": "bg-green-100 text-green-700",
    "Slightly Behind": "bg-yellow-100 text-yellow-700",
    "At Risk": "bg-red-100 text-red-700",
    "Completed": "bg-green-100 text-green-700",
    "In Progress": "bg-blue-100 text-blue-700",
    "Upcoming": "bg-gray-100 text-gray-600",
  }
  return (
    <Badge className={`${map[status] ?? "bg-gray-100 text-gray-600"} border-0 text-xs font-medium`}>
      {status}
    </Badge>
  )
}

function GradeBadge({ grade }: { grade: string }) {
  const map: Record<string, string> = {
    "A": "bg-green-100 text-green-800",
    "A+": "bg-emerald-100 text-emerald-800",
    "B+": "bg-blue-100 text-blue-700",
    "B": "bg-blue-50 text-blue-700",
    "C+": "bg-amber-100 text-amber-700",
    "C": "bg-orange-100 text-orange-700",
  }
  return (
    <Badge className={`${map[grade] ?? "bg-gray-100 text-gray-600"} border-0 text-xs font-bold`}>
      {grade}
    </Badge>
  )
}

function SectionHeading({
  icon: Icon,
  title,
  description,
  iconColor = "text-blue-600",
}: {
  icon: React.ElementType
  title: string
  description?: string
  iconColor?: string
}) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`h-5 w-5 ${iconColor}`} />
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}

function CoverageCell({ pct }: { pct: number }) {
  if (pct === 0) return <span className="text-gray-300 text-xs">N/A</span>
  const color = pct >= 80 ? "text-green-700" : pct >= 60 ? "text-yellow-700" : "text-red-600"
  return <span className={`font-semibold text-xs ${color}`}>{pct}%</span>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CurriculumPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Mathematics Curriculum Management</PageHeaderHeading>
        <PageHeaderDescription>
          Module 21.3 &mdash; Mr. Arun Mehta, Mathematics Subject Incharge &mdash; Topic Coverage, NCF 2023 Mapping &amp; Resource Utilisation
        </PageHeaderDescription>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${k.bg} mb-2`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div className={`text-2xl font-bold ${k.color} leading-tight`}>{k.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{k.sub}</div>
              <div className="text-xs font-medium text-gray-600 mt-1">{k.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section A: Topic Coverage Map */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <SectionHeading
            icon={Layers}
            title="Section A — Topic Coverage Map (Class VI–X)"
            description="Chapter-wise coverage percentage across each class with completion status"
            iconColor="text-blue-600"
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs min-w-[160px]">Chapter / Topic</TableHead>
                  <TableHead className="text-xs text-center">Class VI</TableHead>
                  <TableHead className="text-xs text-center">Class VII</TableHead>
                  <TableHead className="text-xs text-center">Class VIII</TableHead>
                  <TableHead className="text-xs text-center">Class IX</TableHead>
                  <TableHead className="text-xs text-center">Class X</TableHead>
                  <TableHead className="text-xs text-center">Lessons Done</TableHead>
                  <TableHead className="text-xs text-center">Pending</TableHead>
                  <TableHead className="text-xs text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topicCoverageMap.map((row) => (
                  <TableRow key={row.chapter} className="text-xs">
                    <TableCell className="font-medium">{row.chapter}</TableCell>
                    <TableCell className="text-center"><CoverageCell pct={row.classVI} /></TableCell>
                    <TableCell className="text-center"><CoverageCell pct={row.classVII} /></TableCell>
                    <TableCell className="text-center"><CoverageCell pct={row.classVIII} /></TableCell>
                    <TableCell className="text-center"><CoverageCell pct={row.classIX} /></TableCell>
                    <TableCell className="text-center"><CoverageCell pct={row.classX} /></TableCell>
                    <TableCell className="text-center font-semibold text-green-700">{row.lessonsCompleted}</TableCell>
                    <TableCell className="text-center font-semibold text-amber-600">{row.lessonsPending}</TableCell>
                    <TableCell className="text-center"><StatusBadge status={row.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Section B: NCF 2023 Competency Mapping */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <SectionHeading
            icon={BookMarked}
            title="Section B — NCF 2023 Mathematical Competency Mapping"
            description="12 mathematical thinking competencies aligned to NCERT topics with coverage percentage"
            iconColor="text-indigo-600"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Mathematical Competency</TableHead>
                <TableHead className="text-xs">Topics Mapped</TableHead>
                <TableHead className="text-xs text-center">Coverage %</TableHead>
                <TableHead className="text-xs text-center w-48">Progress</TableHead>
                <TableHead className="text-xs text-center">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ncfCompetencies.map((row) => (
                <TableRow key={row.skill} className="text-xs">
                  <TableCell className="font-medium">{row.skill}</TableCell>
                  <TableCell className="text-muted-foreground">{row.topicsMapped}</TableCell>
                  <TableCell className="text-center font-semibold">{row.mappedPct}%</TableCell>
                  <TableCell>
                    <Progress value={row.mappedPct} className="h-1.5" />
                  </TableCell>
                  <TableCell className="text-center"><GradeBadge grade={row.grade} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section C: Teacher Textbook Progress */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <SectionHeading
            icon={Users}
            title="Section C — Textbook Chapter Completion by Teacher"
            description="Current chapter progress and overall completion percentage per teacher"
            iconColor="text-teal-600"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Teacher</TableHead>
                <TableHead className="text-xs">Classes</TableHead>
                <TableHead className="text-xs">Current Chapter</TableHead>
                <TableHead className="text-xs text-center">Total Chapters</TableHead>
                <TableHead className="text-xs text-center">Completed</TableHead>
                <TableHead className="text-xs text-center w-36">Progress</TableHead>
                <TableHead className="text-xs text-center">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teacherProgress.map((row) => (
                <TableRow key={row.name} className="text-xs">
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.classes}</TableCell>
                  <TableCell className="text-muted-foreground">{row.currentChapter}</TableCell>
                  <TableCell className="text-center">{row.totalChapters}</TableCell>
                  <TableCell className="text-center font-semibold text-green-700">{row.completed}</TableCell>
                  <TableCell>
                    <Progress value={row.pct} className="h-1.5" />
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={row.pct >= 80 ? "text-green-700 font-bold" : row.pct >= 60 ? "text-yellow-700 font-semibold" : "text-red-600 font-bold"}>
                      {row.pct}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section D & E: Side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Activity / Project Log */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeading
              icon={ClipboardList}
              title="Section D — Activity &amp; Project Log"
              description="Co-curricular mathematics activities this academic year"
              iconColor="text-orange-600"
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Activity</TableHead>
                  <TableHead className="text-xs">Class</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLog.map((row) => (
                  <TableRow key={row.activity} className="text-xs">
                    <TableCell className="font-medium">
                      <div>{row.activity}</div>
                      <div className="text-muted-foreground font-normal">{row.type}</div>
                    </TableCell>
                    <TableCell>{row.class}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell className="text-center"><StatusBadge status={row.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Resource Utilisation */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeading
              icon={FlaskConical}
              title="Section E — Resource Utilisation"
              description="Availability and condition of key mathematics teaching resources"
              iconColor="text-purple-600"
            />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resourceUtilisation.map((row) => (
                <div key={row.type}>
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <span className="text-xs font-medium text-gray-800">{row.type}</span>
                      <Badge
                        className={`ml-2 border-0 text-xs ${row.condition === "Good" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                      >
                        {row.condition}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {row.available}/{row.required}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={row.availabilityPct} className="h-2 flex-1" />
                    <span className={`text-xs font-bold w-10 text-right ${row.availabilityPct === 100 ? "text-green-700" : row.availabilityPct >= 80 ? "text-blue-700" : "text-amber-600"}`}>
                      {row.availabilityPct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

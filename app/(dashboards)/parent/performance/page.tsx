import {
  BookOpen,
  TrendingUp,
  Award,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  PageHeader,
  PageHeaderHeading,
  PageHeaderDescription,
} from "@/components/page-header"
import { LineChart } from "@/components/charts/line-chart"
import { CHART_COLORS, SERIES_COLORS } from "@/components/charts/chart-colors"

// Mock exam results data — Class 9 terms FA1, FA2, SA1, SA2
const SUBJECTS = ["Mathematics", "Science", "English", "Social Studies", "Hindi"]

const RESULTS: Record<string, Record<string, number>> = {
  FA1: { Mathematics: 82, Science: 79, English: 88, "Social Studies": 74, Hindi: 85 },
  FA2: { Mathematics: 85, Science: 83, English: 90, "Social Studies": 78, Hindi: 87 },
  SA1: { Mathematics: 88, Science: 82, English: 91, "Social Studies": 76, Hindi: 89 },
  SA2: { Mathematics: 90, Science: 86, English: 93, "Social Studies": 80, Hindi: 91 },
}

const TERMS = ["FA1", "FA2", "SA1", "SA2"]

const lineData = TERMS.map((term) => ({
  term,
  ...SUBJECTS.reduce((acc, s) => ({ ...acc, [s]: RESULTS[term][s] }), {} as Record<string, number>),
}))

const lineSeries = SUBJECTS.map((s, i) => ({
  key: s,
  name: s,
  color: SERIES_COLORS[i],
}))

function gradeLabel(pct: number) {
  if (pct >= 91) return "A1"
  if (pct >= 81) return "A2"
  if (pct >= 71) return "B1"
  if (pct >= 61) return "B2"
  if (pct >= 51) return "C1"
  return "C2"
}

export default function ParentPerformancePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader>
        <div>
          <PageHeaderHeading>Academic Performance</PageHeaderHeading>
          <PageHeaderDescription>
            Exam results across all terms — Aryan Sharma · Class 9-A
          </PageHeaderDescription>
        </div>
      </PageHeader>

      {/* Marks Trend Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Marks Trend — FA1 to SA2
          </CardTitle>
          <CardDescription>Subject-wise marks % progression across terms</CardDescription>
        </CardHeader>
        <CardContent>
          <LineChart
            data={lineData}
            xKey="term"
            series={lineSeries}
            height={320}
            unit="%"
            yDomain={[60, 100]}
          />
        </CardContent>
      </Card>

      {/* Term-wise Results Table */}
      {TERMS.map((term) => (
        <Card key={term}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              {term} Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-center">Marks</TableHead>
                  <TableHead className="text-center">Max</TableHead>
                  <TableHead className="text-center">%</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SUBJECTS.map((s) => {
                  const pct = RESULTS[term][s]
                  const grade = gradeLabel(pct)
                  return (
                    <TableRow key={s}>
                      <TableCell className="font-medium">{s}</TableCell>
                      <TableCell className="text-center">{Math.round(pct * 0.5)}</TableCell>
                      <TableCell className="text-center">50</TableCell>
                      <TableCell className="text-center font-semibold">{pct}%</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={grade.startsWith("A") ? "default" : "secondary"}>
                          {grade}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
                <TableRow className="font-semibold bg-slate-50">
                  <TableCell>Overall Average</TableCell>
                  <TableCell className="text-center">—</TableCell>
                  <TableCell className="text-center">—</TableCell>
                  <TableCell className="text-center text-blue-600">
                    {(
                      Object.values(RESULTS[term]).reduce((a, b) => a + b, 0) /
                      SUBJECTS.length
                    ).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge>
                      {gradeLabel(
                        Object.values(RESULTS[term]).reduce((a, b) => a + b, 0) / SUBJECTS.length
                      )}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

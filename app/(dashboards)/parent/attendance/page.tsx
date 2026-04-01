import {
  CalendarDays,
  TrendingUp,
  CheckCircle2,
  XCircle,
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
import { HorizontalBarChart } from "@/components/charts/horizontal-bar-chart"
import { CHART_COLORS } from "@/components/charts/chart-colors"

const MONTHLY = [
  { month: "April 2025",     present: 22, total: 24, pct: 91.7 },
  { month: "May 2025",       present: 20, total: 23, pct: 87.0 },
  { month: "June 2025",      present: 18, total: 20, pct: 90.0 },
  { month: "July 2025",      present: 25, total: 27, pct: 92.6 },
  { month: "August 2025",    present: 24, total: 26, pct: 92.3 },
  { month: "September 2025", present: 22, total: 24, pct: 91.7 },
  { month: "October 2025",   present: 21, total: 23, pct: 91.3 },
  { month: "November 2025",  present: 19, total: 22, pct: 86.4 },
  { month: "December 2025",  present: 16, total: 18, pct: 88.9 },
  { month: "January 2026",   present: 24, total: 26, pct: 92.3 },
  { month: "February 2026",  present: 20, total: 22, pct: 90.9 },
  { month: "March 2026",     present: 23, total: 25, pct: 92.0 },
]

const DAILY_LEAVES = [
  { date: "12 May 2025",   reason: "Fever",            approved: true  },
  { date: "28 Jul 2025",   reason: "Family Function",  approved: true  },
  { date: "5 Nov 2025",    reason: "Medical",          approved: true  },
  { date: "20 Nov 2025",   reason: "Unplanned",        approved: false },
  { date: "14 Jan 2026",   reason: "Sports Meet",      approved: true  },
  { date: "22 Feb 2026",   reason: "Unplanned",        approved: false },
]

const barData = MONTHLY.map((m) => ({
  label: m.month.slice(0, 8),
  value: m.pct,
  color: m.pct >= 90 ? CHART_COLORS.green : m.pct >= 85 ? CHART_COLORS.amber : CHART_COLORS.red,
}))

export default function ParentAttendancePage() {
  const totalPresent = MONTHLY.reduce((s, m) => s + m.present, 0)
  const totalDays = MONTHLY.reduce((s, m) => s + m.total, 0)
  const overallPct = ((totalPresent / totalDays) * 100).toFixed(1)

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader>
        <div>
          <PageHeaderHeading>Attendance Record</PageHeaderHeading>
          <PageHeaderDescription>
            Month-wise attendance for Aryan Sharma · Class 9-A
          </PageHeaderDescription>
        </div>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Overall Attendance", value: `${overallPct}%`, color: "text-green-600", bg: "bg-green-50" },
          { label: "Days Present", value: String(totalPresent), color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Working Days", value: String(totalDays), color: "text-slate-600", bg: "bg-slate-50" },
          { label: "Days Absent", value: String(totalDays - totalPresent), color: "text-red-600", bg: "bg-red-50" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Month-wise Attendance %
          </CardTitle>
          <CardDescription>Green ≥ 90% · Amber ≥ 85% · Red &lt; 85%</CardDescription>
        </CardHeader>
        <CardContent>
          <HorizontalBarChart data={barData} height={320} yAxisWidth={90} unit="%" />
        </CardContent>
      </Card>

      {/* Monthly Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            Monthly Attendance Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-center">Present</TableHead>
                <TableHead className="text-center">Total Days</TableHead>
                <TableHead className="text-center">Attendance %</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MONTHLY.map((m) => (
                <TableRow key={m.month}>
                  <TableCell className="font-medium">{m.month}</TableCell>
                  <TableCell className="text-center">{m.present}</TableCell>
                  <TableCell className="text-center">{m.total}</TableCell>
                  <TableCell className="text-center font-semibold">{m.pct.toFixed(1)}%</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={m.pct >= 90 ? "default" : m.pct >= 85 ? "secondary" : "destructive"}
                    >
                      {m.pct >= 90 ? "Good" : m.pct >= 85 ? "Average" : "Low"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Leave Record */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Record</CardTitle>
          <CardDescription>Approved and unapproved absences</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DAILY_LEAVES.map((l) => (
                <TableRow key={l.date + l.reason}>
                  <TableCell>{l.date}</TableCell>
                  <TableCell>{l.reason}</TableCell>
                  <TableCell className="text-center">
                    {l.approved ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle2 className="h-4 w-4" /> Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-500 text-sm">
                        <XCircle className="h-4 w-4" /> Not Approved
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

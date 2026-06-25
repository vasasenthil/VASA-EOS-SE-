import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { PARAKH_RESULTS, PROFICIENCY_LEVELS, assessed, proficientPct, belowBasicPct, parakhSummary } from "@/lib/diagnostic/parakh"

export default function ParakhPage() {
  const s = parakhSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>PARAKH Competency Assessment</PageHeaderHeading>
        <PageHeaderDescription>
          PARAKH (the national assessment body) bands every learner into a proficiency level — {PROFICIENCY_LEVELS.join(", ")}
          {" "}— per subject and grade, not a single mark. Proficiency rate is the share at Proficient or Advanced; the
          weakest area drives remediation. Average proficiency <strong>{s.avgProficiencyPct}%</strong>; weakest area
          {" "}<strong>{s.weakest}</strong>.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/parakh/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.totalAssessed.toLocaleString("en-IN")}</div><div className="text-sm text-muted-foreground">Learners assessed</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.avgProficiencyPct}%</div><div className="text-sm text-muted-foreground">Avg proficiency</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.strongest}</div><div className="text-sm text-muted-foreground">Strongest area</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-red-600 dark:text-red-500">{s.weakest}</div><div className="text-sm text-muted-foreground">Weakest area</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead className="text-right">Grade</TableHead>
                <TableHead className="text-right">Assessed</TableHead>
                <TableHead className="text-right">Below Basic</TableHead>
                <TableHead className="w-44">Proficiency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PARAKH_RESULTS.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.subject}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{r.grade}</TableCell>
                  <TableCell className="text-right">{assessed(r)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={belowBasicPct(r) >= 25 ? "border-red-500 text-red-600 dark:text-red-500" : ""}>{belowBasicPct(r)}%</Badge>
                  </TableCell>
                  <TableCell>
                    <Progress value={proficientPct(r)} />
                    <div className="mt-1 text-xs text-muted-foreground">{proficientPct(r)}%</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

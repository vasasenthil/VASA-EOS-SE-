import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { EXAM_CENTRES, utilisationPct, overAllotted, readinessPct, clearedToConduct, pendingChecks, boardPrepSummary } from "@/lib/exams/board-prep"

export default function BoardPrepPage() {
  const s = boardPrepSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Board Exam Centre Readiness</PageHeaderHeading>
        <PageHeaderDescription>
          The logistics layer of SSLC/HSC conduct: are the examination centres ready? Each centre shows its candidate
          allocation against capacity and a readiness checklist — CCTV, invigilators, seating, strong room,
          connectivity. A centre is cleared to conduct only when every check is met and it is not over-allotted.
          {" "}{s.cleared} of {s.centres} centres are cleared; {s.overAllotted} are over-allotted.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/board-prep/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.centres}</div><div className="text-sm text-muted-foreground">Centres</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.totalAllotted.toLocaleString("en-IN")}<span className="text-base text-muted-foreground">/{s.totalCapacity.toLocaleString("en-IN")}</span></div><div className="text-sm text-muted-foreground">Candidates / capacity</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.cleared}</div><div className="text-sm text-muted-foreground">Cleared to conduct</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-red-600 dark:text-red-500">{s.overAllotted}</div><div className="text-sm text-muted-foreground">Over-allotted</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Centre</TableHead>
                <TableHead className="text-right">Allotment</TableHead>
                <TableHead className="w-40">Readiness</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EXAM_CENTRES.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{c.id} · {c.district}</div>
                  </TableCell>
                  <TableCell className={`text-right ${overAllotted(c) ? "font-medium text-red-600 dark:text-red-500" : "text-muted-foreground"}`}>
                    {c.allotted}/{c.capacity} ({utilisationPct(c)}%)
                  </TableCell>
                  <TableCell><Progress value={readinessPct(c)} /><div className="mt-1 text-xs text-muted-foreground">{readinessPct(c)}%</div></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{pendingChecks(c).join(", ") || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={clearedToConduct(c) ? "default" : "outline"} className={clearedToConduct(c) ? "" : "border-red-500 text-red-600 dark:text-red-500"}>
                      {clearedToConduct(c) ? "cleared" : "not ready"}
                    </Badge>
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

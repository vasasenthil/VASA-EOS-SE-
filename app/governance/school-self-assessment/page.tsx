import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { SQAAF_DOMAINS, gapToTarget, sqaafSummary } from "@/lib/governance/school-self-assessment"

export default function SchoolSelfAssessmentPage() {
  const s = sqaafSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Self-Assessment (Shaala Siddhi)</PageHeaderHeading>
        <PageHeaderDescription>
          The SQAAF / Shaala Siddhi framework asks a school to rate itself honestly across seven key domains on a 1–4
          maturity scale, then work the gap to target. Each domain is evidence-linked to the platform module that
          backs it. Overall maturity is <strong>{s.avgLevel}/4</strong> ({s.band}); {s.improvementAreas} of {s.domains}
          {" "}domains are below target.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/school-self-assessment/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.avgLevel}<span className="text-base text-muted-foreground">/4</span></div><div className="text-sm text-muted-foreground">Overall maturity</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.band}</div><div className="text-sm text-muted-foreground">Maturity band</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.atTarget}</div><div className="text-sm text-muted-foreground">At target</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-red-600 dark:text-red-500">{s.improvementAreas}</div><div className="text-sm text-muted-foreground">Below target</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead className="w-40">Maturity</TableHead>
                <TableHead className="text-right">Level</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead>Evidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SQAAF_DOMAINS.map((d) => (
                <TableRow key={d.key}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell><Progress value={(d.level / 4) * 100} /></TableCell>
                  <TableCell className="text-right">
                    <Badge variant={gapToTarget(d) === 0 ? "default" : "outline"} className={gapToTarget(d) === 0 ? "" : "border-amber-500 text-amber-600 dark:text-amber-500"}>
                      {d.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{d.target}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{d.evidenceRef}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

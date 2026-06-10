import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { SCREENINGS, totalScore, band, topConcern, mentalHealthSummary, type WellbeingBand } from "@/lib/health/mental-health"

const BAND_VARIANT: Record<WellbeingBand, "default" | "secondary" | "outline"> = {
  well: "default",
  monitor: "secondary",
  refer: "outline",
}

export default function MentalHealthPage() {
  const s = mentalHealthSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Adolescent Mental-Health Screening</PageHeaderHeading>
        <PageHeaderDescription>
          A brief, confidential wellbeing screen across six concern domains (stress, anxiety, mood, sleep, peer
          relationships, exam pressure). Each student is banded well / monitor / refer; a &lsquo;refer&rsquo; routes to
          the counsellor and RBSK mental-health pathway. {s.refer} of {s.screened} students are flagged for referral;
          the cohort&apos;s top concern is <strong>{s.topCohortConcern}</strong>. (Screening is consent-gated and the
          identities anonymised in practice.)
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/mental-health/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.screened}</div><div className="text-sm text-muted-foreground">Screened</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.well}</div><div className="text-sm text-muted-foreground">Well</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-amber-600 dark:text-amber-500">{s.monitor}</div><div className="text-sm text-muted-foreground">Monitor</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-red-600 dark:text-red-500">{s.refer}</div><div className="text-sm text-muted-foreground">Refer</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="text-right">Grade</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Top concern</TableHead>
                <TableHead>Band</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SCREENINGS.map((sc) => (
                <TableRow key={sc.studentId}>
                  <TableCell className="font-mono text-xs">{sc.studentId}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{sc.grade}</TableCell>
                  <TableCell className="text-right">{totalScore(sc)}<span className="text-xs text-muted-foreground">/24</span></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{topConcern(sc)}</TableCell>
                  <TableCell>
                    <Badge variant={BAND_VARIANT[band(sc)]} className={band(sc) === "refer" ? "border-red-500 text-red-600 dark:text-red-500" : ""}>
                      {band(sc)}
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

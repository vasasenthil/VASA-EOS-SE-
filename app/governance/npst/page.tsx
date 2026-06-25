import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { SAMPLE_PROFILE, gap, npstSummary } from "@/lib/cpd/npst"

export default function NpstPage() {
  const s = npstSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>NPST Competency Tracking</PageHeaderHeading>
        <PageHeaderDescription>
          NEP 2020&apos;s National Professional Standards for Teachers: progression through career stages by competency,
          not seniority. {SAMPLE_PROFILE.name} is targeting <strong>{s.targetStage}</strong> — overall competency
          {" "}<strong>{s.competencyPct}%</strong>, {s.developmentAreas} domains below the expected level. Ready to
          progress: <strong>{s.readyToProgress ? "yes" : "no"}</strong>. The CPD plan flows from the gaps.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/npst/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.competencyPct}%</div><div className="text-sm text-muted-foreground">Overall competency</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.targetStage}</div><div className="text-sm text-muted-foreground">Target stage</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-amber-600 dark:text-amber-500">{s.developmentAreas}</div><div className="text-sm text-muted-foreground">Development areas</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className={`text-2xl font-semibold ${s.readyToProgress ? "text-green-600 dark:text-green-500" : "text-muted-foreground"}`}>{s.readyToProgress ? "Ready" : "Not yet"}</div><div className="text-sm text-muted-foreground">Progression</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NPST domain</TableHead>
                <TableHead className="w-48">Current</TableHead>
                <TableHead className="text-right">Level</TableHead>
                <TableHead className="text-right">Expected</TableHead>
                <TableHead className="text-right">Gap</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SAMPLE_PROFILE.domains.map((d) => (
                <TableRow key={d.key}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell><Progress value={(d.current / 5) * 100} /></TableCell>
                  <TableCell className="text-right">{d.current}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{d.expected}</TableCell>
                  <TableCell className="text-right">
                    {gap(d) > 0
                      ? <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-500">+{gap(d)}</Badge>
                      : <Badge variant="default">met</Badge>}
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

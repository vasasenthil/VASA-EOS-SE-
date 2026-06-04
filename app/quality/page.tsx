import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { QUALITY, qualitySummary, COMPLIANCE_AREAS } from "@/lib/quality"

const complianceVariant: Record<string, "default" | "secondary" | "destructive"> = {
  green: "default",
  amber: "secondary",
  red: "destructive",
}

export default function QualityPage() {
  const s = qualitySummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Quality Monitoring &amp; Inspection</PageHeaderHeading>
        <PageHeaderDescription>
          AI-prioritised inspections, a school quality index, and a compliance traffic-light across RTE, RPwD, DPDP,
          POCSO, POSH and FSSAI — moving from periodic to always-on quality assurance.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Schools</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.schools}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg quality index</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.avgIndex}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">High priority</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.highPriority}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Red compliance</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.red}</div></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>School Quality &amp; Inspection Queue</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead className="text-right">Quality Index</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Inspection</TableHead>
                <TableHead>Last inspected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {QUALITY.map((q) => (
                <TableRow key={q.udise}>
                  <TableCell className="font-medium">{q.name}</TableCell>
                  <TableCell className="text-right">{q.qualityIndex}</TableCell>
                  <TableCell><Badge variant={complianceVariant[q.compliance]}>{q.compliance}</Badge></TableCell>
                  <TableCell>{q.inspectionPriority === "high" ? <Badge variant="destructive">high</Badge> : q.inspectionPriority}</TableCell>
                  <TableCell className="text-muted-foreground">{q.lastInspected}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Compliance Areas</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {COMPLIANCE_AREAS.map((a) => (<Badge key={a} variant="outline">{a}</Badge>))}
          </div>
        </CardContent>
      </Card>
    </Shell>
  )
}

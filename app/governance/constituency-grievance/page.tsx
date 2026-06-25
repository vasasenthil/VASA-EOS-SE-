import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { attentionQueue, pending, resolutionRate, constituencyGrievanceSummary, RESOLUTION_THRESHOLD } from "@/lib/governance/constituency-grievance"

export default function ConstituencyGrievancePage() {
  const s = constituencyGrievanceSummary()
  const queue = attentionQueue()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Constituency Grievance Redress</PageHeaderHeading>
        <PageHeaderDescription>
          A Minister answers to constituencies. Education grievances are aggregated by Assembly constituency — received,
          resolved and pending — with a resolution rate, ordered worst-first so attention follows need. Average
          resolution {s.avgResolutionRate}%; {s.belowThreshold} constituencies are below the {RESOLUTION_THRESHOLD}%
          threshold.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/constituency-grievance/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.received}</div><div className="text-sm text-muted-foreground">Received</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.resolved}</div><div className="text-sm text-muted-foreground">Resolved</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.avgResolutionRate}%</div><div className="text-sm text-muted-foreground">Avg resolution rate</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-red-600 dark:text-red-500">{s.belowThreshold}</div><div className="text-sm text-muted-foreground">Below {RESOLUTION_THRESHOLD}%</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Constituency</TableHead>
                <TableHead>District</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Resolved</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead className="text-right">Resolution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((c) => {
                const rate = resolutionRate(c)
                return (
                  <TableRow key={c.constituency}>
                    <TableCell className="font-medium">{c.constituency}</TableCell>
                    <TableCell className="text-muted-foreground">{c.district}</TableCell>
                    <TableCell className="text-right">{c.received}</TableCell>
                    <TableCell className="text-right">{c.resolved}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{pending(c)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={rate < RESOLUTION_THRESHOLD ? "outline" : "default"} className={rate < RESOLUTION_THRESHOLD ? "border-red-500 text-red-600 dark:text-red-500" : ""}>
                        {rate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

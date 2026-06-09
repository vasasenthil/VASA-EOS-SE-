import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { TRACE_MATRIX, traceSummary, byRole, type TraceStatus } from "@/lib/traceability"

const STATUS_VARIANT: Record<TraceStatus, "default" | "secondary" | "destructive"> = {
  done: "default",
  partial: "secondary",
  planned: "destructive",
}

export default function TraceabilityPage() {
  const s = traceSummary()
  const groups = byRole()

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Requirements Traceability</PageHeaderHeading>
        <PageHeaderDescription>
          A verifiable map from stakeholder user stories to the modules that implement them and the tests that cover
          them. Representative across every role (not the full requirement catalogue); each row points at real files in
          this repository.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/traceability/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download matrix (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.total}</div><div className="text-sm text-muted-foreground">User stories</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.roles}</div><div className="text-sm text-muted-foreground">Roles covered</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.coveragePct}%</div><div className="text-sm text-muted-foreground">Stories with tests</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.done}/{s.partial}/{s.planned}</div><div className="text-sm text-muted-foreground">Done / partial / planned</div></CardContent></Card>
      </div>

      {groups.map((g) => (
        <Card key={g.role} className="mb-6">
          <CardContent className="pt-6">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-lg font-semibold">{g.role}</h2>
              <Badge variant="secondary">{g.items.length}</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead>User story</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {g.items.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-mono text-xs">{i.id}</TableCell>
                    <TableCell>{i.story}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{i.modules.join(", ")}</TableCell>
                    <TableCell className="font-mono text-xs">{i.route}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{i.tests.join(", ")}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[i.status]}>{i.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      <p className="text-sm text-muted-foreground">{TRACE_MATRIX.length} stories mapped. Add rows in <code>lib/traceability</code> as new user stories are implemented.</p>
    </Shell>
  )
}

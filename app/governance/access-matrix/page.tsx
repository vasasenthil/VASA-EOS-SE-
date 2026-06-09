import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { accessMatrix, matrixSummary, isElevated } from "@/lib/access/matrix"

export default function AccessMatrixPage() {
  const s = matrixSummary()
  const matrix = accessMatrix()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Role × Permission Access Matrix</PageHeaderHeading>
        <PageHeaderDescription>
          Who can do what across the {s.roles} portal roles — computed live from the Policy Decision Point, not a
          hand-maintained list. Each role's permitted actions are the actual output of the platform policy engine, so the
          matrix changes the moment a grant or deny rule changes. Elevated actions (marked) are time-boxed under CABAC.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/access-matrix/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.roles}</div><div className="text-sm text-muted-foreground">Portal roles</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.actions}</div><div className="text-sm text-muted-foreground">Distinct actions</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.elevatedActions}</div><div className="text-sm text-muted-foreground">Elevated (CABAC)</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Permitted actions</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matrix.map((r) => (
                <TableRow key={r.role}>
                  <TableCell className="font-medium">{r.role}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {r.actions.map((a) => (
                        <Badge key={a} variant={isElevated(a) ? "destructive" : "secondary"} className="font-mono text-[10px]">{a}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">{r.actions.length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

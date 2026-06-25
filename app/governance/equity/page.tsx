import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { EQUITY_DIMENSIONS, equitySummary, articlesOperationalised, type EquityStatus } from "@/lib/compliance/equity"

const STATUS_VARIANT: Record<EquityStatus, "default" | "secondary"> = {
  implemented: "default",
  partial: "secondary",
}

export default function EquityPage() {
  const s = equitySummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Social Justice as Architecture — 12 Equity Dimensions</PageHeaderHeading>
        <PageHeaderDescription>
          Equity operationalised, not aspirational: each dimension Tamil Nadu has a constitutional obligation to protect,
          mapped to the constitutional Articles it answers to and the component that evidences it. Status is honest —
          <strong> implemented</strong> where the mechanism is in code, <strong>partial</strong> where a dedicated module
          (e.g. a transgender self-identification portal) is still to be built. Every component reference is verified to exist.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/equity/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.dimensions}</div><div className="text-sm text-muted-foreground">Equity dimensions</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.implemented}</div><div className="text-sm text-muted-foreground">Implemented in code</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.articles}</div><div className="text-sm text-muted-foreground">Constitutional Articles</div></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dimension</TableHead>
                <TableHead>Protects</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead>Component</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EQUITY_DIMENSIONS.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="text-muted-foreground">{d.protects}</TableCell>
                  <TableCell className="text-xs">{d.articles.map((a) => <Badge key={a} variant="outline" className="mr-1">Art {a}</Badge>)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{d.controlRef}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[d.status]}>{d.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-2 text-lg font-semibold">Constitutional Articles operationalised ({s.articles})</h2>
          <div className="flex flex-wrap gap-1">
            {articlesOperationalised().map((a) => <Badge key={a} variant="secondary">Article {a}</Badge>)}
          </div>
        </CardContent>
      </Card>
    </Shell>
  )
}

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { inr } from "@/lib/finance"
import { prioritisedBudget, prioritySummary, type PriorityTier } from "@/lib/governance/budget-priorities"

const TIER_VARIANT: Record<PriorityTier, "default" | "secondary" | "outline"> = {
  flagship: "default",
  high: "secondary",
  standard: "outline",
}

export default function BudgetPrioritiesPage() {
  const s = prioritySummary()
  const rows = prioritisedBudget()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Executive Budget Priorities</PageHeaderHeading>
        <PageHeaderDescription>
          The Secretary sanctions; the Minister sets priorities. Each budget head is tagged flagship, high or standard,
          linked to the outcome it is meant to buy, and shown with its share of the total and its utilisation — so the
          spend can be read against the manifesto. {s.flagshipSharePct}% of the total goes to flagship priorities.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/budget-priorities/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{inr(s.totalAllocated)}</div><div className="text-sm text-muted-foreground">Total allocation</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.flagship}</div><div className="text-sm text-muted-foreground">Flagship priorities</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.flagshipSharePct}%</div><div className="text-sm text-muted-foreground">Share to flagship</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Budget head</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">Allocated</TableHead>
                <TableHead className="text-right">Share</TableHead>
                <TableHead className="text-right">Utilisation</TableHead>
                <TableHead>Outcome it buys</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.head}>
                  <TableCell className="font-medium">{p.head}</TableCell>
                  <TableCell><Badge variant={TIER_VARIANT[p.tier]}>{p.tier}</Badge></TableCell>
                  <TableCell className="text-right">{inr(p.allocated)}</TableCell>
                  <TableCell className="text-right">{p.sharePct}%</TableCell>
                  <TableCell className="text-right text-muted-foreground">{p.utilisationPct}%</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.rationale}<div className="font-mono text-xs">{p.outcomeRef}</div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

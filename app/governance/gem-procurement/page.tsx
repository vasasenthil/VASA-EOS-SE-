import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { inr } from "@/lib/finance"
import { GEM_PROCUREMENTS, l1Bid, savingsPct, gemSummary, type GemStatus } from "@/lib/procurement/gem"

const STATUS_VARIANT: Record<GemStatus, "default" | "secondary" | "outline"> = {
  awarded: "default",
  "bids-received": "secondary",
  published: "secondary",
  draft: "outline",
}

export default function GemProcurementPage() {
  const s = gemSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>GeM Procurement</PageHeaderHeading>
        <PageHeaderDescription>
          Public procurement on the Government e-Marketplace runs the L1 principle — among technically qualified bids,
          the lowest price wins. Each tender shows its L1 award and the saving against the pre-bid estimate, so
          value-for-money is visible. {s.awarded} of {s.procurements} tenders awarded; total saving against estimate
          {" "}<strong>{inr(s.totalSavings)}</strong>.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/gem-procurement/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.procurements}</div><div className="text-sm text-muted-foreground">Tenders</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.awarded}</div><div className="text-sm text-muted-foreground">Awarded</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{inr(s.totalAwarded)}</div><div className="text-sm text-muted-foreground">Awarded value</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{inr(s.totalSavings)}</div><div className="text-sm text-muted-foreground">Saved vs estimate</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tender</TableHead>
                <TableHead className="text-right">Estimate</TableHead>
                <TableHead>L1 vendor</TableHead>
                <TableHead className="text-right">L1 price</TableHead>
                <TableHead className="text-right">Saving</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {GEM_PROCUREMENTS.map((p) => {
                const l1 = l1Bid(p)
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.item}</div>
                      <div className="font-mono text-xs text-muted-foreground">{p.id} · {p.category}</div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{inr(p.estimatedValue)}</TableCell>
                    <TableCell className="text-sm">{l1?.vendor ?? "—"}</TableCell>
                    <TableCell className="text-right">{l1 ? inr(l1.price) : "—"}</TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-500">{l1 ? `${savingsPct(p)}%` : "—"}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge></TableCell>
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

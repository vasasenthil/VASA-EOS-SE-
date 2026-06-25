import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { INVENTORY, INDENTS, procurementSummary } from "@/lib/procurement"

const indentVariant: Record<string, "default" | "secondary" | "outline"> = {
  raised: "secondary",
  on_gem: "outline",
  delivered: "default",
}

export default function ProcurementPage() {
  const s = procurementSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Inventory &amp; Procurement</PageHeaderHeading>
        <PageHeaderDescription>
          GeM-based procurement, indent management and stock for free-item distribution (textbooks, uniforms, cycles,
          laptops) with last-mile reconciliation.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">SKUs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.skus}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Below reorder</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.belowReorder}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Open indents</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.openIndents}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Inventory</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Item</TableHead><TableHead className="text-right">In stock</TableHead><TableHead className="text-right">Reorder at</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {INVENTORY.map((i) => (
                  <TableRow key={i.item}>
                    <TableCell className="font-medium">{i.item}</TableCell>
                    <TableCell className="text-right">
                      {i.inStock <= i.reorderAt ? <Badge variant="destructive">{i.inStock}</Badge> : i.inStock}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{i.reorderAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Indents (GeM)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>ID</TableHead><TableHead>Item</TableHead><TableHead className="text-right">Qty</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {INDENTS.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-mono text-xs">{i.id}</TableCell>
                    <TableCell>{i.item}</TableCell>
                    <TableCell className="text-right">{i.qty}</TableCell>
                    <TableCell><Badge variant={indentVariant[i.status]}>{i.status.replace("_", " ")}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

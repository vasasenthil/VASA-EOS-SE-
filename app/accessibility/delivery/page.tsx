import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { DELIVERY_CAPABILITIES, GEOGRAPHIES, tamilDialects, deliverySummary, type DeliveryStatus } from "@/lib/accessibility/delivery"

const STATUS_VARIANT: Record<DeliveryStatus, "default" | "secondary" | "outline"> = {
  enforced: "default",
  partial: "secondary",
  infra: "outline",
}

export default function DeliveryPage() {
  const s = deliverySummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Last-Mile Delivery — Closing the Digital Divide</PageHeaderHeading>
        <PageHeaderDescription>
          Designed for Tamil Nadu's real conditions, not Silicon Valley's assumptions: intermittent connectivity,
          unreliable power, low-literacy guardians, basic devices, dialect diversity and seasonal disruption. Each
          capability attacks a specific barrier. Most are runtime / edge infrastructure provisioned at deploy, so they are
          shown honestly as <strong>infra</strong> or <strong>partial</strong> — not overclaimed.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/accessibility/delivery/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.capabilities}</div><div className="text-sm text-muted-foreground">Delivery capabilities</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.barriersCovered}</div><div className="text-sm text-muted-foreground">Barriers addressed</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.geographies}</div><div className="text-sm text-muted-foreground">Geographies served</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.tamilDialects}</div><div className="text-sm text-muted-foreground">Tamil dialects</div></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capability</TableHead>
                <TableHead>What it does</TableHead>
                <TableHead>Barriers</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DELIVERY_CAPABILITIES.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.capability}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.barriers.join(", ")}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="mb-3 text-lg font-semibold">Geographies served</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {GEOGRAPHIES.map((g) => (
              <div key={g.id} className="rounded-lg border p-3">
                <div className="font-medium">{g.name}</div>
                <div className="text-sm text-muted-foreground">{g.note}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-2 text-lg font-semibold">Tamil dialects recognised ({s.tamilDialects})</h2>
          <div className="flex flex-wrap gap-1">
            {tamilDialects().map((d) => <Badge key={d} variant="secondary">{d}</Badge>)}
          </div>
        </CardContent>
      </Card>
    </Shell>
  )
}

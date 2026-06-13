import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import {
  NDEAR_S_CATEGORIES,
  byCategory,
  ndearSSummary,
  type NdearSStatus,
} from "@/lib/integrations/ndear-s"

const STATUS_VARIANT: Record<NdearSStatus, "default" | "secondary" | "outline"> = {
  built: "default",
  "federated-seam": "secondary",
  pending: "outline",
}

export default function NdearSPage() {
  const s = ndearSSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>NDEAR-S — 29 Building Blocks</PageHeaderHeading>
        <PageHeaderDescription>
          The Schools profile of the National Digital Education Architecture, unbundled into 29 building blocks. All{" "}
          <strong>{s.total}/{s.total} are addressed</strong> ({s.built} built in-repo · {s.federatedSeam} live-ready
          federated seams · {s.pending} pending) — {s.builtPct}% built. &ldquo;Federated seam&rdquo; means a typed
          adapter to a national registry (DIKSHA / UDISE+ / APAAR / PFMS / DigiLocker / Bhashini), mock by default and
          live when configured — the State federates with them, it does not re-implement them. Every row cites a real
          component.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/ndear-s/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      {NDEAR_S_CATEGORIES.map((cat) => (
        <Card key={cat} className="mb-4">
          <CardContent className="pt-6">
            <div className="mb-3 text-sm font-semibold">{cat}</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Building block</TableHead>
                  <TableHead>Component</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byCategory(cat).map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="text-muted-foreground">{b.n}</TableCell>
                    <TableCell className="font-medium">{b.name}<div className="text-xs font-normal text-muted-foreground">{b.requirement}</div></TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{b.componentRef || "—"}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[b.status]}>{b.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </Shell>
  )
}

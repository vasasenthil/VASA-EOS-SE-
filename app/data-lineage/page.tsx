import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { SOURCE_SYSTEMS, byLayer, lineageSummary, datasetById, type Layer } from "@/lib/data/lineage"

const LAYERS: { id: Layer; label: string; note: string }[] = [
  { id: "bronze", label: "Bronze", note: "Raw, immutable — 1:1 from a source system" },
  { id: "silver", label: "Silver", note: "Cleaned, conformed, joined" },
  { id: "gold", label: "Gold", note: "Business-ready / ML products" },
]

function upstreamLabel(id: string): string {
  return datasetById(id)?.name ?? SOURCE_SYSTEMS.find((s) => s.id === id)?.name ?? id
}

export default function DataLineagePage() {
  const s = lineageSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Data Lineage — Bronze · Silver · Gold</PageHeaderHeading>
        <PageHeaderDescription>
          The medallion lakehouse made concrete: source systems of record ingested to Bronze, conformed to Silver, and
          modelled to Gold analytics/ML products (dropout-risk, learning-gap, scheme-leakage). The dbt-style model graph
          as inspectable data — every dataset traces back to its sources, and PII is tracked through each layer.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/data-lineage/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-5">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.sources}</div><div className="text-sm text-muted-foreground">Source systems</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.bronze}</div><div className="text-sm text-muted-foreground">Bronze</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.silver}</div><div className="text-sm text-muted-foreground">Silver</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.gold}</div><div className="text-sm text-muted-foreground">Gold</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-destructive">{s.piiDatasets}</div><div className="text-sm text-muted-foreground">PII datasets</div></CardContent></Card>
      </div>

      {LAYERS.map((layer) => (
        <Card key={layer.id} className="mb-6">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold capitalize">{layer.label}</h2>
            <p className="mb-3 text-sm text-muted-foreground">{layer.note}</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dataset</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Derived from</TableHead>
                  <TableHead>PII</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byLayer(layer.id).map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}<div className="text-xs text-muted-foreground">{d.description}</div></TableCell>
                    <TableCell className="text-muted-foreground">{d.store}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{d.upstream.map(upstreamLabel).join(", ")}</TableCell>
                    <TableCell>{d.pii ? <Badge variant="destructive">PII</Badge> : <Badge variant="secondary">none</Badge>}</TableCell>
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

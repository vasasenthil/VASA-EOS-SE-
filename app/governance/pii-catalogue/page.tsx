import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { PII_CATALOGUE, piiSummary, type Sensitivity } from "@/lib/consent/pii-catalogue"

const SEV_VARIANT: Record<Sensitivity, "secondary" | "destructive" | "default"> = {
  normal: "secondary",
  sensitive: "destructive",
  child: "default",
}

export default function PiiCataloguePage() {
  const s = piiSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>PII Data Classification (DPDP)</PageHeaderHeading>
        <PageHeaderDescription>
          Every personal-data class the platform handles — its sensitivity, the consent purpose that gates reads of it,
          the lawful basis under the DPDP Act 2023, retention, and where it is stored. Getters look up the gating purpose
          here and enforce it via the consent gate.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/governance/dpia">
              View DPIA scaffold
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/api/governance/pii-catalogue/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.classes}</div><div className="text-sm text-muted-foreground">Data classes</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-destructive">{s.sensitive}</div><div className="text-sm text-muted-foreground">Sensitive</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.child}</div><div className="text-sm text-muted-foreground">Children's data</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.consentGated}</div><div className="text-sm text-muted-foreground">Consent-gated</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data class</TableHead>
                <TableHead>Sensitivity</TableHead>
                <TableHead>Gating purpose</TableHead>
                <TableHead>Lawful basis</TableHead>
                <TableHead>Retention</TableHead>
                <TableHead>Stored in</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PII_CATALOGUE.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.dataClass}<div className="text-xs text-muted-foreground">{p.examples}</div></TableCell>
                  <TableCell><Badge variant={SEV_VARIANT[p.sensitivity]}>{p.sensitivity}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{p.purpose}</TableCell>
                  <TableCell className="text-muted-foreground">{p.basis}</TableCell>
                  <TableCell className="text-muted-foreground">{p.retention}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.storedIn}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

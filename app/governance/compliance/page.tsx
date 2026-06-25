import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, ArrowUpRight } from "lucide-react"
import { complianceDomains, complianceIndexSummary } from "@/lib/compliance"

export default function CompliancePage() {
  const s = complianceIndexSummary()
  const domains = complianceDomains()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Compliance &amp; Standards Index</PageHeaderHeading>
        <PageHeaderDescription>
          One posture view of every standards and assurance register the platform exposes — architecture conformance,
          NDEAR, threat model, AI guardrails, DPIA, PII, assurance, accessibility (RPwD / languages / channels), data
          lineage and DR. Each row's numbers are drawn live from the underlying register; each links to the full,
          inspectable evidence. Every register and its page are verified to exist by tests.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/compliance/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download index (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.domains}</div><div className="text-sm text-muted-foreground">Standards & assurance registers</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.evidenceItems}</div><div className="text-sm text-muted-foreground">Evidence items (live count)</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.pillars}</div><div className="text-sm text-muted-foreground">Pillars evidenced</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Register</TableHead>
                <TableHead>Pillar</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Inspect</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domains.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell><Badge variant="secondary">{d.pillar}</Badge></TableCell>
                  <TableCell className="font-mono">{d.items}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{d.headline}</TableCell>
                  <TableCell>
                    <a className="inline-flex items-center text-sm underline" href={d.route}>
                      Open <ArrowUpRight className="ml-1 h-3 w-3" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

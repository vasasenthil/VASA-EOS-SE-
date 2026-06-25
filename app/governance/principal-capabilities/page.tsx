import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { PRINCIPAL_CAPABILITIES, principalCapabilitySummary, type CapabilityStatus } from "@/lib/governance/principal-capabilities"

const STATUS_VARIANT: Record<CapabilityStatus, "default" | "secondary" | "outline"> = {
  built: "default",
  partial: "secondary",
  pending: "outline",
}

export default function PrincipalCapabilitiesPage() {
  const s = principalCapabilitySummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Head (Principal) — Capability Coverage</PageHeaderHeading>
        <PageHeaderDescription>
          The honest answer to &ldquo;is every school-head feature built?&rdquo; — inspectable, not asserted. The
          Principal runs the school at the bottom of the tenancy tree. Each responsibility maps to the in-repo feature
          that delivers it: <strong>built</strong> ({s.built}), <strong>partial</strong> ({s.partial}) or
          <strong> pending</strong> ({s.pending}). All {s.capabilities} responsibilities now have a dedicated feature.
          &ldquo;Built&rdquo; means a purpose-built, tested feature exists — not that it is wired to live data; that
          platform-wide caveat still holds. A test keeps status and feature consistent.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/principal-capabilities/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.capabilities}</div><div className="text-sm text-muted-foreground">Responsibilities mapped</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.built}</div><div className="text-sm text-muted-foreground">Built</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.partial}</div><div className="text-sm text-muted-foreground">Partial</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-muted-foreground">{s.pending}</div><div className="text-sm text-muted-foreground">Pending (honest gaps)</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dimension</TableHead>
                <TableHead>Responsibility</TableHead>
                <TableHead>Feature</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PRINCIPAL_CAPABILITIES.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-xs uppercase tracking-wide text-muted-foreground">{c.dimension}</TableCell>
                  <TableCell className="font-medium">
                    {c.route ? <a href={c.route} className="hover:underline">{c.responsibility}</a> : c.responsibility}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.featureRef || "—"}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

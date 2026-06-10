import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { SECRETARY_CAPABILITIES, secretaryCapabilitySummary, type CapabilityStatus } from "@/lib/governance/secretary-capabilities"

const STATUS_VARIANT: Record<CapabilityStatus, "default" | "secondary" | "outline"> = {
  built: "default",
  partial: "secondary",
  pending: "outline",
}

export default function SecretaryCapabilitiesPage() {
  const s = secretaryCapabilitySummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Secretary — Capability Coverage</PageHeaderHeading>
        <PageHeaderDescription>
          The honest answer to &ldquo;is every Secretary, School Education feature built?&rdquo; — made inspectable, not
          asserted. Each general, technical and functional responsibility of the office is mapped to the in-repo feature
          that delivers it, with a candid status: <strong>built</strong> (working slice on seeded data),
          <strong> partial</strong> (exists but Secretary-tier depth pending) or <strong>pending</strong> (not yet built,
          and therefore referencing no feature). It is <strong>not</strong> a claim of completeness: {s.pending} responsibilities
          are openly marked pending. A test asserts every built/partial feature exists on disk and that every pending item
          references nothing — so this page can never overstate coverage.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/secretary-capabilities/csv" download>
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
              {SECRETARY_CAPABILITIES.map((c) => (
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

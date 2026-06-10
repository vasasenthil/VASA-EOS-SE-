import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { TIERS, byTier, coverageByTier, tierCoverageSummary, type TierCapability } from "@/lib/governance/tier-coverage"
import type { CapabilityStatus } from "@/lib/governance/role-capabilities"

const STATUS_VARIANT: Record<CapabilityStatus, "default" | "secondary" | "outline"> = {
  built: "default",
  partial: "secondary",
  pending: "outline",
}

function Row({ c }: { c: TierCapability }) {
  return (
    <TableRow>
      <TableCell className="text-xs uppercase tracking-wide text-muted-foreground">{c.dimension}</TableCell>
      <TableCell className="font-medium">
        {c.route ? <a href={c.route} className="hover:underline">{c.responsibility}</a> : c.responsibility}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{c.role}</TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">{c.featureRef || "—"}</TableCell>
      <TableCell><Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge></TableCell>
    </TableRow>
  )
}

export default function TierCoveragePage() {
  const s = tierCoverageSummary()
  const cov = coverageByTier()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Org-chart Coverage — Every Tier</PageHeaderHeading>
        <PageHeaderDescription>
          The omission-free answer to &ldquo;are general/technical/functional features built across State/Executive,
          every Directorate, District, Block, Cluster, School and the Citizen?&rdquo; — an inspectable inventory, not a
          claim. Each tier maps representative capabilities to the in-repo feature that delivers them, honestly marked
          built/partial/pending. Every tier is now represented with core features and its own honest capability register
          — {s.built} of {s.capabilities} built ({s.builtPct}%) across {s.tiers} tiers. This measures tier representation,
          not total completion: drill into each role register (Secretary, Minister, Director, School Head) for the
          remaining per-role partials and pending items.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/tier-coverage/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cov.map((t) => (
          <Card key={t.tier}>
            <CardContent className="py-4">
              <div className="flex items-baseline justify-between">
                <div className="text-sm font-medium">{t.tier}</div>
                <div className="text-sm font-semibold">{t.builtPct}%</div>
              </div>
              <Progress value={t.builtPct} className="mt-2" />
              <div className="mt-1 text-xs text-muted-foreground">{t.built} built · {t.partial} partial · {t.pending} pending</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {TIERS.map((tier) => (
        <Card key={tier} className="mb-4">
          <CardContent className="pt-6">
            <div className="mb-3 text-sm font-semibold">{tier}</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dimension</TableHead>
                  <TableHead>Capability</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Feature</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byTier(tier).map((c, i) => <Row key={i} c={c} />)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </Shell>
  )
}

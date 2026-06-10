import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { CATALOGUE_MODULES, MODULE_TIERS, byTier, coverageByTier, catalogueSummary, type ModuleStatus } from "@/lib/governance/module-catalogue"

const STATUS_VARIANT: Record<ModuleStatus, "default" | "secondary" | "outline"> = {
  built: "default",
  partial: "secondary",
  pending: "outline",
}

export default function ModuleCataloguePage() {
  const s = catalogueSummary()
  const cov = coverageByTier()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Module Catalogue v3.0 — Coverage Map</PageHeaderHeading>
        <PageHeaderDescription>
          The VASA Infotech Unified Module Catalogue v3.0 specifies ~{s.catalogueTotal} core modules across the seven
          operational tiers plus a cross-cutting Platform tier. This maps a representative, grounded subset of {s.mapped}
          {" "}of them to the in-repo evidence that delivers each, with an honest built / partial / pending status — it is
          <strong> not</strong> a claim that all {s.catalogueTotal} are built. Of the {s.mapped} mapped: {s.built} built ·
          {" "}{s.partial} partial · {s.pending} pending ({s.builtPct}% built, {s.coveragePct}% weighted coverage). Every
          built/partial row cites a real file; pending rows cite nothing.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/module-catalogue/csv" download>
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

      {MODULE_TIERS.map((tier) => (
        <Card key={tier} className="mb-4">
          <CardContent className="pt-6">
            <div className="mb-3 text-sm font-semibold">{tier} tier</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Repo evidence</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byTier(tier).map((m, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{m.repoRef || "—"}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[m.status]}>{m.status}</Badge></TableCell>
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

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import {
  WCAG_PRINCIPLES,
  byPrinciple,
  levelConformance,
  type ConformanceStatus,
  type ConformanceMethod,
} from "@/lib/accessibility/conformance"

const STATUS_VARIANT: Record<ConformanceStatus, "default" | "secondary" | "outline"> = {
  pass: "default",
  partial: "secondary",
  "audit-required": "outline",
}
const METHOD_LABEL: Record<ConformanceMethod, string> = { automated: "automated", design: "design-system", audit: "AT/manual audit" }

export default function WcagPage() {
  const lc = levelConformance()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>WCAG 2.1 Conformance Map</PageHeaderHeading>
        <PageHeaderDescription>
          An honest, per-success-criterion view of WCAG 2.1 (A · AA · AAA). Criteria are met by automated audit
          (CI-enforced, zero HIGH findings across all routes) or by the design system; criteria that need
          assistive-technology / manual verification are marked <strong>audit-required</strong>, not claimed as passing.
          The <strong>AAA bar is not fully met by static checks</strong> — a commissioned WCAG audit + AT QA is tracked
          (honestly not-started) in the assurance register.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/wcag/csv" download><Download className="mr-2 h-4 w-4" />Download (CSV)</a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {lc.map((l) => (
          <Card key={l.level}>
            <CardContent className="py-4">
              <div className="flex items-baseline justify-between">
                <div className="text-sm font-medium">Level {l.level}</div>
                <div className="text-sm font-semibold">{l.metPct}% met</div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{l.pass} met · {l.auditRequired} audit-required · {l.total} mapped</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {WCAG_PRINCIPLES.map((p) => (
        <Card key={p} className="mb-4">
          <CardContent className="pt-6">
            <div className="mb-3 text-sm font-semibold">{p}</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">SC</TableHead>
                  <TableHead className="w-14">Level</TableHead>
                  <TableHead>Criterion</TableHead>
                  <TableHead>How addressed</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byPrinciple(p).map((c) => (
                  <TableRow key={c.sc}>
                    <TableCell className="font-mono text-xs">{c.sc}</TableCell>
                    <TableCell><Badge variant="outline">{c.level}</Badge></TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.how}</TableCell>
                    <TableCell className="text-xs">{METHOD_LABEL[c.method]}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge></TableCell>
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

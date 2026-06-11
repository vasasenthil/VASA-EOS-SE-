import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import {
  BROCHURE_CLAIMS,
  BROCHURE_AREAS,
  BROCHURE_CODE,
  byArea,
  brochureSummary,
  type BrochureStatus,
} from "@/lib/governance/brochure-coverage"

const STATUS_VARIANT: Record<BrochureStatus, "default" | "secondary" | "outline"> = {
  built: "default",
  partial: "secondary",
  pending: "outline",
}

export default function BrochureCoveragePage() {
  const s = brochureSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Condensed Brochure ({BROCHURE_CODE}) — Honest Coverage Map</PageHeaderHeading>
        <PageHeaderDescription>
          An unbiased map of the seven-page condensed brochure&apos;s headline claims to the in-repo evidence that
          delivers each. This is a working <strong>reference implementation</strong>, not the provisioned sovereign
          national-scale platform the brochure markets. Of {s.total} headline claims: {s.built} built · {s.partial}{" "}
          partial · {s.pending} pending — <strong>{s.coveragePct}% weighted structural coverage</strong> (built = 1,
          partial = ½). Major sovereign-grade gaps (AI engines, live federation, HSM/escrow/off-switch, multi-cloud,
          1.27-crore scale) are disclosed plainly. Every built/partial row cites a real file; pending rows cite nothing.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/brochure-coverage/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <div className="text-sm font-medium">Weighted coverage</div>
            <div className="mt-1 text-2xl font-bold">{s.coveragePct}%</div>
            <Progress value={s.coveragePct} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-sm font-medium">Status</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {s.built} built · {s.partial} partial · {s.pending} pending of {s.total}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-sm font-medium">Honesty</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Built/partial cite real files (asserted on disk by tests); pending cite nothing.
            </div>
          </CardContent>
        </Card>
      </div>

      {BROCHURE_AREAS.map((area) => (
        <Card key={area} className="mb-4">
          <CardContent className="pt-6">
            <div className="mb-3 text-sm font-semibold">{area}</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[28%]">Brochure claim</TableHead>
                  <TableHead>What is actually delivered</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byArea(area).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.claim}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.note}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
      <p className="text-xs text-muted-foreground">
        {BROCHURE_CLAIMS.length} headline claims mapped. See also the Module Catalogue and Launch-Readiness registers.
      </p>
    </Shell>
  )
}

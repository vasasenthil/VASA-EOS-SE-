import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { FIN_TRANSPARENCY_CONTROLS, finTransparencySummary, type FinTransparencyStatus } from "@/lib/finance/transparency"

const STATUS_VARIANT: Record<FinTransparencyStatus, "default" | "secondary"> = {
  enforced: "default",
  partial: "secondary",
}

export default function FinancialTransparencyPage() {
  const s = finTransparencySummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Financial Transparency</PageHeaderHeading>
        <PageHeaderDescription>
          Public money belongs in public view. Where leakage prevention stops fraud, this register makes the purse
          legible — visible budgets, live utilisation, direct transfer, open procurement, disclosed fees, traceable
          scholarships, accounted assets, community oversight, statutory audit and the right to information — each
          mapped to the in-repo mechanism that delivers it and the framework it answers to (PFMS, IFHRMS, CAG, GeM,
          DBT, RTI). Statutory audit and RTI disclosure are enforced today; principles needing a live government rail
          (PFMS utilisation feed, DBT-APBS) are honestly <strong>partial</strong>. Every component reference is verified to exist.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/financial-transparency/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.controls}</div><div className="text-sm text-muted-foreground">Accountability principles</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.enforced}</div><div className="text-sm text-muted-foreground">Enforced in code</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.frameworksCovered}</div><div className="text-sm text-muted-foreground">Frameworks answered to</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Accountability principle</TableHead>
                <TableHead>Framework</TableHead>
                <TableHead>Mechanism</TableHead>
                <TableHead>Component</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FIN_TRANSPARENCY_CONTROLS.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.principle}</TableCell>
                  <TableCell className="text-muted-foreground">{c.framework}</TableCell>
                  <TableCell className="text-muted-foreground">{c.mechanism}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.controlRef}</TableCell>
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

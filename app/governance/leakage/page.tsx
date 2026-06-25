import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { LEAKAGE_CONTROLS, leakageSummary, type LeakageStatus } from "@/lib/compliance/leakage"

const STATUS_VARIANT: Record<LeakageStatus, "default" | "secondary"> = {
  enforced: "default",
  partial: "secondary",
}

export default function LeakagePage() {
  const s = leakageSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Welfare Leakage Prevention</PageHeaderHeading>
        <PageHeaderDescription>
          Every rupee must reach every child. Each leakage and fraud vector — ghost beneficiaries, double-claims,
          cross-scheme fraud, middlemen, record tampering and opacity — mapped to the control that closes it. The
          tamper-evident CAG-ready ledger is enforced today; controls needing a live provider (Aadhaar dedup, DBT-APBS)
          are honestly <strong>partial</strong> until credentials are wired. Every component reference is verified to exist.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/leakage/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.controls}</div><div className="text-sm text-muted-foreground">Leakage controls</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.enforced}</div><div className="text-sm text-muted-foreground">Enforced in code</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.targetLeakageReductionPct}%</div><div className="text-sm text-muted-foreground">Target leakage reduction</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leakage / fraud vector</TableHead>
                <TableHead>Control</TableHead>
                <TableHead>Component</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LEAKAGE_CONTROLS.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.vector}</TableCell>
                  <TableCell className="text-muted-foreground">{c.control}</TableCell>
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

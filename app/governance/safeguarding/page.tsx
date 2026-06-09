import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { SAFEGUARDING_CONTROLS, safeguardingSummary, type SafeguardingStatus } from "@/lib/safety/safeguarding"

const STATUS_VARIANT: Record<SafeguardingStatus, "default" | "secondary"> = {
  enforced: "default",
  partial: "secondary",
}

export default function SafeguardingPage() {
  const s = safeguardingSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Child Safeguarding Controls</PageHeaderHeading>
        <PageHeaderDescription>
          A school OS carries a duty of care no other government system does — the children are physically in our
          charge every day. Each child-safety risk — stranger access, blind spots, peer abuse, unreported harm, unsafe
          transport, campus hazards, emergencies, record tampering, child-PII misuse and undetected ill-health — is
          mapped to the control that discharges it and the statute it satisfies (POCSO, JJ Act, RTE, DPDP). POCSO
          mandatory reporting and the tamper-evident ledger are enforced today; controls needing a live feed
          (CCTV, GPS, health) are honestly <strong>partial</strong>. Every component reference is verified to exist.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/safeguarding/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.controls}</div><div className="text-sm text-muted-foreground">Safeguarding controls</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.enforced}</div><div className="text-sm text-muted-foreground">Enforced in code</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.statutesCovered}</div><div className="text-sm text-muted-foreground">Statutory duties discharged</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Child-safety risk</TableHead>
                <TableHead>Statute</TableHead>
                <TableHead>Control</TableHead>
                <TableHead>Component</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SAFEGUARDING_CONTROLS.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.risk}</TableCell>
                  <TableCell className="text-muted-foreground">{c.statute}</TableCell>
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

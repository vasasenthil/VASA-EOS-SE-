import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { RTE_ENTITLEMENTS, rteEntitlementSummary, type RteEntitlementStatus } from "@/lib/compliance/rte-entitlements"

const STATUS_VARIANT: Record<RteEntitlementStatus, "default" | "secondary"> = {
  enforced: "default",
  partial: "secondary",
}

export default function RteEntitlementsPage() {
  const s = rteEntitlementSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>RTE Act Entitlements</PageHeaderHeading>
        <PageHeaderDescription>
          The Right to Education Act 2009 turns Article 21A into enforceable entitlements — free & compulsory schooling
          6–14, a 25% EWS/DG quota, no screening or capitation, no detention or expulsion, §19 infrastructure norms,
          qualified teachers, a parent-majority SMC, neighbourhood access and a transfer certificate that cannot be
          withheld. Each is mapped to the in-repo mechanism that enforces it, with its RTE section. The 25% quota and
          the tamper-evident ledger are enforced today; entitlements needing real rosters or census (PTR, OOSC
          mainstreaming) are honestly <strong>partial</strong>. Every component reference is verified to exist.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/rte-entitlements/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.entitlements}</div><div className="text-sm text-muted-foreground">RTE entitlements</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.enforced}</div><div className="text-sm text-muted-foreground">Enforced in code</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.sectionsCovered}</div><div className="text-sm text-muted-foreground">RTE sections enforced</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entitlement</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Mechanism</TableHead>
                <TableHead>Component</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RTE_ENTITLEMENTS.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.entitlement}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{e.section}</TableCell>
                  <TableCell className="text-muted-foreground">{e.mechanism}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{e.controlRef}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[e.status]}>{e.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

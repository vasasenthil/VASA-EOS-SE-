import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { COORDINATION_INITIATIVES, coordinationSummary, type InitiativeStatus } from "@/lib/governance/coordination"

const STATUS_VARIANT: Record<InitiativeStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  proposed: "secondary",
  completed: "outline",
}

export default function CoordinationPage() {
  const s = coordinationSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Inter-departmental &amp; CSR Coordination</PageHeaderHeading>
        <PageHeaderDescription>
          The Secretary&apos;s convergence desk. No school-education outcome is delivered by one department alone — child
          health rides on Health &amp; Family Welfare, nutrition on Social Welfare, scholarships on Adi Dravidar Welfare,
          money on Finance, buildings on Rural Development — while CSR foundations, multilaterals and CSOs fund the edges.
          Each convergence initiative names the partner, the shared purpose and the in-repo module it actually touches;
          every linked module is verified to exist, so the desk can never list a partnership with no platform footprint.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/coordination/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.initiatives}</div><div className="text-sm text-muted-foreground">Initiatives</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.active}</div><div className="text-sm text-muted-foreground">Active</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.departments}</div><div className="text-sm text-muted-foreground">Partner departments</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.externalPartners}</div><div className="text-sm text-muted-foreground">CSR / multilateral / CSO</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Initiative</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Convergence purpose</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COORDINATION_INITIATIVES.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.title}</TableCell>
                  <TableCell className="text-muted-foreground">{i.partner}</TableCell>
                  <TableCell className="text-xs uppercase tracking-wide text-muted-foreground">{i.partnerType}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{i.purpose}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{i.linkedModule}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[i.status]}>{i.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

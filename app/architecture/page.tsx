import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { PILLARS, archSummary, type PillarStatus } from "@/lib/architecture"
import { SLO_TARGETS, DR_TIERS, BACKUP_CADENCE, postureSummary } from "@/lib/ops-posture"

const STATUS_VARIANT: Record<PillarStatus, "default" | "secondary" | "destructive"> = {
  implemented: "default",
  partial: "secondary",
  "infra-pending": "destructive",
}

export default function ArchitecturePage() {
  const s = archSummary()
  const p = postureSummary()

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Architecture Conformance (SAO-TN-001)</PageHeaderHeading>
        <PageHeaderDescription>
          The seven pillars of the System Architecture Overview mapped to the components that implement them in this
          repository — with an honest status and the remaining gap for each. Every component points at a real path.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/architecture/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download matrix (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.pillars}</div><div className="text-sm text-muted-foreground">Architecture pillars</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.components}</div><div className="text-sm text-muted-foreground">Mapped components</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.implemented}</div><div className="text-sm text-muted-foreground">Pillars implemented</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.partial}</div><div className="text-sm text-muted-foreground">Partial (depth/infra)</div></CardContent></Card>
      </div>

      {PILLARS.map((pillar) => (
        <Card key={pillar.id} className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>{pillar.name}</CardTitle>
              <Badge variant={STATUS_VARIANT[pillar.status]}>{pillar.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{pillar.commitment}</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead>Path</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pillar.components.map((c) => (
                  <TableRow key={c.ref}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{c.ref}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {pillar.gap ? <p className="mt-3 text-sm"><span className="font-medium">Remaining gap:</span> <span className="text-muted-foreground">{pillar.gap}</span></p> : null}
          </CardContent>
        </Card>
      ))}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Operations posture — Service levels (SLO)</CardTitle>
          <p className="text-sm text-muted-foreground">{p.slos} objectives declared.</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Service</TableHead><TableHead>Objective</TableHead><TableHead>Target</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {SLO_TARGETS.map((t) => (
                <TableRow key={t.service}>
                  <TableCell className="font-medium">{t.service}</TableCell>
                  <TableCell className="text-muted-foreground">{t.objective}</TableCell>
                  <TableCell>{t.target}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operations posture — Disaster recovery (RPO / RTO)</CardTitle>
          <p className="text-sm text-muted-foreground">{BACKUP_CADENCE}</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Scenario</TableHead><TableHead>RPO</TableHead><TableHead>RTO</TableHead><TableHead>Strategy</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {DR_TIERS.map((d) => (
                <TableRow key={d.scenario}>
                  <TableCell className="font-medium">{d.scenario}</TableCell>
                  <TableCell>{d.rpo}</TableCell>
                  <TableCell>{d.rto}</TableCell>
                  <TableCell className="text-muted-foreground">{d.strategy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

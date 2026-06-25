import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import {
  SEVERITY_LEVELS,
  ON_CALL_ROLES,
  RUNBOOKS,
  runbookSummary,
  severityById,
  type Severity,
} from "@/lib/ops-posture/runbook"
import { DR_TIERS } from "@/lib/ops-posture"

const SEV_VARIANT: Record<Severity, "destructive" | "default" | "secondary"> = {
  SEV1: "destructive",
  SEV2: "default",
  SEV3: "secondary",
  SEV4: "secondary",
}

export default function RunbookPage() {
  const s = runbookSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Disaster-Recovery Runbook &amp; On-Call</PageHeaderHeading>
        <PageHeaderDescription>
          The operational companion to the DR posture: an incident severity / SLA matrix, the on-call roster, and an
          ordered recovery runbook for each declared DR scenario (RPO/RTO targets live on the ops posture model). Every
          runbook is bound to a DR scenario and every step names a responsible role.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/ops/runbook/markdown" download>
              <Download className="mr-2 h-4 w-4" />
              Download runbook (Markdown)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.runbooks}</div><div className="text-sm text-muted-foreground">Recovery runbooks</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.drScenariosCovered}/{DR_TIERS.length}</div><div className="text-sm text-muted-foreground">DR scenarios covered</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.onCallRoles}</div><div className="text-sm text-muted-foreground">On-call roles</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.steps}</div><div className="text-sm text-muted-foreground">Recovery steps</div></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="mb-3 text-lg font-semibold">Incident severity / SLA matrix</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Definition</TableHead>
                <TableHead>Acknowledge</TableHead>
                <TableHead>Updates</TableHead>
                <TableHead>Escalation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SEVERITY_LEVELS.map((sev) => (
                <TableRow key={sev.id}>
                  <TableCell><Badge variant={SEV_VARIANT[sev.id]}>{sev.id}</Badge> {sev.name}</TableCell>
                  <TableCell className="text-muted-foreground">{sev.definition}</TableCell>
                  <TableCell className="text-muted-foreground">{sev.ack}</TableCell>
                  <TableCell className="text-muted-foreground">{sev.updateCadence}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{sev.escalation}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="mb-3 text-lg font-semibold">On-call roster</h2>
          <ul className="space-y-2 text-sm">
            {ON_CALL_ROLES.map((r) => (
              <li key={r.id}><span className="font-medium">{r.role}</span> <span className="font-mono text-xs text-muted-foreground">({r.id})</span> — <span className="text-muted-foreground">{r.responsibilities}</span></li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {RUNBOOKS.map((rb) => (
        <Card key={rb.scenario} className="mb-6">
          <CardContent className="pt-6">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-lg font-semibold">{rb.scenario}</h2>
              <Badge variant={SEV_VARIANT[rb.severity]}>{rb.severity} · {severityById(rb.severity)?.name}</Badge>
            </div>
            <ol className="space-y-1.5 text-sm">
              {rb.steps.map((step) => (
                <li key={step.order} className="flex gap-3">
                  <span className="font-mono text-xs text-muted-foreground">{step.order}.</span>
                  <span><Badge variant="outline" className="mr-2">{step.phase}</Badge>{step.action} <span className="text-xs text-muted-foreground">({step.owner})</span></span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ))}
    </Shell>
  )
}

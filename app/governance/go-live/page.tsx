import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { integrationStatuses } from "@/lib/integrations/status"
import { goLiveRows, goLiveSummary, PREREQUISITE_LABEL, type GoLiveState } from "@/lib/golive"

export const dynamic = "force-dynamic"

const STATE_VARIANT: Record<GoLiveState, "default" | "secondary" | "destructive"> = {
  live: "default",
  ready: "secondary",
  blocked: "destructive",
}

export default function GoLivePage() {
  const rows = goLiveRows(integrationStatuses())
  const s = goLiveSummary(rows)

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Integration Go-Live Tracker</PageHeaderHeading>
        <PageHeaderDescription>
          What each integration port needs to flip from mock to live — the prerequisite (MoU / sandbox / public API),
          the env vars to set, the owning authority, and a state derived from current configuration.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/go-live/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download tracker (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.total}</div><div className="text-sm text-muted-foreground">Ports</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.live}</div><div className="text-sm text-muted-foreground">Live</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.ready}</div><div className="text-sm text-muted-foreground">Config-ready</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-destructive">{s.blocked}</div><div className="text-sm text-muted-foreground">Blocked ({s.readyPct}% ready)</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Port</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Prerequisite</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Flag</TableHead>
                <TableHead className="text-right">Env set</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.key}>
                  <TableCell className="font-medium">{r.label}<div className="font-mono text-xs text-muted-foreground">{r.port}</div></TableCell>
                  <TableCell><Badge variant={STATE_VARIANT[r.state]}>{r.state}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{PREREQUISITE_LABEL[r.prerequisite]}</TableCell>
                  <TableCell className="text-muted-foreground">{r.owner}</TableCell>
                  <TableCell className="font-mono text-xs">{r.flag}=live</TableCell>
                  <TableCell className="text-right">{r.env.filter((e) => e.present).length}/{r.env.length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

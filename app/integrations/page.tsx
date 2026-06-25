import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { integrationStatuses, integrationSummary } from "@/lib/integrations/status"

export default function IntegrationsPage() {
  const rows = integrationStatuses()
  const s = integrationSummary(rows)
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Integrations Status &amp; Config</PageHeaderHeading>
        <PageHeaderDescription>
          Every external dependency runs through a typed port with a mock and a real HTTP-backed adapter. Each defaults to
          mock and flips to live via its INTEGRATION_* flag once its configuration is present. This screen reports the
          live/mock mode and which variables are set — never their values.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Ports</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Live now</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.live}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Ready to go live</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.liveReady}</div><p className="text-xs text-muted-foreground mt-1">config present</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Integration</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Flag</TableHead>
                <TableHead>Configuration</TableHead>
                <TableHead>Live-ready</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.key}>
                  <TableCell>
                    <div className="font-medium">{r.label}</div>
                    <div className="text-xs text-muted-foreground">{r.note}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.port}</TableCell>
                  <TableCell>
                    <Badge variant={r.mode === "live" ? "default" : "secondary"}>{r.mode}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.flag}=live</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {r.env.map((e) => (
                        <Badge
                          key={e.name}
                          variant={e.present ? "default" : e.required ? "destructive" : "outline"}
                          className="font-mono text-[10px]"
                          title={e.required ? "required" : "optional"}
                        >
                          {e.name}
                          {e.required ? "" : " (opt)"}
                          {e.present ? " ✓" : ""}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.liveReady ? <Badge>ready</Badge> : <Badge variant="outline">needs config</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-4 text-xs text-muted-foreground">
            Green = variable set · red = required &amp; missing · outline = optional. Setting a port&apos;s flag to live
            plus its required variables switches it to the real provider with no code change.
          </p>
        </CardContent>
      </Card>
    </Shell>
  )
}

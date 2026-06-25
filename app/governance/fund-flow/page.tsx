import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { integrations, integrationModes } from "@/lib/integrations"
import { TRACKED_SCHEMES, fundFlowView, inrCrore, type FundFlowView } from "@/lib/finance/fund-flow"
import { SanctionLookup } from "./sanction-lookup"

export const dynamic = "force-dynamic"

export default async function FundFlowPage() {
  // Drive the page through the PFMS port: mock by default, real treasury/PFMS gateway when
  // INTEGRATION_PFMS=live. Each scheme's sanction-to-utilisation is pulled live from the registry.
  const results = await Promise.all(TRACKED_SCHEMES.map((s) => integrations.pfms.schemeExpenditure(s)))
  const rows: FundFlowView[] = results.flatMap((r) => (r.ok && r.data ? [fundFlowView(r.data)] : []))
  const mode = integrationModes.pfms
  const traceId = results[0]?.traceId ?? "—"

  const totals = rows.reduce(
    (acc, r) => ({ allocated: acc.allocated + r.allocated, released: acc.released + r.released, utilised: acc.utilised + r.utilised }),
    { allocated: 0, released: 0, utilised: 0 },
  )
  const totalUtilPct = totals.released === 0 ? 0 : Math.round((totals.utilised / totals.released) * 1000) / 10

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Scheme Fund Flow — PFMS</PageHeaderHeading>
        <PageHeaderDescription>
          Public Financial Management System (PFMS) fund flow across major Tamil Nadu school-education schemes —
          sanction → release → utilisation, reconciled per scheme. Served through the typed PFMS federation port
          (<strong>{mode === "live" ? "live treasury gateway" : "mock — deterministic"}</strong>); flip
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">INTEGRATION_PFMS=live</code> with a configured
          gateway to federate against the real treasury.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">Allocated</div>
            <div className="text-2xl font-bold">{inrCrore(totals.allocated)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">Released</div>
            <div className="text-2xl font-bold text-blue-600">{inrCrore(totals.released)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">Utilised ({totalUtilPct}% of released)</div>
            <div className="text-2xl font-bold text-green-600">{inrCrore(totals.utilised)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4">
        <SanctionLookup />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Scheme-wise fund flow</CardTitle>
          <Badge variant={mode === "live" ? "default" : "secondary"}>{mode === "live" ? "Live" : "Mock"} · {traceId}</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scheme</TableHead>
                <TableHead className="text-right">Allocated</TableHead>
                <TableHead className="text-right">Released</TableHead>
                <TableHead className="text-right">Utilised</TableHead>
                <TableHead className="w-40">Utilisation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.scheme}>
                  <TableCell className="font-medium">{r.scheme}</TableCell>
                  <TableCell className="text-right">{inrCrore(r.allocated)}</TableCell>
                  <TableCell className="text-right">{inrCrore(r.released)} <span className="text-xs text-muted-foreground">({r.releasePct}%)</span></TableCell>
                  <TableCell className="text-right">{inrCrore(r.utilised)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={r.utilisationPct} className="h-2" />
                      <span className="text-xs tabular-nums">{r.utilisationPct}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

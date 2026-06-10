import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { inr } from "@/lib/finance"
import { GRANTS, UTILISATION_THRESHOLD, utilisationPct, nextTrancheEligible, trancheStatus, grantsSummary } from "@/lib/finance/grants"

export default function GrantsPage() {
  const s = grantsSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Grants &amp; Utilisation Certificates</PageHeaderHeading>
        <PageHeaderDescription>
          Centrally-sponsored grants release in tranches, and the next tranche is gated: the state cannot draw more
          until it has utilised at least {UTILISATION_THRESHOLD}% of what it holds and filed a Utilisation Certificate.
          {" "}{s.eligibleForRelease} of {s.grants} grants are eligible for the next tranche; {s.ucPending} have a UC
          pending. Average utilisation <strong>{s.avgUtilisationPct}%</strong>.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/grants/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{inr(s.totalSanctioned)}</div><div className="text-sm text-muted-foreground">Sanctioned</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.avgUtilisationPct}%</div><div className="text-sm text-muted-foreground">Avg utilisation</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.eligibleForRelease}</div><div className="text-sm text-muted-foreground">Eligible for tranche</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-amber-600 dark:text-amber-500">{s.ucPending}</div><div className="text-sm text-muted-foreground">UC pending</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scheme</TableHead>
                <TableHead className="text-right">Sanctioned</TableHead>
                <TableHead className="text-right">Released</TableHead>
                <TableHead className="w-40">Utilisation</TableHead>
                <TableHead>Next tranche</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {GRANTS.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>
                    <div className="font-medium">{g.scheme}</div>
                    <div className="font-mono text-xs text-muted-foreground">{g.id}</div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{inr(g.sanctioned)}</TableCell>
                  <TableCell className="text-right">{inr(g.released)}</TableCell>
                  <TableCell>
                    <Progress value={utilisationPct(g)} />
                    <div className="mt-1 text-xs text-muted-foreground">{utilisationPct(g)}%</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={nextTrancheEligible(g) ? "default" : "outline"} className={nextTrancheEligible(g) ? "" : "border-amber-500 text-amber-600 dark:text-amber-500"}>
                      {trancheStatus(g)}
                    </Badge>
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

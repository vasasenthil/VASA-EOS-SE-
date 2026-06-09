import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { tierCatalogue, tenancySummary, governancePath } from "@/lib/tenancy/catalogue"
import { TENANCY_GUARANTEES } from "@/lib/tenancy"

export default function TenancyPage() {
  const s = tenancySummary()
  const tiers = tierCatalogue()
  const path = governancePath()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Sovereign Tenancy — 7 Jurisdiction Tiers</PageHeaderHeading>
        <PageHeaderDescription>
          Constitutional federalism made operational: national → state → directorate → district → block → cluster →
          school, with downward governance (a tenant governs itself and its descendants). {s.sovereignState} is the
          primary sovereign tenant today; the model already anchors states under a national node, so more states and the
          Centre can be added later without re-architecting.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/tenancy/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.tiers}</div><div className="text-sm text-muted-foreground">Jurisdiction tiers</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.depth}</div><div className="text-sm text-muted-foreground">Governance depth</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.sovereignState}</div><div className="text-sm text-muted-foreground">Sovereign state tenant</div></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>TN scale</TableHead>
                <TableHead>Example / demo node</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.map((t) => (
                <TableRow key={t.tier}>
                  <TableCell className="font-mono">{t.level}</TableCell>
                  <TableCell className="font-medium">{t.label}</TableCell>
                  <TableCell className="text-muted-foreground">{t.scale}</TableCell>
                  <TableCell className="text-muted-foreground">{t.node?.name ?? t.example}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="mb-3 text-lg font-semibold">Live governance path</h2>
          <div className="flex flex-wrap items-center gap-1 text-sm">
            {path.map((n, i) => (
              <span key={n.id} className="flex items-center gap-1">
                <Badge variant="secondary">{n.name}</Badge>
                {i < path.length - 1 && <span className="text-muted-foreground">→</span>}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-3 text-lg font-semibold">Tenancy guarantees</h2>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {TENANCY_GUARANTEES.map((g) => <li key={g}>• {g}</li>)}
          </ul>
        </CardContent>
      </Card>
    </Shell>
  )
}

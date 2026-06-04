import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { POLYGLOT_STORES, DATA_TIERS, DATA_ZONES, DATA_GOVERNANCE } from "@/lib/data"

export default function DataPlatformPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Data Platform</PageHeaderHeading>
        <PageHeaderDescription>
          Federated, multi-tier data architecture with polyglot persistence — operational stores, an event backbone, a
          Bronze/Silver/Gold lake feeding analytics and VSK, plus knowledge-graph and vector stores. State data
          sovereignty preserved throughout.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>5-Tier Architecture</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {DATA_TIERS.map((t) => (
                <li key={t.tier}>
                  <div className="font-medium">{t.tier}</div>
                  <div className="text-muted-foreground">{t.purpose}</div>
                  <div className="text-xs text-muted-foreground">{t.components}</div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {DATA_ZONES.map((z) => (
                <Badge key={z} variant="outline">
                  {z}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Polyglot Persistence (10 stores)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Tech</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {POLYGLOT_STORES.map((s) => (
                  <TableRow key={s.name}>
                    <TableCell>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.purpose}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{s.tech}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Governance</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm list-disc list-inside text-muted-foreground">
            {DATA_GOVERNANCE.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </Shell>
  )
}

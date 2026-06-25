import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TENANT_TIERS, TENANCY_GUARANTEES } from "@/lib/tenancy"
import { TenantExplorer } from "./tenant-explorer"

export default function TenancyPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Sovereign Multi-Tenancy</PageHeaderHeading>
        <PageHeaderDescription>
          Constitutional federalism made operational — 7 tenancy tiers from National to School. Tamil Nadu is the primary
          sovereign tenant; each tenant owns its data and federation is opt-in.
        </PageHeaderDescription>
      </PageHeader>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>7 Tenancy Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead>Example</TableHead>
                <TableHead className="text-right">Scale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TENANT_TIERS.map((t) => (
                <TableRow key={t.tier}>
                  <TableCell className="font-medium">{t.label}</TableCell>
                  <TableCell className="text-muted-foreground">{t.example}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{t.scale}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <TenantExplorer />
        <Card>
          <CardHeader>
            <CardTitle>Tenancy Guarantees</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm list-disc list-inside text-muted-foreground">
              {TENANCY_GUARANTEES.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

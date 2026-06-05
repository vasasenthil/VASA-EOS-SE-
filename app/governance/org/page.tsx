import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ORG_UNITS, ORG_KIND_LABELS, orgSummary, getOrg, type OrgKind } from "@/lib/org"

export default function OrgPage() {
  const s = orgSummary()
  const kinds = Object.keys(ORG_KIND_LABELS) as OrgKind[]
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Government Structure</PageHeaderHeading>
        <PageHeaderDescription>
          The Tamil Nadu school-education governance hierarchy the platform serves — the ministry and secretariat, the 7
          directorates, authorities/organisations, councils, committees, field offices and schools.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Org units</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Directorates</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.byKind.directorate}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Councils + committees</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.byKind.council + s.byKind.committee}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Authorities</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.byKind.authority}</div></CardContent></Card>
      </div>

      <div className="space-y-6">
        {kinds.map((kind) => {
          const units = ORG_UNITS.filter((o) => o.kind === kind)
          if (units.length === 0) return null
          return (
            <Card key={kind}>
              <CardHeader>
                <CardTitle className="text-base">{ORG_KIND_LABELS[kind]}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Reports to</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">{o.name}</TableCell>
                        <TableCell className="font-mono text-xs">{o.code ?? "—"}</TableCell>
                        <TableCell><Badge variant="outline">{o.tier}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{o.parentId ? getOrg(o.parentId)?.name ?? o.parentId : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </Shell>
  )
}

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ROUTES, transportSummary, TRANSPORT_SCHEMES } from "@/lib/transport"

export default function TransportPage() {
  const s = transportSummary()
  const kpis = [
    { label: "Routes", value: String(s.routes) },
    { label: "Students", value: String(s.students) },
    { label: "CWSN transport", value: String(s.cwsn) },
  ]
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Transport</PageHeaderHeading>
        <PageHeaderDescription>
          Free bus pass (TNSTC/MTC), free cycle for Class 11 and accessible CWSN transport — critical for girls&apos; and
          rural attendance and higher-secondary continuation.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{k.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Bus Routes</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">CWSN</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROUTES.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell><Badge variant="outline">{r.operator}</Badge></TableCell>
                    <TableCell className="text-right">{r.students}</TableCell>
                    <TableCell className="text-right">{r.cwsn}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Schemes</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {TRANSPORT_SCHEMES.map((t) => (
                <li key={t.label}>
                  <span className="font-medium">{t.label}</span>
                  <span className="text-muted-foreground"> — {t.detail}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

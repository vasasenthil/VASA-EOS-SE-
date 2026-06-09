import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ACTIVITIES, coCurricularSummary } from "@/lib/cocurricular"

export default function CoCurricularPage() {
  const s = coCurricularSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Co-curricular &amp; Sports</PageHeaderHeading>
        <PageHeaderDescription>
          Clubs, competitions, innovation (Atal Tinkering Lab, Inspire Award), Tamil arts and sports (Khelo India) —
          holistic development beyond marks, aligned with NEP bagless days and experiential learning.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Activities</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.activities}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Participants</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.participants}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Sports</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.sports}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Innovation</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.innovation}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Activities</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Activity</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Participants</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {ACTIVITIES.map((a) => (
                <TableRow key={a.name}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell><Badge variant="outline">{a.category}</Badge></TableCell>
                  <TableCell className="text-right">{a.participants}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

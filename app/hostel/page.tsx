import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { HOSTELS, hostelSummary, MESS_CHECKLIST } from "@/lib/hostel"

export default function HostelPage() {
  const s = hostelSummary()
  const kpis = [
    { label: "Hostels", value: String(s.count) },
    { label: "Capacity", value: String(s.capacity) },
    { label: "Occupied", value: String(s.occupied) },
    { label: "Occupancy", value: `${s.occupancyPct}%` },
  ]
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Hostel &amp; Residential Management</PageHeaderHeading>
        <PageHeaderDescription>
          Adi Dravidar, BC/MBC, KGBV and Tribal welfare hostels — allocation, mess management, occupancy and welfare
          linkage for SC/ST and tribal-area students.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{k.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Hostels</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hostel</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead className="w-40">Occupancy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {HOSTELS.map((h) => {
                  const pct = Math.round((h.occupied / h.capacity) * 100)
                  return (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{h.name}</TableCell>
                      <TableCell><Badge variant="outline">{h.type}</Badge></TableCell>
                      <TableCell>{h.district}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-2" />
                          <span className="text-xs text-muted-foreground w-16 text-right">{h.occupied}/{h.capacity}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Mess &amp; Oversight</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm list-disc list-inside text-muted-foreground">
              {MESS_CHECKLIST.map((m) => (<li key={m}>{m}</li>))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

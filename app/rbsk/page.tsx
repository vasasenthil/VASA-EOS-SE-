import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SCREENINGS, healthSummary, RBSK_FOUR_DS } from "@/lib/health"

export default function RbskPage() {
  const s = healthSummary()
  const kpis = [
    { label: "Screened", value: String(s.screened) },
    { label: "Anaemia", value: `${s.anaemiaPct}%` },
    { label: "Referrals", value: String(s.referrals) },
  ]
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Health (RBSK)</PageHeaderHeading>
        <PageHeaderDescription>
          Rashtriya Bal Swasthya Karyakram screening for the 4 Ds, BMI and anaemia tracking, referral workflows and
          ABHA health-record federation — coordinated with NHM Tamil Nadu.
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
          <CardHeader><CardTitle>Screening Records</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>BMI</TableHead>
                  <TableHead>Anaemia</TableHead>
                  <TableHead>Vision</TableHead>
                  <TableHead>Referral</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SCREENINGS.map((r) => (
                  <TableRow key={r.apaarId}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell><Badge variant={r.bmiStatus === "normal" ? "default" : "secondary"}>{r.bmiStatus}</Badge></TableCell>
                    <TableCell>{r.anaemia ? <Badge variant="destructive">yes</Badge> : "—"}</TableCell>
                    <TableCell>{r.vision === "refer" ? <Badge variant="destructive">refer</Badge> : "normal"}</TableCell>
                    <TableCell className="text-muted-foreground">{r.referral ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>RBSK — The 4 Ds</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm list-disc list-inside text-muted-foreground">
              {RBSK_FOUR_DS.map((d) => (<li key={d}>{d}</li>))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">Records federate to ABHA with consent; referrals route to NHM facilities.</p>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

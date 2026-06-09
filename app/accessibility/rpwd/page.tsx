import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { RPWD_DISABILITIES, rpwdSummary, RPWD_GROUPS, byGroup, type RpwdGroup } from "@/lib/accessibility/rpwd"

const GROUP_LABEL: Record<RpwdGroup, string> = {
  physical: "Physical",
  intellectual: "Intellectual",
  "mental-behaviour": "Mental & behaviour",
  "neurological-chronic": "Chronic neurological",
  blood: "Blood disorder",
  multiple: "Multiple",
}

export default function RpwdPage() {
  const s = rpwdSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>RPwD Act 2016 — 21 Disability Categories</PageHeaderHeading>
        <PageHeaderDescription>
          The 21 specified disabilities in the Schedule of the Rights of Persons with Disabilities Act, 2016 — each with
          its statutory group, the assistive-technology the platform offers (keyed to the accessibility feature registry),
          the typical examination concession, and benchmark-disability eligibility. This is the canonical reference the
          CWSN/inclusion, exam-seating and accessibility modules align to.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/accessibility/rpwd/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.total}</div><div className="text-sm text-muted-foreground">Specified disabilities</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.groups}</div><div className="text-sm text-muted-foreground">Statutory groups</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.benchmarkEligible}</div><div className="text-sm text-muted-foreground">Benchmark-eligible</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.withAssistiveTech}</div><div className="text-sm text-muted-foreground">With digital AT</div></CardContent></Card>
      </div>

      {RPWD_GROUPS.map((g) => (
        <Card key={g} className="mb-6">
          <CardContent className="pt-6">
            <h2 className="mb-3 text-lg font-semibold">{GROUP_LABEL[g]}</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Disability</TableHead>
                  <TableHead>Assistive technology</TableHead>
                  <TableHead>Exam concession</TableHead>
                  <TableHead>Benchmark</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byGroup(g).map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.assistiveTech.length ? d.assistiveTech.join(", ") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{d.examConcession}</TableCell>
                    <TableCell>{d.benchmarkEligible ? <Badge variant="secondary">≥40% eligible</Badge> : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </Shell>
  )
}

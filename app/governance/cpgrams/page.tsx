import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { CPGRAMS_CASES, CPGRAMS_SLA_DAYS, daysPending, isOverdue, cpgramsSummary, type CpgramsStatus } from "@/lib/grievance/cpgrams"

const NOW = new Date("2026-06-10T00:00:00Z")
const AS_OF = "10 Jun 2026"

const STATUS_VARIANT: Record<CpgramsStatus, "default" | "secondary" | "outline"> = {
  Disposed: "default",
  "Under Examination": "secondary",
  Receipt: "secondary",
  Appeal: "outline",
}

export default function CpgramsPage() {
  const s = cpgramsSummary(NOW)
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>CPGRAMS Federation</PageHeaderHeading>
        <PageHeaderDescription>
          Grievances escalated past the State are federated to CPGRAMS, the national grievance system, which carries its
          own {CPGRAMS_SLA_DAYS}-day disposal norm and status vocabulary. Each case is mapped to the CPGRAMS lifecycle
          with a registration number, ministry and days-pending against the SLA. {s.overdue} of {s.pending} open cases
          are past the {CPGRAMS_SLA_DAYS}-day norm <span className="text-muted-foreground">(as of {AS_OF})</span>;
          disposal rate {s.disposalRatePct}%.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/cpgrams/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.total}</div><div className="text-sm text-muted-foreground">Federated cases</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.pending}</div><div className="text-sm text-muted-foreground">Under examination</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-red-600 dark:text-red-500">{s.overdue}</div><div className="text-sm text-muted-foreground">Past {CPGRAMS_SLA_DAYS}-day norm</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.disposalRatePct}%</div><div className="text-sm text-muted-foreground">Disposal rate</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Registration No</TableHead>
                <TableHead>Ministry</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-right">Days pending</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CPGRAMS_CASES.map((c) => (
                <TableRow key={c.registrationNo}>
                  <TableCell>
                    <div className="font-mono text-xs">{c.registrationNo}</div>
                    <div className="text-xs text-muted-foreground">← {c.localId}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.ministry}</TableCell>
                  <TableCell className="text-sm">{c.subject}</TableCell>
                  <TableCell className={`text-right ${isOverdue(c, NOW) ? "font-medium text-red-600 dark:text-red-500" : "text-muted-foreground"}`}>
                    {daysPending(c, NOW)}d
                  </TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

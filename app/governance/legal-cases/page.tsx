import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { LEGAL_CASES, upcomingHearings, legalSummary, type CaseStatus, type CaseRisk } from "@/lib/legal"

const NOW = new Date("2026-06-10T00:00:00Z")
const AS_OF = "10 Jun 2026"

const STATUS_VARIANT: Record<CaseStatus, "default" | "secondary" | "outline"> = {
  hearing: "default",
  reserved: "secondary",
  filed: "secondary",
  disposed: "outline",
}
const RISK_CLASS: Record<CaseRisk, string> = {
  high: "border-red-500 text-red-600 dark:text-red-500",
  medium: "border-amber-500 text-amber-600 dark:text-amber-500",
  low: "",
}

export default function LegalCasesPage() {
  const s = legalSummary(NOW)
  const imminent = new Set(upcomingHearings(NOW, 7).map((c) => c.id))
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Legal Case Management</PageHeaderHeading>
        <PageHeaderDescription>
          The department&apos;s litigation register — service matters, RTE/admission writs, recognition appeals, PILs and
          property disputes. Each case carries its court, type, status and next hearing; imminent hearings (next 7 days)
          and high-risk matters are surfaced so attention follows exposure. {s.imminentHearings} hearings are imminent and
          {" "}{s.highRisk} active matters are high-risk <span className="text-muted-foreground">(as of {AS_OF})</span>.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/legal-cases/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.active}</div><div className="text-sm text-muted-foreground">Active cases</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-red-600 dark:text-red-500">{s.highRisk}</div><div className="text-sm text-muted-foreground">High-risk</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-amber-600 dark:text-amber-500">{s.imminentHearings}</div><div className="text-sm text-muted-foreground">Hearings ≤ 7 days</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.disposed}</div><div className="text-sm text-muted-foreground">Disposed</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case</TableHead>
                <TableHead>Court</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Next hearing</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LEGAL_CASES.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.title}</div>
                    <div className="font-mono text-xs text-muted-foreground">{c.id} · {c.owner}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.court}</TableCell>
                  <TableCell className="text-sm">{c.caseType}</TableCell>
                  <TableCell className={imminent.has(c.id) ? "font-medium text-amber-600 dark:text-amber-500" : "text-muted-foreground"}>
                    {c.nextHearing ?? "—"}
                  </TableCell>
                  <TableCell><Badge variant="outline" className={RISK_CLASS[c.risk]}>{c.risk}</Badge></TableCell>
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

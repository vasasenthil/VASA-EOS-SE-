import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { PROCESS_EFFICIENCIES, efficiencySummary, type ProcessStatus } from "@/lib/compliance/operations-efficiency"

const STATUS_VARIANT: Record<ProcessStatus, "default" | "secondary"> = {
  implemented: "default",
  partial: "secondary",
}

export default function OperationsEfficiencyPage() {
  const s = efficiencySummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Operational Efficiency — Time &amp; Money Savings</PageHeaderHeading>
        <PageHeaderDescription>
          Governance excellence made inspectable: each high-friction process — student transfer, examination processing,
          teacher transfer, scheme disbursement, grievance redressal and teacher administrative burden — with its manual
          baseline, the platform target, the improvement, and the module that owns it. Improvements are illustrative
          targets; speed-ups needing a live provider or LLM at deploy are shown honestly as <strong>partial</strong>.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/operations-efficiency/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.processes}</div><div className="text-sm text-muted-foreground">Processes</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.implemented}</div><div className="text-sm text-muted-foreground">Implemented in code</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.avgImprovementPct}%</div><div className="text-sm text-muted-foreground">Mean improvement (target)</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Process</TableHead>
                <TableHead>Before</TableHead>
                <TableHead>After</TableHead>
                <TableHead className="text-right">Improvement</TableHead>
                <TableHead>Component</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PROCESS_EFFICIENCIES.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.process}</TableCell>
                  <TableCell className="text-muted-foreground">{p.before}</TableCell>
                  <TableCell className="text-muted-foreground">{p.after}</TableCell>
                  <TableCell className="text-right font-mono">{p.improvementPct}%</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.controlRef}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

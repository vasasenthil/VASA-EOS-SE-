import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { ASSURANCE_REGISTER, assuranceSummary, type AssuranceStatus } from "@/lib/assurance"

const STATUS_VARIANT: Record<AssuranceStatus, "default" | "secondary" | "destructive" | "outline"> = {
  passed: "default",
  "in-progress": "secondary",
  "not-started": "destructive",
  "n/a": "outline",
}

export default function AssurancePage() {
  const s = assuranceSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Independent Assurance &amp; DPIA Register</PageHeaderHeading>
        <PageHeaderDescription>
          The honest go-live sign-off panel — every security, privacy, accessibility, resilience and quality activity,
          its standard, owner, cadence and status. Activities the platform genuinely runs (tests, typecheck, lint, CI)
          are <strong>passed</strong>; the independent audits a government must commission are <strong>not started</strong>.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/assurance/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download register (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.total}</div><div className="text-sm text-muted-foreground">Activities</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.passed}</div><div className="text-sm text-muted-foreground">Passed</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.inProgress}</div><div className="text-sm text-muted-foreground">In progress</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-destructive">{s.notStarted}</div><div className="text-sm text-muted-foreground">Not started ({s.passedPct}% passed)</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Standard</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Evidence / required</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ASSURANCE_REGISTER.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell className="text-muted-foreground">{a.category}</TableCell>
                  <TableCell className="text-muted-foreground">{a.standard}</TableCell>
                  <TableCell className="text-muted-foreground">{a.owner}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[a.status]}>{a.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.evidence}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

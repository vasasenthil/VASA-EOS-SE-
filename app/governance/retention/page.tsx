import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { RETENTION_RULES, RTE_LIFECYCLE, retentionSummary, type ErasureAction } from "@/lib/consent/retention"
import { piiClassById } from "@/lib/consent/pii-catalogue"

const ACTION_VARIANT: Record<ErasureAction, "destructive" | "default" | "secondary"> = {
  "hard-delete": "destructive",
  anonymise: "default",
  archive: "secondary",
}

function retentionLabel(days: number | null): string {
  if (days === null) return "Lifecycle / statutory"
  if (days === 0) return "Not stored"
  return `${days} days`
}

export default function RetentionPage() {
  const s = retentionSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Data Retention &amp; Right-to-Erasure (DPDP)</PageHeaderHeading>
        <PageHeaderDescription>
          Storage limitation under the DPDP Act 2023 — for each PII data class, how long it is kept, what triggers
          erasure, the erasure action, and any statutory hold that lawfully delays a hard delete. Derived from and
          verified against the <a className="underline" href="/governance/pii-catalogue">PII catalogue</a>. The
          right-to-erasure request lifecycle is auditable end to end.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/retention/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.rules}</div><div className="text-sm text-muted-foreground">Retention rules</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-destructive">{s.hardDelete}</div><div className="text-sm text-muted-foreground">Hard-delete</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.anonymise}</div><div className="text-sm text-muted-foreground">Anonymise</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.honoursRte}</div><div className="text-sm text-muted-foreground">Honour erasure request</div></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data class</TableHead>
                <TableHead>Retention</TableHead>
                <TableHead>Erasure action</TableHead>
                <TableHead>Triggers</TableHead>
                <TableHead>Statutory hold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RETENTION_RULES.map((r) => (
                <TableRow key={r.classId}>
                  <TableCell className="font-medium">{piiClassById(r.classId)?.dataClass ?? r.classId}</TableCell>
                  <TableCell className="text-muted-foreground">{retentionLabel(r.retentionDays)}</TableCell>
                  <TableCell><Badge variant={ACTION_VARIANT[r.erasureAction]}>{r.erasureAction}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.triggers.join(", ")}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.statutoryHold}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-3 text-lg font-semibold">Right-to-erasure request lifecycle</h2>
          <ol className="space-y-2 text-sm">
            {RTE_LIFECYCLE.map((stage, i) => (
              <li key={stage.stage} className="flex gap-3">
                <span className="font-mono text-xs text-muted-foreground">{i + 1}.</span>
                <span><span className="font-medium capitalize">{stage.stage.replace("-", " ")}</span> — <span className="text-muted-foreground">{stage.description}</span></span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </Shell>
  )
}

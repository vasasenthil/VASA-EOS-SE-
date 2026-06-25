import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { generateDpia, dpiaSummary, type RiskRating } from "@/lib/consent/dpia"

const RISK_VARIANT: Record<RiskRating, "secondary" | "default" | "destructive"> = {
  low: "secondary",
  medium: "default",
  high: "destructive",
}

export default function DpiaPage() {
  const doc = generateDpia()
  const s = dpiaSummary(doc)
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Data Protection Impact Assessment (scaffold)</PageHeaderHeading>
        <PageHeaderDescription>
          Auto-generated from the live <a className="underline" href="/governance/pii-catalogue">PII data-classification catalogue</a> under the
          DPDP Act 2023. Every catalogued data class becomes a processing activity with an inherent-risk rating and the
          safeguards the platform already provides. This is a <strong>drafting aid</strong> — the Data Protection Officer
          completes the residual-risk assessment and signs off before go-live (tracked honestly on the assurance register).
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/dpia/markdown" download>
              <Download className="mr-2 h-4 w-4" />
              Download scaffold (Markdown)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.activities}</div><div className="text-sm text-muted-foreground">Processing activities</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-destructive">{s.high}</div><div className="text-sm text-muted-foreground">High inherent risk</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.medium}</div><div className="text-sm text-muted-foreground">Medium</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.childDataActivities}</div><div className="text-sm text-muted-foreground">Children's-data activities</div></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Processing activity</TableHead>
                <TableHead>Sensitivity / basis</TableHead>
                <TableHead>Inherent risk</TableHead>
                <TableHead>Retention</TableHead>
                <TableHead>Safeguards in place</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doc.activities.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.dataClass}<div className="text-xs text-muted-foreground">{a.examples}</div></TableCell>
                  <TableCell className="text-muted-foreground">{a.sensitivity} / {a.basis}</TableCell>
                  <TableCell><Badge variant={RISK_VARIANT[a.inherentRisk]}>{a.inherentRisk}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{a.retention}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <ul className="list-disc pl-4">
                      {a.safeguards.map((g) => <li key={g}>{g}</li>)}
                    </ul>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-3 text-lg font-semibold">DPO actions to finalise &amp; sign off</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {doc.dpoActions.map((a) => (
              <li key={a} className="flex items-start gap-2">
                <span aria-hidden className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded border" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </Shell>
  )
}

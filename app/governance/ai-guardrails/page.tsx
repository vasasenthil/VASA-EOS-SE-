import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { GUARDRAILS, guardrailSummary, type GuardrailStatus, type RaiPrinciple } from "@/lib/agents/guardrails"

const STATUS_VARIANT: Record<GuardrailStatus, "default" | "secondary" | "destructive"> = {
  enforced: "default",
  partial: "secondary",
  planned: "destructive",
}
const PRINCIPLE_LABEL: Record<RaiPrinciple, string> = {
  grounding: "Grounding & accuracy",
  "human-agency": "Human agency & oversight",
  privacy: "Privacy",
  fairness: "Fairness & non-discrimination",
  accountability: "Accountability",
  safety: "Safety & security",
  robustness: "Reliability & robustness",
}

export default function AiGuardrailsPage() {
  const s = guardrailSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Responsible-AI Guardrails</PageHeaderHeading>
        <PageHeaderDescription>
          AI here advises on children's education and welfare, so every model risk has a declared control. Each guardrail
          maps a responsible-AI principle to the concrete mechanism that enforces it — grounding, confidence gating,
          human-in-the-loop approval, consent-gated PII, deny-by-default tools, and tamper-evident audit. Every control
          reference points at a real file and is verified by tests. AI is advisory; high-stakes actions stay human-gated.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/ai-guardrails/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.guardrails}</div><div className="text-sm text-muted-foreground">Guardrails ({s.risksCovered} risks)</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.principles}</div><div className="text-sm text-muted-foreground">RAI principles</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.enforced}</div><div className="text-sm text-muted-foreground">Enforced</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.partial}</div><div className="text-sm text-muted-foreground">Partial</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Principle</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Guardrail → control</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {GUARDRAILS.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{PRINCIPLE_LABEL[g.principle]}</TableCell>
                  <TableCell className="text-muted-foreground">{g.description}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{g.control}<div className="font-mono">{g.controlRef}</div></TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[g.status]}>{g.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

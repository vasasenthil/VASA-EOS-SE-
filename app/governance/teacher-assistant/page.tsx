import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { ASSIST_TASKS, assistantSummary, type Autonomy } from "@/lib/agents/teacher-assistant"

const AUTONOMY_VARIANT: Record<Autonomy, "default" | "secondary" | "outline"> = {
  auto: "default",
  draft: "secondary",
  suggest: "outline",
}

export default function TeacherAssistantPage() {
  const s = assistantSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>AI Teacher Assistant</PageHeaderHeading>
        <PageHeaderDescription>
          The teacher&apos;s own assistant — lesson-plan drafts, quiz generation, remediation suggestions, report-card
          comments, attendance summaries and resource finding. The rule is firm: anything student-facing or
          record-affecting is human-in-the-loop — the teacher reviews and approves; only read-only summaries run
          unattended. {s.hitlRequired} of {s.tasks} tasks are HITL-gated and the safety invariant (every high-stakes
          task is HITL) <strong>{s.invariantHolds ? "holds" : "is broken"}</strong>.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/teacher-assistant/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.tasks}</div><div className="text-sm text-muted-foreground">Assist tasks</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-amber-600 dark:text-amber-500">{s.hitlRequired}</div><div className="text-sm text-muted-foreground">HITL-gated</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.autonomous}</div><div className="text-sm text-muted-foreground">Read-only / auto</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.avgConfidence}%</div><div className="text-sm text-muted-foreground">Avg confidence</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Autonomy</TableHead>
                <TableHead className="text-right">Confidence</TableHead>
                <TableHead>Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ASSIST_TASKS.map((t) => (
                <TableRow key={t.key}>
                  <TableCell>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.description}</div>
                  </TableCell>
                  <TableCell><Badge variant={AUTONOMY_VARIANT[t.autonomy]}>{t.autonomy}</Badge></TableCell>
                  <TableCell className="text-right">{t.confidence}%</TableCell>
                  <TableCell>
                    {t.hitlRequired
                      ? <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-500">teacher approves</Badge>
                      : <Badge variant="secondary">auto (read-only)</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

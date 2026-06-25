import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Pencil, Brain, ShieldCheck } from "lucide-react"
import { getDiagnosticAction } from "../actions"
import { DeleteDiagnosticButton } from "../components/diagnostic-actions"
import { diagnose } from "@/lib/diagnostics"
import { safeDate } from "@/lib/format-date"

export const dynamic = "force-dynamic"

export default async function DiagnosticDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const d = await getDiagnosticAction(id)

  if (!d) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Diagnostic not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this diagnostic. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/diagnostics"><ArrowLeft className="mr-2 h-4 w-4" />Back to diagnostics</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const r = diagnose(d.items) // engine diagnosis, recomputed (never stored)

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{d.title}</PageHeaderHeading>
        <PageHeaderDescription>{d.student} · Class {d.classLevel}-{d.section} · {d.subject} · {d.assessmentType} · {safeDate(d.date, "dd MMM yyyy")}</PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline"><Link href={`/diagnostics/${d.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit / approve plan</Link></Button>
          <DeleteDiagnosticButton id={d.id} label={d.title} redirectTo="/diagnostics" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm"><Link href="/diagnostics"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <Badge>{d.planStatus}</Badge>
        <Badge variant="secondary">{r.pct}% · band {r.band}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-indigo-200">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Brain className="h-4 w-4 text-indigo-600" />Assessment Engine diagnosis</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Objective</TableHead><TableHead className="text-right">Marks</TableHead><TableHead className="text-center">Mastery</TableHead></TableRow></TableHeader>
              <TableBody>
                {r.objectiveMastery.map((o) => (
                  <TableRow key={o.objective} className={o.pct < 50 ? "bg-red-50/40" : undefined}>
                    <TableCell className="font-medium">{o.objective}</TableCell>
                    <TableCell className="text-right tabular-nums">{o.awarded}/{o.max}</TableCell>
                    <TableCell className="text-center"><Badge className={`${o.pct < 50 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"} border-0`}>{o.pct}%</Badge></TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold"><TableCell>Overall</TableCell><TableCell className="text-right tabular-nums">{r.score}/{r.max}</TableCell><TableCell className="text-center"><Badge>{r.pct}% · {r.band}</Badge></TableCell></TableRow>
              </TableBody>
            </Table>
            <div className="p-4 text-xs text-muted-foreground space-y-2">
              <p>{r.explanation}</p>
              <Badge className="bg-indigo-100 text-indigo-700 border-0"><ShieldCheck className="mr-1 h-3 w-3" />Human authority · advisory only</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Remediation plan (human-decided)</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Status</span><span className="font-medium">{d.planStatus}</span></div>
            <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Approved by</span><span className="font-medium">{d.approvedBy || "— (pending approval)"}</span></div>
            <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Weak objectives</span><span className="font-medium text-right">{r.weakObjectives.length ? r.weakObjectives.join(", ") : "None"}</span></div>
            <div><p className="text-muted-foreground">Plan</p><p className="mt-1">{d.remediation || "No remediation recorded yet — edit to approve a plan."}</p></div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

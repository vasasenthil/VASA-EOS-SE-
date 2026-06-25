import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Pencil, Sparkles, ShieldCheck } from "lucide-react"
import { getPathwayAction } from "../actions"
import { DeletePathwayButton } from "../components/pathway-actions"
import { recommend } from "@/lib/pathways"

export const dynamic = "force-dynamic"

export default async function PathwayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getPathwayAction(id)

  if (!p) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Pathway not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this pathway. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/learning-pathways"><ArrowLeft className="mr-2 h-4 w-4" />Back to pathways</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const r = recommend(p.objectives, p.threshold) // engine recommendation, recomputed (never stored)
  const readyIds = new Set(r.recommendations.map((x) => x.objectiveId))

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{p.title}</PageHeaderHeading>
        <PageHeaderDescription>{p.student} · Class {p.classLevel}-{p.section} · {p.subject} · mastery threshold {p.threshold}%</PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline"><Link href={`/learning-pathways/${p.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit / approve</Link></Button>
          <DeletePathwayButton id={p.id} label={p.title} redirectTo="/learning-pathways" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm"><Link href="/learning-pathways"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <Badge>{p.planStatus}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-indigo-200">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-600" />Personalisation Engine</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-1">Ready next steps (ranked)</p>
              {r.recommendations.length === 0 ? <p className="text-sm text-muted-foreground">{r.explanation}</p> : (
                <ol className="space-y-1 text-sm">
                  {r.recommendations.map((rec, i) => (
                    <li key={rec.objectiveId} className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{i + 1}</Badge><span className="font-medium">{rec.label}</span><Badge variant="outline">priority {rec.priority}</Badge>
                      <span className="text-xs text-muted-foreground">{rec.reason}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{r.explanation}</p>
            <Badge className="bg-indigo-100 text-indigo-700 border-0"><ShieldCheck className="mr-1 h-3 w-3" />Human authority · advisory only</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Mastery map</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Objective</TableHead><TableHead className="hidden md:table-cell">Prerequisites</TableHead><TableHead className="text-center">Mastery</TableHead></TableRow></TableHeader>
              <TableBody>
                {p.objectives.map((o) => {
                  const mastered = o.mastery >= p.threshold
                  return (
                    <TableRow key={o.id} className={readyIds.has(o.id) ? "bg-indigo-50/40" : undefined}>
                      <TableCell className="font-medium">{o.label}{readyIds.has(o.id) ? <Badge className="ml-2 bg-indigo-100 text-indigo-700 border-0">next</Badge> : null}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{o.prereqs.length ? o.prereqs.join(", ") : "—"}</TableCell>
                      <TableCell className="text-center"><Badge className={`${mastered ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"} border-0`}>{o.mastery}%</Badge></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">Approved pathway (human-decided)</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Status</span><span className="font-medium">{p.planStatus}</span></div>
          <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Approved by</span><span className="font-medium">{p.approvedBy || "— (pending approval)"}</span></div>
          <div><p className="text-muted-foreground">Plan</p><p className="mt-1">{p.plan || "No pathway approved yet — edit to approve a plan."}</p></div>
        </CardContent>
      </Card>
    </Shell>
  )
}

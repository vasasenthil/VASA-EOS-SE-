import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Bot, ShieldAlert, ShieldCheck } from "lucide-react"
import { getTaskAction } from "../actions"
import { TaskReview } from "../components/task-review"
import { safeDate } from "@/lib/format-date"

export const dynamic = "force-dynamic"

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = await getTaskAction(id)

  if (!t) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Task not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this agent task. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/agent-console"><ArrowLeft className="mr-2 h-4 w-4" />Back to console</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading className="flex items-center gap-2"><Bot className="h-5 w-5 text-indigo-600" />{t.agentLabel}</PageHeaderHeading>
        <PageHeaderDescription>{t.scope}</PageHeaderDescription>
        <PageHeaderActions>
          <TaskReview task={t} />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm"><Link href="/agent-console"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <Badge>{t.status}</Badge>
        {t.requiresApproval ? <Badge className="bg-amber-100 text-amber-700 border-0"><ShieldAlert className="mr-1 h-3 w-3" />High-stakes · approval required</Badge> : null}
        <Badge variant={t.assertive ? "secondary" : "outline"}>{Math.round(t.confidence * 100)}% · {t.assertive ? "assertive" : "suggestion"}</Badge>
        <Badge variant="outline">{t.mode}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Task</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>{t.input}</p>
            {t.availableTools.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1"><span className="text-xs text-muted-foreground">Tools advertised:</span>{t.availableTools.map((tool) => <Badge key={tool} variant="outline" className="text-xs">{tool}</Badge>)}</div>
            ) : null}
            <p className="text-xs text-muted-foreground">Dispatched {safeDate(t.createdAt, "dd MMM yyyy")}</p>
          </CardContent>
        </Card>

        <Card className="border-indigo-200">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4 text-indigo-600" />Agent output (advisory)</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="leading-relaxed">{t.output}</p>
            {t.reasoning ? <p className="text-xs text-muted-foreground">Reasoning: {t.reasoning}</p> : null}
            <Badge className="bg-indigo-100 text-indigo-700 border-0"><ShieldCheck className="mr-1 h-3 w-3" />Human authority · the agent never acts autonomously</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">Human decision</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Status</span><span className="font-medium">{t.status}</span></div>
          <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Reviewed by</span><span className="font-medium">{t.reviewedBy || "— (pending review)"}</span></div>
          {t.notes ? <div><p className="text-muted-foreground">Notes</p><p className="mt-1">{t.notes}</p></div> : null}
        </CardContent>
      </Card>
    </Shell>
  )
}

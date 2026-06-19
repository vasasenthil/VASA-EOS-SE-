import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Eye, ArrowLeft, ArrowRight, Bot, ShieldAlert } from "lucide-react"
import { listTasksAction } from "./actions"
import { TaskFilters } from "./components/task-filters"
import { SeedTasksButton } from "./components/seed-tasks-button"
import { type TaskStatus } from "@/lib/agentconsole"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const STATUS_STYLE: Record<TaskStatus, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-green-100 text-green-700",
  Completed: "bg-blue-100 text-blue-700",
  Rejected: "bg-red-100 text-red-700",
}

interface SP { q?: string; agent?: string; status?: string; page?: string }

export default async function AgentConsolePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listTasksAction({ query: sp.q, agent: sp.agent, status: sp.status, page })
  const demo = !isSupabaseAdminConfigured()
  const s = result.summary

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, agent: sp.agent, status: sp.status })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/agent-console?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>AI Agent Console</PageHeaderHeading>
        <PageHeaderDescription>
          The Native-AI agents (Curriculum · Assessment · Counselling · Operations · Compliance · Analytics ·
          Communication · Welfare) operate under <strong>continuous human authority</strong>: each runs a task and
          returns an advisory output; <strong>high-stakes agents route their action through human approval</strong> before
          anything happens. This inbox is where a human reviews, approves, rejects or completes each one.
        </PageHeaderDescription>
        <PageHeaderActions>
          <SeedTasksButton />
          <Button asChild><Link href="/agent-console/new"><PlusCircle className="mr-2 h-4 w-4" />New task</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing representative <strong>demo agent tasks</strong> — no database is configured. Provision Supabase and seed to manage live tasks.
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Tasks", String(s.total), "text-foreground"],
          ["Pending review", String(s.pending), "text-amber-700"],
          ["Awaiting approval (high-stakes)", String(s.approvalRequired), s.approvalRequired > 0 ? "text-red-700" : "text-foreground"],
          ["Decided", String(s.completed), "text-green-700"],
        ].map(([label, value, color]) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <TaskFilters />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Task</TableHead>
                <TableHead className="text-center">Confidence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.tasks.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground"><Bot className="mx-auto mb-2 h-8 w-8" />No tasks yet. Dispatch a task to an agent, or seed demo tasks.</TableCell></TableRow>
              ) : (
                result.tasks.map((t) => (
                  <TableRow key={t.id} className={t.requiresApproval && t.status === "Pending" ? "bg-amber-50/40" : undefined}>
                    <TableCell className="font-medium whitespace-nowrap">{t.agentLabel}{t.requiresApproval ? <ShieldAlert className="ml-1 inline h-3.5 w-3.5 text-amber-600" /> : null}</TableCell>
                    <TableCell className="text-sm max-w-md"><span className="line-clamp-2">{t.input}</span></TableCell>
                    <TableCell className="text-center"><Badge variant={t.assertive ? "secondary" : "outline"}>{Math.round(t.confidence * 100)}%</Badge></TableCell>
                    <TableCell><Badge className={`${STATUS_STYLE[t.status]} border-0`}>{t.status}</Badge></TableCell>
                    <TableCell className="text-right"><Button asChild variant="outline" size="icon"><Link href={`/agent-console/${t.id}`} aria-label="Review"><Eye className="h-4 w-4" /></Link></Button></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {result.tasks.length} of {result.total} task{result.total === 1 ? "" : "s"} · page {result.page} of {result.totalPages}</span>
        {result.totalPages > 1 ? (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" disabled={result.page <= 1}><Link href={pageHref(result.page - 1)}><ArrowLeft className="mr-1 h-4 w-4" />Prev</Link></Button>
            <Button asChild variant="outline" size="sm" disabled={result.page >= result.totalPages}><Link href={pageHref(result.page + 1)}>Next<ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
        ) : null}
      </div>
    </Shell>
  )
}

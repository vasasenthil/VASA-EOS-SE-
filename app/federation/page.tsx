import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Network, ArrowLeft, ArrowRight } from "lucide-react"
import { listLogsAction, federationStatusAction } from "./actions"
import { FederationWorkbench } from "./components/federation-workbench"
import { SeedLogsButton } from "./components/log-actions"
import { type ReconcileStatus } from "@/lib/federation"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const STATUS_STYLE: Record<ReconcileStatus, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Reconciled: "bg-green-100 text-green-700",
  Flagged: "bg-red-100 text-red-700",
}

interface SP { source?: string; status?: string; page?: string }

export default async function FederationPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const [result, status] = await Promise.all([listLogsAction({ source: sp.source, status: sp.status, page }), federationStatusAction()])
  const demo = !isSupabaseAdminConfigured()
  const s = result.summary

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ source: sp.source, status: sp.status })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/federation?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Federation Console</PageHeaderHeading>
        <PageHeaderDescription>
          Federate, don&apos;t duplicate: the platform reads the national systems of record — <strong>APAAR</strong> (learner
          identity), <strong>UDISE+</strong> (school registry), <strong>DIKSHA</strong> (content) and <strong>PFMS/DBT</strong>
          (fund flow) — through the live integration gateways, then a human reconciles each record against local data.
        </PageHeaderDescription>
        <PageHeaderActions>
          <SeedLogsButton />
        </PageHeaderActions>
      </PageHeader>

      <FederationWorkbench />

      {/* Federation gateway posture */}
      <Card className="mb-6">
        <CardHeader className="pb-2"><CardTitle className="text-base">Federation gateways · {status.summary.live}/{status.summary.total} live · {status.summary.liveReady} live-ready</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {status.statuses.map((g) => (
            <Badge key={g.key} variant="outline" className={g.mode === "live" ? "border-green-300" : g.liveReady ? "border-amber-300" : ""}>
              {g.label}: <span className={`ml-1 ${g.mode === "live" ? "text-green-700" : g.liveReady ? "text-amber-700" : "text-muted-foreground"}`}>{g.mode === "live" ? "live" : g.liveReady ? "ready" : "mock"}</span>
            </Badge>
          ))}
        </CardContent>
      </Card>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing representative <strong>demo reconciliation logs</strong> — no database is configured. Provision Supabase and seed to manage live logs.
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Logged lookups", String(s.total), "text-foreground"],
          ["Pending reconciliation", String(s.pending), "text-amber-700"],
          ["Reconciled", String(s.reconciled), "text-green-700"],
          ["Flagged (discrepancy)", String(s.flagged), s.flagged > 0 ? "text-red-700" : "text-foreground"],
        ].map(([label, value, color]) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Reconciliation log</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Source</TableHead><TableHead>Key</TableHead><TableHead>Federated record</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {result.logs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground"><Network className="mx-auto mb-2 h-8 w-8" />No logs yet. Query a source above and log it for reconciliation, or seed demo logs.</TableCell></TableRow>
              ) : (
                result.logs.map((l) => (
                  <TableRow key={l.id} className={l.status === "Flagged" ? "bg-red-50/40" : undefined}>
                    <TableCell className="font-medium whitespace-nowrap">{l.sourceLabel}</TableCell>
                    <TableCell className="font-mono text-xs">{l.key}</TableCell>
                    <TableCell className="text-sm max-w-md"><span className="line-clamp-2">{l.summary}</span></TableCell>
                    <TableCell><Badge className={`${STATUS_STYLE[l.status]} border-0`}>{l.status}</Badge></TableCell>
                    <TableCell className="text-right"><Button asChild variant="outline" size="icon"><Link href={`/federation/${l.id}`} aria-label="View"><Eye className="h-4 w-4" /></Link></Button></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {result.logs.length} of {result.total} log{result.total === 1 ? "" : "s"} · page {result.page} of {result.totalPages}</span>
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

import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusCircle, Eye, Pencil, ArrowLeft, ArrowRight, Scale } from "lucide-react"
import { listProposalsAction } from "./actions"
import { ProposalFilters } from "./components/proposal-filters"
import { DeleteProposalButton, SeedProposalsButton } from "./components/proposal-actions"
import { project, inr, type ProposalStatus } from "@/lib/policysim"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const STATUS_STYLE: Record<ProposalStatus, string> = {
  "AI Draft": "bg-indigo-100 text-indigo-700",
  Submitted: "bg-amber-100 text-amber-700",
  Sanctioned: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
}

interface SP { q?: string; scope?: string; status?: string; page?: string }

export default async function PolicySimulatorPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listProposalsAction({ query: sp.q, scope: sp.scope, status: sp.status, sortBy: "impact", sortDir: "desc", page })
  const demo = !isSupabaseAdminConfigured()
  const s = result.summary

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, scope: sp.scope, status: sp.status })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/policy-simulator?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Policy Impact Simulator</PageHeaderHeading>
        <PageHeaderDescription>
          Native-AI policy-as-code: model a coverage lever for a scheme and the Policy Engine projects the
          <strong> newly-covered beneficiaries, indicative cost and equity impact</strong> — explainably. A
          sanctioning authority then approves or rejects with a budget (AI projects, a human decides).
        </PageHeaderDescription>
        <PageHeaderActions>
          <SeedProposalsButton />
          <Button asChild><Link href="/policy-simulator/new"><PlusCircle className="mr-2 h-4 w-4" />New proposal</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing representative <strong>demo proposals</strong> — no database is configured. Provision Supabase and seed to manage live proposals.
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Proposals", String(s.total), "text-foreground"],
          ["Pending decision", String(s.pending), "text-amber-700"],
          ["Projected beneficiaries", s.projectedBeneficiaries.toLocaleString("en-IN"), "text-indigo-700"],
          ["Projected cost", inr(s.projectedCost), "text-blue-700"],
        ].map(([label, value, color]) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <ProposalFilters />

      {result.proposals.length === 0 ? (
        <div className="rounded-md border py-12 text-center">
          <Scale className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium">No proposals found</p>
          <p className="text-sm text-muted-foreground">Adjust filters, seed demo proposals, or create a new one.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.proposals.map((p) => {
            const proj = project(p)
            return (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{p.title}</CardTitle>
                    <Badge className={`${STATUS_STYLE[p.status]} border-0`}>{p.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.scheme} · {p.scope}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge className="bg-indigo-100 text-indigo-700 border-0">+{proj.newlyCovered.toLocaleString("en-IN")}</Badge>
                    <Badge variant="secondary">→ {Math.round(proj.projectedCoverage * 100)}%</Badge>
                    <span className="ml-auto text-muted-foreground">{inr(proj.indicativeCost)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="icon"><Link href={`/policy-simulator/${p.id}`} aria-label="View"><Eye className="h-4 w-4" /></Link></Button>
                    <Button asChild variant="outline" size="icon"><Link href={`/policy-simulator/${p.id}/edit`} aria-label="Edit"><Pencil className="h-4 w-4" /></Link></Button>
                    <DeleteProposalButton id={p.id} label={p.title} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {result.proposals.length} of {result.total} proposal{result.total === 1 ? "" : "s"} · page {result.page} of {result.totalPages}</span>
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

import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Eye, Pencil, ArrowLeft, ArrowRight, Cpu } from "lucide-react"
import { listCasesAction } from "./actions"
import { EligibilityFilters } from "./components/eligibility-filters"
import { DeleteCaseButton, SeedCasesButton } from "./components/eligibility-actions"
import { derive, type Decision } from "@/lib/eligibility"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const DECISION_STYLE: Record<Decision, string> = {
  "AI Draft": "bg-indigo-100 text-indigo-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
}

interface SP { q?: string; category?: string; decision?: string; page?: string }

export default async function EligibilityPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listCasesAction({ query: sp.q, category: sp.category, decision: sp.decision, page })
  const demo = !isSupabaseAdminConfigured()
  const s = result.summary

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, category: sp.category, decision: sp.decision })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/eligibility?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Eligibility & Compliance Checker</PageHeaderHeading>
        <PageHeaderDescription>
          Native-AI policy-as-code: capture the facts and the Reasoning Engine fires the published rules
          (scheme eligibility, RTE, scholarships, school compliance) to <strong>derive each conclusion with the rule
          and a plain-language reason</strong>. An officer then approves or rejects (AI assists, the human decides).
        </PageHeaderDescription>
        <PageHeaderActions>
          <SeedCasesButton />
          <Button asChild><Link href="/eligibility/new"><PlusCircle className="mr-2 h-4 w-4" />New case</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing representative <strong>demo cases</strong> — no database is configured. Provision Supabase and seed to manage live cases.
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Cases", String(s.total), "text-foreground"],
          ["Rule fired (conclusion)", String(s.withConclusion), "text-indigo-700"],
          ["Approved", String(s.approved), "text-green-700"],
          ["Pending decision", String(s.pending), "text-amber-700"],
        ].map(([label, value, color]) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <EligibilityFilters />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Rule set</TableHead>
                <TableHead>AI conclusion</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.cases.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground"><Cpu className="mx-auto mb-2 h-8 w-8" />No cases found. Adjust filters, seed demo cases, or add a new one.</TableCell></TableRow>
              ) : (
                result.cases.map((c) => {
                  const r = derive(c.facts, c.category)
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.subject}<div className="text-xs text-muted-foreground">{c.reference}</div></TableCell>
                      <TableCell>{c.category}</TableCell>
                      <TableCell className="text-sm">{r.conclusions.length === 0 ? <span className="text-muted-foreground">No rule fired</span> : <span>{r.conclusions[0].conclusion}{r.conclusions.length > 1 ? ` +${r.conclusions.length - 1}` : ""}</span>}</TableCell>
                      <TableCell><Badge className={`${DECISION_STYLE[c.decision]} border-0`}>{c.decision}</Badge></TableCell>
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        <Button asChild variant="outline" size="icon"><Link href={`/eligibility/${c.id}`} aria-label="View"><Eye className="h-4 w-4" /></Link></Button>
                        <Button asChild variant="outline" size="icon"><Link href={`/eligibility/${c.id}/edit`} aria-label="Edit"><Pencil className="h-4 w-4" /></Link></Button>
                        <DeleteCaseButton id={c.id} label={c.subject} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {result.cases.length} of {result.total} case{result.total === 1 ? "" : "s"} · page {result.page} of {result.totalPages}</span>
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

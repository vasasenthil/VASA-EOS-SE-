import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Eye, Pencil, ArrowLeft, ArrowRight, Library } from "lucide-react"
import { listLoansAction } from "./actions"
import { LoanFilters } from "./components/loan-filters"
import { DeleteLoanButton, MarkReturnedButton, SeedLoansButton } from "./components/loan-actions"
import { loanStatus, fineDue, inr, type LoanStatus } from "@/lib/librarycirc"
import { safeDate } from "@/lib/format-date"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const STATUS_STYLE: Record<LoanStatus, string> = {
  Issued: "bg-blue-100 text-blue-700",
  Overdue: "bg-red-100 text-red-700",
  Returned: "bg-green-100 text-green-700",
}

interface SP { q?: string; status?: string; category?: string; memberType?: string; sort?: "dueDate" | "title" | "member"; page?: string }

export default async function LibraryCirculationPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listLoansAction({ query: sp.q, status: sp.status, category: sp.category, memberType: sp.memberType, sortBy: sp.sort ?? "dueDate", sortDir: "asc", page })
  const demo = !isSupabaseAdminConfigured()
  const s = result.summary

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, status: sp.status, category: sp.category, memberType: sp.memberType, sort: sp.sort })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/library-circulation?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Library Circulation</PageHeaderHeading>
        <PageHeaderDescription>Issue and return books per copy and member — with due dates, renewals and automatic overdue-fine calculation. Filter, search, issue, return and waive fines.</PageHeaderDescription>
        <PageHeaderActions>
          <SeedLoansButton />
          <Button asChild><Link href="/library-circulation/new"><PlusCircle className="mr-2 h-4 w-4" />Issue book</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing representative <strong>demo loans</strong> — no database is configured. Provision Supabase and seed to manage live circulation.
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Issued", String(s.issued), "text-blue-700"],
          ["Overdue", String(s.overdue), "text-red-700"],
          ["Returned", String(s.returned), "text-green-700"],
          ["Fine due", inr(s.fineDue), "text-amber-700"],
        ].map(([label, value, color]) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <LoanFilters />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead className="hidden lg:table-cell">Accession</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Fine</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.loans.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground"><Library className="mx-auto mb-2 h-8 w-8" />No loans found. Adjust filters, seed demo loans, or issue a book.</TableCell></TableRow>
              ) : (
                result.loans.map((l) => {
                  const st = loanStatus(l)
                  const fine = fineDue(l)
                  return (
                    <TableRow key={l.id} className={st === "Overdue" ? "bg-red-50/40" : undefined}>
                      <TableCell className="font-medium">{l.title}<div className="text-xs text-muted-foreground">{l.author} · {l.category}</div></TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-xs">{l.accessionNo}</TableCell>
                      <TableCell>{l.member}<div className="text-xs text-muted-foreground">{l.memberType}{l.classLevel ? ` · ${l.classLevel}` : ""}</div></TableCell>
                      <TableCell className="whitespace-nowrap">{safeDate(l.dueDate, "dd MMM yyyy")}</TableCell>
                      <TableCell><Badge className={`${STATUS_STYLE[st]} border-0`}>{st}</Badge></TableCell>
                      <TableCell className="text-right tabular-nums">{fine > 0 ? inr(fine) : "—"}</TableCell>
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        {st !== "Returned" ? <MarkReturnedButton id={l.id} /> : null}
                        <Button asChild variant="outline" size="icon"><Link href={`/library-circulation/${l.id}`} aria-label="View"><Eye className="h-4 w-4" /></Link></Button>
                        <Button asChild variant="outline" size="icon"><Link href={`/library-circulation/${l.id}/edit`} aria-label="Edit"><Pencil className="h-4 w-4" /></Link></Button>
                        <DeleteLoanButton id={l.id} title={l.title} />
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
        <span>Showing {result.loans.length} of {result.total} loan{result.total === 1 ? "" : "s"} · page {result.page} of {result.totalPages}</span>
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

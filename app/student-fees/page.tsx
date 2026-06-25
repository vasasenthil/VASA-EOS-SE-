import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Eye, Pencil, ArrowLeft, ArrowRight, Wallet, AlertTriangle } from "lucide-react"
import { listFeesAction } from "./actions"
import { FeeFilters } from "./components/fee-filters"
import { DeleteFeeButton } from "./components/delete-fee-button"
import { SeedFeesButton } from "./components/seed-fees-button"
import { netDemand, totalPaid, balance, paymentStatus, isDefaulter, inr, type PaymentStatus } from "@/lib/studentfees"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const STATUS_STYLE: Record<PaymentStatus, string> = {
  Paid: "bg-green-100 text-green-700",
  Partial: "bg-yellow-100 text-yellow-700",
  Pending: "bg-red-100 text-red-700",
}

interface SP { q?: string; class?: string; section?: string; status?: string; defaulter?: string; sort?: "student" | "balance" | "dueDate"; page?: string }

export default async function StudentFeesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listFeesAction({ query: sp.q, classLevel: sp.class, section: sp.section, status: sp.status, defaulter: sp.defaulter === "1", sortBy: sp.sort, sortDir: sp.sort === "balance" ? "desc" : "asc", page })
  const demo = !isSupabaseAdminConfigured()
  const s = result.summary

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, class: sp.class, section: sp.section, status: sp.status, defaulter: sp.defaulter, sort: sp.sort })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/student-fees?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Student Fees & Collections</PageHeaderHeading>
        <PageHeaderDescription>Per-student fee records — fee heads (demand), concessions and DBT/scholarship linkage, a receipts ledger (collection), and the resulting balance, payment status and defaulter flag. Filter, search, record receipts and chase defaulters.</PageHeaderDescription>
        <PageHeaderActions>
          <SeedFeesButton />
          <Button asChild><Link href="/student-fees/new"><PlusCircle className="mr-2 h-4 w-4" />New fee record</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing representative <strong>demo fee records</strong> — no database is configured. Provision Supabase and seed to manage live fees.
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Demand", inr(s.demand), "text-foreground"],
          ["Collected", inr(s.collected), "text-green-700"],
          ["Outstanding", inr(s.outstanding), "text-red-700"],
          ["Collection rate", `${s.collectionRate}%`, "text-blue-700"],
          ["Defaulters", String(s.defaulters), "text-amber-700"],
        ].map(([label, value, color]) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <FeeFilters />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="text-center">Class</TableHead>
                <TableHead className="text-right">Net demand</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Concession</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.records.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground"><Wallet className="mx-auto mb-2 h-8 w-8" />No fee records found. Adjust filters, seed demo data, or add a new record.</TableCell></TableRow>
              ) : (
                result.records.map((r) => {
                  const def = isDefaulter(r)
                  return (
                    <TableRow key={r.id} className={def ? "bg-red-50/40" : undefined}>
                      <TableCell className="font-medium">
                        <span className="inline-flex items-center gap-1">{r.student}{def ? <AlertTriangle className="h-3.5 w-3.5 text-red-600" /> : null}</span>
                      </TableCell>
                      <TableCell className="text-center">{r.classLevel}-{r.section}</TableCell>
                      <TableCell className="text-right tabular-nums">{inr(netDemand(r))}</TableCell>
                      <TableCell className="text-right tabular-nums">{inr(totalPaid(r.receipts))}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{inr(balance(r))}</TableCell>
                      <TableCell><Badge className={`${STATUS_STYLE[paymentStatus(r)]} border-0`}>{paymentStatus(r)}</Badge></TableCell>
                      <TableCell className="hidden md:table-cell text-xs">{r.concessionType === "None" ? "—" : r.concessionType}</TableCell>
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        <Button asChild variant="outline" size="icon"><Link href={`/student-fees/${r.id}`} aria-label="View"><Eye className="h-4 w-4" /></Link></Button>
                        <Button asChild variant="outline" size="icon"><Link href={`/student-fees/${r.id}/edit`} aria-label="Edit"><Pencil className="h-4 w-4" /></Link></Button>
                        <DeleteFeeButton id={r.id} student={r.student} />
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
        <span>Showing {result.records.length} of {result.total} record{result.total === 1 ? "" : "s"} · page {result.page} of {result.totalPages}</span>
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

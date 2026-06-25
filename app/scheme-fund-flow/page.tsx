import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Eye, Pencil, ArrowLeft, ArrowRight, Wallet, AlertTriangle } from "lucide-react"
import { listFundsAction } from "./actions"
import { FundFilters } from "./components/fund-filters"
import { DeleteFundButton, SeedFundsButton } from "./components/fund-actions"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

function inrCr(n: number): string {
  return n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)} L` : `₹${Math.round(n).toLocaleString("en-IN")}`
}

interface SP { q?: string; scheme?: string; tier?: string; sort?: "allocated" | "utilisation" | "scheme"; page?: string }

export default async function SchemeFundFlowPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listFundsAction({ query: sp.q, scheme: sp.scheme, tier: sp.tier, sortBy: sp.sort, sortDir: "desc", page })
  const demo = !isSupabaseAdminConfigured()
  const s = result.summary

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, scheme: sp.scheme, tier: sp.tier, sort: sp.sort })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/scheme-fund-flow?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Scheme Fund-Flow Ledger</PageHeaderHeading>
        <PageHeaderDescription>The platform&apos;s local books for centrally/state-sponsored schemes — allocated → released → utilised. PFMS is the national source of truth; reconcile each scheme against it from the Federation console to surface fund-flow drift (potential leakage). Federate, never duplicate.</PageHeaderDescription>
        <PageHeaderActions>
          <SeedFundsButton />
          <Button asChild variant="outline"><Link href="/federation"><ArrowRight className="mr-2 h-4 w-4" />Reconcile vs PFMS</Link></Button>
          <Button asChild><Link href="/scheme-fund-flow/new"><PlusCircle className="mr-2 h-4 w-4" />New row</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing a representative <strong>demo fund-flow ledger</strong> — no database is configured. Provision Supabase and seed to manage live data.
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Schemes tracked", String(s.total), "text-foreground"],
          ["Allocated", inrCr(s.allocated), "text-foreground"],
          ["Released", inrCr(s.released), "text-blue-700"],
          ["Utilised", inrCr(s.utilised), "text-green-700"],
        ].map(([label, value, color]) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Aggregate utilisation (utilised ÷ released)</span><span className="font-semibold">{s.utilisationPct}%</span></div>
          <Progress value={s.utilisationPct} className="mt-2" />
          {s.lowUtilisation > 0 ? <p className="mt-2 inline-flex items-center gap-1 text-xs text-amber-700"><AlertTriangle className="h-3.5 w-3.5" />{s.lowUtilisation} scheme(s) utilising under 50% of released funds — parked-money watchlist.</p> : null}
        </CardContent>
      </Card>

      <FundFilters />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scheme</TableHead>
                <TableHead>Tier · FY</TableHead>
                <TableHead className="text-right">Allocated</TableHead>
                <TableHead className="text-right">Released</TableHead>
                <TableHead className="text-right">Utilised</TableHead>
                <TableHead className="text-right">Utilisation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.rows.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground"><Wallet className="mx-auto mb-2 h-8 w-8" />No fund-flow rows. Adjust filters, seed demo data, or add one.</TableCell></TableRow>
              ) : (
                result.rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.schemeName}<div className="text-xs text-muted-foreground">{r.schemeCode}</div></TableCell>
                    <TableCell className="whitespace-nowrap">{r.tier} · {r.financialYear}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{inrCr(r.allocated)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{inrCr(r.released)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{inrCr(r.utilised)}</TableCell>
                    <TableCell className="text-right"><Badge className={`border-0 ${r.utilisationPct < 50 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>{r.utilisationPct}%</Badge></TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <Button asChild variant="outline" size="icon"><Link href={`/scheme-fund-flow/${r.id}`} aria-label="View"><Eye className="h-4 w-4" /></Link></Button>
                      <Button asChild variant="outline" size="icon"><Link href={`/scheme-fund-flow/${r.id}/edit`} aria-label="Edit"><Pencil className="h-4 w-4" /></Link></Button>
                      <DeleteFundButton id={r.id} label={r.schemeCode} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {result.rows.length} of {result.total} row{result.total === 1 ? "" : "s"} · page {result.page} of {result.totalPages}</span>
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

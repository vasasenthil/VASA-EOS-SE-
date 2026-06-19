import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Pencil, GitCompareArrows, AlertTriangle } from "lucide-react"
import { getFundAction } from "../actions"
import { DeleteFundButton } from "../components/fund-actions"
import { view } from "@/lib/fundledger"
import { safeDate } from "@/lib/format-date"

export const dynamic = "force-dynamic"

function inrCr(n: number): string {
  return n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)} L` : `₹${Math.round(n).toLocaleString("en-IN")}`
}

export default async function FundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await getFundAction(id)

  if (!r) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Fund-flow row not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this ledger row. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/scheme-fund-flow"><ArrowLeft className="mr-2 h-4 w-4" />Back to ledger</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const v = view(r)
  const lowUtil = v.utilisationPct < 50
  const rows: Array<[string, string]> = [
    ["Scheme code", r.schemeCode],
    ["Financial year", r.financialYear],
    ["Tier", r.tier],
    ["Allocated", inrCr(r.allocated)],
    ["Released", `${inrCr(r.released)} (${v.releaseRate}% of allocated)`],
    ["Utilised", `${inrCr(r.utilised)} (${v.utilisationPct}% of released)`],
    ["Unreleased", inrCr(Math.max(0, v.unreleased))],
    ["Unspent (released, not utilised)", inrCr(Math.max(0, v.unspent))],
    ["As of", safeDate(r.asOf, "dd MMM yyyy")],
  ]

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{r.schemeName}</PageHeaderHeading>
        <PageHeaderDescription>{r.schemeCode} · {r.tier} · FY {r.financialYear}</PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline"><Link href="/federation"><GitCompareArrows className="mr-2 h-4 w-4" />Reconcile vs PFMS</Link></Button>
          <Button asChild variant="outline"><Link href={`/scheme-fund-flow/${r.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link></Button>
          <DeleteFundButton id={r.id} label={r.schemeCode} redirectTo="/scheme-fund-flow" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm"><Link href="/scheme-fund-flow"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <Badge className={`border-0 ${lowUtil ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>Utilisation {v.utilisationPct}%</Badge>
        {lowUtil ? <Badge className="bg-amber-100 text-amber-700 border-0"><AlertTriangle className="mr-1 h-3 w-3" />Parked-money watchlist</Badge> : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Fund flow</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              {rows.map(([k, val]) => (
                <div key={k} className="flex justify-between border-b py-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium text-right">{val}</dd></div>
              ))}
            </dl>
            {r.notes ? <p className="mt-3 text-sm"><span className="text-muted-foreground">Notes: </span>{r.notes}</p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Flow progress</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div><div className="flex items-center justify-between"><span className="text-muted-foreground">Release rate</span><span className="font-semibold">{v.releaseRate}%</span></div><Progress value={v.releaseRate} className="mt-1" /></div>
            <div><div className="flex items-center justify-between"><span className="text-muted-foreground">Utilisation</span><span className="font-semibold">{v.utilisationPct}%</span></div><Progress value={v.utilisationPct} className="mt-1" /></div>
            <p className="text-xs text-muted-foreground">PFMS is the national source of truth for these figures. Open the Federation console and reconcile this scheme code to detect any drift between these local books and PFMS — a tight tolerance flags potential leakage or mis-posting.</p>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

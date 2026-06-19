import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Scale, TrendingDown } from "lucide-react"
import { listOutcomes } from "@/lib/outcomes/store"
import { equityAllocation } from "@/lib/outcomes/allocation"

export const dynamic = "force-dynamic"

function inrCr(n: number): string {
  return n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)} L` : `₹${Math.round(n).toLocaleString("en-IN")}`
}

interface SP { pool?: string }

export default async function AllocationPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const pool = sp.pool && Number.isFinite(Number(sp.pool)) ? Math.max(0, Number(sp.pool)) : 5_000_000_000 // ₹500 Cr default
  const records = await listOutcomes()
  const plan = equityAllocation(records, pool)
  const pools: Array<[string, number]> = [["₹250 Cr", 2_500_000_000], ["₹500 Cr", 5_000_000_000], ["₹1,000 Cr", 10_000_000_000]]

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Equity-Weighted Resource Allocation</PageHeaderHeading>
        <PageHeaderDescription>Evidence-fed prioritisation — the allocation is driven by each district&apos;s MEASURED Quality Index (not a hand-set need index): a district scoring worse on real outcomes carries more need and draws a larger per-student share. &ldquo;Equal&rdquo; is not &ldquo;equitable&rdquo;; the progressivity ratio makes the politics of the split visible. Resources follow the priority order — to where the gap actually is.</PageHeaderDescription>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm"><Link href="/outcomes"><ArrowLeft className="mr-2 h-4 w-4" />Back to outcomes</Link></Button>
        <span className="text-sm text-muted-foreground">Envelope:</span>
        {pools.map(([label, v]) => (
          <Button key={label} asChild size="sm" variant={v === pool ? "default" : "outline"}><Link href={`/outcomes/allocation?pool=${v}`}>{label}</Link></Button>
        ))}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Envelope</p><p className="mt-1 text-lg font-semibold">{inrCr(plan.pool)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="flex items-center gap-1 text-xs text-muted-foreground"><Scale className="h-3.5 w-3.5" />Progressivity ratio</p><p className={`mt-1 text-lg font-semibold ${plan.progressivity >= 1.15 ? "text-green-700" : "text-amber-700"}`}>{plan.progressivity}×</p><p className="text-[11px] text-muted-foreground">highest-need ÷ lowest-need per-student</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="flex items-center gap-1 text-xs text-muted-foreground"><TrendingDown className="h-3.5 w-3.5" />Top priority</p><p className="mt-1 text-lg font-semibold">{plan.topPriority}</p><p className="text-[11px] text-muted-foreground">served first — worst measured index</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>District</TableHead>
                <TableHead className="text-right">Quality Index</TableHead>
                <TableHead className="text-right">Need</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Allocation</TableHead>
                <TableHead className="text-right">Per student</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plan.lines.map((l, i) => (
                <TableRow key={l.district} className={i === 0 ? "bg-amber-50/40" : undefined}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{l.district}</TableCell>
                  <TableCell className="text-right"><Badge className={`border-0 ${l.index >= 75 ? "bg-green-100 text-green-700" : l.index >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{l.index}</Badge></TableCell>
                  <TableCell className="text-right">{l.need}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{l.cohort.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-right whitespace-nowrap font-medium">{inrCr(l.share)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">₹{l.perStudent.toLocaleString("en-IN")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">Flat baseline would be ₹{plan.equalPerStudent.toLocaleString("en-IN")}/student; the equity split lifts the highest-need district above that and trims the lowest-need one. Need = 100 − measured Quality Index; weight = students × (1 + need/100).</p>
    </Shell>
  )
}

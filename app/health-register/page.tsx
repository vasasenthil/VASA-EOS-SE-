import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Eye, Pencil, ArrowLeft, ArrowRight, HeartPulse, AlertTriangle } from "lucide-react"
import { listHealthAction } from "./actions"
import { HealthFilters } from "./components/health-filters"
import { DeleteHealthButton, SeedHealthButton } from "./components/health-actions"
import { bmi, bmiBand, isAnaemic, needsReferral, type BmiBand } from "@/lib/healthregister"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const BAND_STYLE: Record<BmiBand, string> = { Underweight: "bg-amber-100 text-amber-700", Normal: "bg-green-100 text-green-700", Overweight: "bg-amber-100 text-amber-700", Obese: "bg-red-100 text-red-700", "—": "bg-gray-100 text-gray-600" }

interface SP { q?: string; class?: string; section?: string; band?: string; referral?: string; sort?: "student" | "bmi" | "screeningDate"; page?: string }

export default async function HealthRegisterPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listHealthAction({ query: sp.q, classLevel: sp.class, section: sp.section, band: sp.band, referral: sp.referral === "1", sortBy: sp.sort, sortDir: "desc", page })
  const demo = !isSupabaseAdminConfigured()
  const s = result.summary

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, class: sp.class, section: sp.section, band: sp.band, referral: sp.referral, sort: sp.sort })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/health-register?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Health Register</PageHeaderHeading>
        <PageHeaderDescription>Routine per-student health screening — anthropometry (height/weight → computed BMI + nutrition band), vision/hearing/dental, immunisation and haemoglobin (anaemia). Abnormal findings flag an RBSK referral. Filter, search, screen and refer.</PageHeaderDescription>
        <PageHeaderActions>
          <SeedHealthButton />
          <Button asChild><Link href="/health-register/new"><PlusCircle className="mr-2 h-4 w-4" />New record</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing representative <strong>demo health records</strong> — no database is configured. Provision Supabase and seed to manage the live register.
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Screened", String(s.total), "text-foreground"],
          ["Underweight", String(s.underweight), s.underweight > 0 ? "text-amber-700" : "text-foreground"],
          ["Overweight / obese", String(s.overweight), s.overweight > 0 ? "text-amber-700" : "text-foreground"],
          ["Anaemia", String(s.anaemia), s.anaemia > 0 ? "text-red-700" : "text-foreground"],
          ["Need referral", String(s.referrals), s.referrals > 0 ? "text-red-700" : "text-green-700"],
        ].map(([label, value, color]) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <HealthFilters />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="text-center">Class</TableHead>
                <TableHead className="text-center">BMI</TableHead>
                <TableHead>Band</TableHead>
                <TableHead className="hidden md:table-cell">Screening</TableHead>
                <TableHead>Referral</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.records.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground"><HeartPulse className="mx-auto mb-2 h-8 w-8" />No records found. Adjust filters, seed demo data, or add a new screening.</TableCell></TableRow>
              ) : (
                result.records.map((r) => {
                  const ref = needsReferral(r)
                  return (
                    <TableRow key={r.id} className={ref ? "bg-red-50/40" : undefined}>
                      <TableCell className="font-medium">{r.student}<div className="text-xs text-muted-foreground">{r.gender}{isAnaemic(r) ? " · anaemia" : ""}</div></TableCell>
                      <TableCell className="text-center">{r.classLevel}-{r.section}</TableCell>
                      <TableCell className="text-center tabular-nums">{bmi(r) || "—"}</TableCell>
                      <TableCell><Badge className={`${BAND_STYLE[bmiBand(r)]} border-0`}>{bmiBand(r)}</Badge></TableCell>
                      <TableCell className="hidden md:table-cell text-xs">{[r.vision !== "Normal" ? "vision" : null, r.hearing !== "Normal" ? "hearing" : null, r.dental !== "Normal" ? "dental" : null, !r.immunisationUpToDate ? "immun." : null].filter(Boolean).join(", ") || "clear"}</TableCell>
                      <TableCell>{ref ? <Badge className="bg-red-100 text-red-700 border-0"><AlertTriangle className="mr-1 h-3 w-3" />Refer</Badge> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        <Button asChild variant="outline" size="icon"><Link href={`/health-register/${r.id}`} aria-label="View"><Eye className="h-4 w-4" /></Link></Button>
                        <Button asChild variant="outline" size="icon"><Link href={`/health-register/${r.id}/edit`} aria-label="Edit"><Pencil className="h-4 w-4" /></Link></Button>
                        <DeleteHealthButton id={r.id} name={r.student} />
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

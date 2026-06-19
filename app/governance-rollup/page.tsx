import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, ChevronRight, AlertTriangle, Building2, Pencil, Layers } from "lucide-react"
import { rollupAction } from "./actions"
import { DeleteKpiButton, SeedKpisButton } from "./components/kpi-actions"
import type { AggregateKpi } from "@/lib/rollup"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

function pct(v: number, lo: number, mid: number) {
  const cls = v < lo ? "bg-red-100 text-red-700" : v < mid ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
  return <Badge className={`${cls} border-0 tabular-nums`}>{v}%</Badge>
}

function KpiCells({ u }: { u: AggregateKpi }) {
  return (
    <>
      <TableCell className="text-center">{pct(u.attendancePct, 75, 85)}</TableCell>
      <TableCell className="text-center">{pct(u.passPct, 60, 75)}</TableCell>
      <TableCell className="text-center">{pct(u.feeCollectionPct, 70, 85)}</TableCell>
      <TableCell className="text-center tabular-nums">{u.atRiskCount}</TableCell>
      <TableCell className="text-center">{u.complianceGaps > 0 ? <Badge className="bg-red-100 text-red-700 border-0">{u.complianceGaps}</Badge> : <span className="text-muted-foreground">0</span>}</TableCell>
    </>
  )
}

interface SP { district?: string; block?: string }

export default async function GovernanceRollupPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const view = await rollupAction(sp.district, sp.block)
  const demo = !isSupabaseAdminConfigured()
  const s = view.state

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Governance Roll-up</PageHeaderHeading>
        <PageHeaderDescription>
          One honest, drill-downable picture: per-school KPIs flow <strong>up</strong> the hierarchy — School → Block →
          District → State — enrolment-weighted — so a Secretary, DEO or BEO can act on evidence, not paper. Drill
          down to find exactly which units need attention.
        </PageHeaderDescription>
        <PageHeaderActions>
          <SeedKpisButton />
          <Button asChild><Link href="/governance-rollup/schools/new"><PlusCircle className="mr-2 h-4 w-4" />New school KPI</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing representative <strong>demo KPI snapshots</strong> — no database is configured. Provision Supabase and seed to manage live data.
        </div>
      ) : null}

      {/* Breadcrumb */}
      <div className="mb-4 flex flex-wrap items-center gap-1 text-sm">
        <Layers className="h-4 w-4 text-muted-foreground" />
        <Link href="/governance-rollup" className={!sp.district ? "font-semibold" : "text-primary underline"}>Tamil Nadu (State)</Link>
        {sp.district ? <><ChevronRight className="h-4 w-4 text-muted-foreground" /><Link href={`/governance-rollup?district=${encodeURIComponent(sp.district)}`} className={!sp.block ? "font-semibold" : "text-primary underline"}>{sp.district}</Link></> : null}
        {sp.block ? <><ChevronRight className="h-4 w-4 text-muted-foreground" /><span className="font-semibold">{sp.block}</span></> : null}
      </div>

      {/* State KPI cards (always shown) */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {[
          ["Schools", String(s.schools), "text-foreground"],
          ["Enrolment", s.enrolment.toLocaleString("en-IN"), "text-foreground"],
          ["Attendance", `${s.attendancePct}%`, s.attendancePct < 75 ? "text-red-700" : "text-green-700"],
          ["Pass rate", `${s.passPct}%`, s.passPct < 60 ? "text-red-700" : "text-green-700"],
          ["Fee collection", `${s.feeCollectionPct}%`, s.feeCollectionPct < 70 ? "text-red-700" : "text-green-700"],
          ["At-risk · gaps", `${s.atRiskCount} · ${s.complianceGaps}`, s.complianceGaps > 0 ? "text-amber-700" : "text-foreground"],
        ].map(([label, value, color]) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      {/* Flagged units (state/district levels) */}
      {view.flaggedUnits.length > 0 ? (
        <Card className="mb-4 border-amber-200">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" />Units needing attention</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-xs">
            {view.flaggedUnits.map((u) => (
              <Badge key={u.label} variant="outline" className="border-amber-300">{u.label}: {u.attendancePct}% att · {u.passPct}% pass{u.complianceGaps > 0 ? ` · ${u.complianceGaps} gaps` : ""}</Badge>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Drill table */}
      {view.level !== "Block" ? (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">{view.level === "State" ? "By district" : `Blocks in ${view.district}`}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{view.level === "State" ? "District" : "Block"}</TableHead>
                  <TableHead className="text-center">Schools</TableHead>
                  <TableHead className="text-right">Enrolment</TableHead>
                  <TableHead className="text-center">Attendance</TableHead>
                  <TableHead className="text-center">Pass</TableHead>
                  <TableHead className="text-center">Fee</TableHead>
                  <TableHead className="text-center">At-risk</TableHead>
                  <TableHead className="text-center">Gaps</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {view.units.map((u) => {
                  const href = view.level === "State" ? `/governance-rollup?district=${encodeURIComponent(u.label)}` : `/governance-rollup?district=${encodeURIComponent(view.district!)}&block=${encodeURIComponent(u.label)}`
                  return (
                    <TableRow key={u.label}>
                      <TableCell className="font-medium">{u.label}</TableCell>
                      <TableCell className="text-center">{u.schools}</TableCell>
                      <TableCell className="text-right tabular-nums">{u.enrolment.toLocaleString("en-IN")}</TableCell>
                      <KpiCells u={u} />
                      <TableCell className="text-right"><Button asChild variant="outline" size="sm"><Link href={href}>Drill<ChevronRight className="ml-1 h-4 w-4" /></Link></Button></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" />Schools in {view.block}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead className="text-right">Enrolment</TableHead>
                  <TableHead className="text-center">Attendance</TableHead>
                  <TableHead className="text-center">Pass</TableHead>
                  <TableHead className="text-center">Fee</TableHead>
                  <TableHead className="text-center">At-risk</TableHead>
                  <TableHead className="text-center">Gaps</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {view.schools.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.schoolName}<div className="text-xs text-muted-foreground font-mono">{k.udise}</div></TableCell>
                    <TableCell className="text-right tabular-nums">{k.enrolment.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-center">{pct(k.attendancePct, 75, 85)}</TableCell>
                    <TableCell className="text-center">{pct(k.passPct, 60, 75)}</TableCell>
                    <TableCell className="text-center">{pct(k.feeCollectionPct, 70, 85)}</TableCell>
                    <TableCell className="text-center tabular-nums">{k.atRiskCount}</TableCell>
                    <TableCell className="text-center">{k.complianceGaps > 0 ? <Badge className="bg-red-100 text-red-700 border-0">{k.complianceGaps}</Badge> : <span className="text-muted-foreground">0</span>}</TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <Button asChild variant="outline" size="icon"><Link href={`/governance-rollup/schools/${k.id}/edit`} aria-label="Edit"><Pencil className="h-4 w-4" /></Link></Button>
                      <DeleteKpiButton id={k.id} name={k.schoolName} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </Shell>
  )
}

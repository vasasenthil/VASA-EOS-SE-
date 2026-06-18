import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Eye, Pencil, ArrowLeft, ArrowRight, Users, Clock } from "lucide-react"
import { listStaffAction } from "./actions"
import { StaffFilters } from "./components/staff-filters"
import { DeleteStaffButton, SeedStaffButton } from "./components/staff-actions"
import { serviceYears, totalLeaveBalance, retirementDue, type StaffStatus } from "@/lib/staffmaster"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const STATUS_STYLE: Record<StaffStatus, string> = {
  Active: "bg-green-100 text-green-700",
  "On Leave": "bg-amber-100 text-amber-700",
  Transferred: "bg-blue-100 text-blue-700",
  Retired: "bg-gray-100 text-gray-600",
  Suspended: "bg-red-100 text-red-700",
}

interface SP { q?: string; cadre?: string; designation?: string; employmentType?: string; status?: string; sort?: "name" | "service" | "staffId"; page?: string }

export default async function StaffDirectoryPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listStaffAction({ query: sp.q, cadre: sp.cadre, designation: sp.designation, employmentType: sp.employmentType, status: sp.status, sortBy: sp.sort ?? "staffId", sortDir: "asc", page })
  const demo = !isSupabaseAdminConfigured()
  const s = result.summary

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, cadre: sp.cadre, designation: sp.designation, employmentType: sp.employmentType, status: sp.status, sort: sp.sort })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/staff-directory?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Staff Directory (HR)</PageHeaderHeading>
        <PageHeaderDescription>The staff master register — designation, cadre and department, demographics, qualification and contact, employment type and service status, plus leave balances and pay scale. Filter, search, onboard and manage staff.</PageHeaderDescription>
        <PageHeaderActions>
          <SeedStaffButton />
          <Button asChild><Link href="/staff-directory/new"><PlusCircle className="mr-2 h-4 w-4" />New staff</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing representative <strong>demo staff</strong> — no database is configured. Provision Supabase and seed to manage live HR records.
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Total staff", String(s.total), "text-foreground"],
          ["Active", String(s.active), "text-green-700"],
          ["Teaching", String(s.teaching), "text-blue-700"],
          ["On leave", String(s.onLeave), "text-amber-700"],
          ["Retiring soon", String(s.retiringSoon), s.retiringSoon > 0 ? "text-red-700" : "text-foreground"],
        ].map(([label, value, color]) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <StaffFilters />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead className="hidden md:table-cell">Designation</TableHead>
                <TableHead className="hidden lg:table-cell">Department</TableHead>
                <TableHead className="text-right">Service</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Leave</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.staff.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground"><Users className="mx-auto mb-2 h-8 w-8" />No staff found. Adjust filters, seed demo data, or add a new staff record.</TableCell></TableRow>
              ) : (
                result.staff.map((m) => {
                  const retire = m.status !== "Retired" && retirementDue(m.dob)
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}<div className="text-xs text-muted-foreground font-mono">{m.staffId} · {m.cadre}{retire ? " · retiring soon" : ""}</div></TableCell>
                      <TableCell className="hidden md:table-cell">{m.designation}</TableCell>
                      <TableCell className="hidden lg:table-cell">{m.department}</TableCell>
                      <TableCell className="text-right tabular-nums">{serviceYears(m.doj)} yr{retire ? <Clock className="ml-1 inline h-3.5 w-3.5 text-amber-600" /> : null}</TableCell>
                      <TableCell className="text-right tabular-nums hidden lg:table-cell">{totalLeaveBalance(m)}</TableCell>
                      <TableCell><Badge className={`${STATUS_STYLE[m.status]} border-0`}>{m.status}</Badge></TableCell>
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        <Button asChild variant="outline" size="icon"><Link href={`/staff-directory/${m.id}`} aria-label="View"><Eye className="h-4 w-4" /></Link></Button>
                        <Button asChild variant="outline" size="icon"><Link href={`/staff-directory/${m.id}/edit`} aria-label="Edit"><Pencil className="h-4 w-4" /></Link></Button>
                        <DeleteStaffButton id={m.id} name={m.name} />
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
        <span>Showing {result.staff.length} of {result.total} staff · page {result.page} of {result.totalPages}</span>
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

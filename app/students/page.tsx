import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Eye, Pencil, ArrowLeft, ArrowRight, Users } from "lucide-react"
import { listStudentsAction } from "./actions"
import { StudentFilters } from "./components/student-filters"
import { DeleteStudentButton } from "./components/delete-student-button"
import { SeedStudentsButton } from "./components/seed-students-button"
import { ageYears, type StudentStatus } from "@/lib/students"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const STATUS_STYLE: Record<StudentStatus, string> = {
  Enrolled: "bg-green-100 text-green-700",
  Transferred: "bg-blue-100 text-blue-700",
  Graduated: "bg-purple-100 text-purple-700",
  Dropped: "bg-gray-100 text-gray-600",
}

interface SP { q?: string; status?: string; class?: string; section?: string; category?: string; sort?: "name" | "classLevel" | "createdAt"; page?: string }

export default async function StudentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listStudentsAction({ query: sp.q, status: sp.status, classLevel: sp.class, section: sp.section, category: sp.category, sortBy: sp.sort, sortDir: "desc", page })
  const demo = !isSupabaseAdminConfigured()

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, status: sp.status, class: sp.class, section: sp.section, category: sp.category, sort: sp.sort })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/students?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Student Records</PageHeaderHeading>
        <PageHeaderDescription>The student master register (SIS) — APAAR id, demographics, class/section, guardian and enrolment status. Filter, search, create, edit and manage records.</PageHeaderDescription>
        <PageHeaderActions>
          <SeedStudentsButton />
          <Button asChild><Link href="/students/new"><PlusCircle className="mr-2 h-4 w-4" />New student</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing a representative <strong>demo register</strong> — no database is configured. Provision Supabase and seed to manage live student records.
        </div>
      ) : null}

      <StudentFilters />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden lg:table-cell">APAAR</TableHead>
                <TableHead className="text-center">Class</TableHead>
                <TableHead className="hidden md:table-cell text-center">Age</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Guardian</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.students.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground"><Users className="mx-auto mb-2 h-8 w-8" />No students found. Adjust filters, seed the demo register, or add a new record.</TableCell></TableRow>
              ) : (
                result.students.map((s) => {
                  const age = ageYears(s.dob)
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-xs">{s.apaarId}</TableCell>
                      <TableCell className="text-center">{s.classLevel}-{s.section}</TableCell>
                      <TableCell className="hidden md:table-cell text-center tabular-nums">{age >= 0 ? age : "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{s.category}</TableCell>
                      <TableCell className="hidden lg:table-cell">{s.guardianName}</TableCell>
                      <TableCell><Badge className={`${STATUS_STYLE[s.status]} border-0`}>{s.status}</Badge></TableCell>
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        <Button asChild variant="outline" size="icon"><Link href={`/students/${s.id}`} aria-label="View"><Eye className="h-4 w-4" /></Link></Button>
                        <Button asChild variant="outline" size="icon"><Link href={`/students/${s.id}/edit`} aria-label="Edit"><Pencil className="h-4 w-4" /></Link></Button>
                        <DeleteStudentButton id={s.id} name={s.name} />
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
        <span>Showing {result.students.length} of {result.total} student{result.total === 1 ? "" : "s"} · page {result.page} of {result.totalPages}</span>
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

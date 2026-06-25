import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil } from "lucide-react"
import { getStudentAction } from "../actions"
import { DeleteStudentButton } from "../components/delete-student-button"
import { ageYears } from "@/lib/students"
import { safeDate } from "@/lib/format-date"

export const dynamic = "force-dynamic"

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const s = await getStudentAction(id)

  if (!s) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Student not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this student record. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/students"><ArrowLeft className="mr-2 h-4 w-4" />Back to register</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const age = ageYears(s.dob)
  const rows: Array<[string, string]> = [
    ["APAAR id", s.apaarId],
    ["Gender", s.gender],
    ["Date of birth", `${safeDate(s.dob, "dd MMM yyyy")}${age >= 0 ? ` (${age} yrs)` : ""}`],
    ["Class & section", `Class ${s.classLevel} — ${s.section}`],
    ["Category", s.category],
    ["Guardian", s.guardianName],
    ["Contact", s.contactPhone],
    ["Enrolled", safeDate(s.createdAt, "dd MMM yyyy")],
    ["Last updated", safeDate(s.updatedAt, "dd MMM yyyy")],
  ]

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{s.name}</PageHeaderHeading>
        <PageHeaderDescription>Class {s.classLevel}-{s.section} · {s.apaarId}</PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline"><Link href={`/students/${s.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link></Button>
          <DeleteStudentButton id={s.id} name={s.name} redirectTo="/students" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex items-center gap-3">
        <Button asChild variant="outline" size="sm"><Link href="/students"><ArrowLeft className="mr-2 h-4 w-4" />Back to register</Link></Button>
        <Badge>{s.status}</Badge>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between border-b py-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </Shell>
  )
}

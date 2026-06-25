import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil } from "lucide-react"
import { getHolidayAction } from "../actions"
import { DeleteHolidayButton } from "../components/delete-holiday-button"
import { holidayDays } from "@/lib/holidays"
import { safeDate } from "@/lib/format-date"

export const dynamic = "force-dynamic"

export default async function HolidayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const h = await getHolidayAction(id)

  if (!h) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Holiday not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this holiday. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/holidays"><ArrowLeft className="mr-2 h-4 w-4" />Back to calendar</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const rows: Array<[string, string]> = [
    ["Category", h.category],
    ["Start date", safeDate(h.startDate, "dd MMM yyyy")],
    ["End date", safeDate(h.endDate, "dd MMM yyyy")],
    ["Duration", `${holidayDays(h)} day${holidayDays(h) === 1 ? "" : "s"}`],
    ["Recurring", h.recurring ? "Yes — every year (same month/day)" : "No"],
    ["Academic year", h.academicYear],
    ["Status", h.status],
    ["Description", h.description || "—"],
    ["Created", safeDate(h.createdAt, "dd MMM yyyy")],
    ["Last updated", safeDate(h.updatedAt, "dd MMM yyyy")],
  ]

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{h.name}</PageHeaderHeading>
        <PageHeaderDescription>{h.category} · {safeDate(h.startDate, "dd MMM yyyy")}{h.endDate !== h.startDate ? ` – ${safeDate(h.endDate, "dd MMM yyyy")}` : ""}</PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline"><Link href={`/holidays/${h.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link></Button>
          <DeleteHolidayButton id={h.id} name={h.name} redirectTo="/holidays" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex items-center gap-3">
        <Button asChild variant="outline" size="sm"><Link href="/holidays"><ArrowLeft className="mr-2 h-4 w-4" />Back to calendar</Link></Button>
        <Badge>{h.status}</Badge>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between border-b py-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium text-right">{v}</dd></div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </Shell>
  )
}

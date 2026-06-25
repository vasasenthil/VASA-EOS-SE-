import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil } from "lucide-react"
import { getLoanAction } from "../actions"
import { DeleteLoanButton, MarkReturnedButton } from "../components/loan-actions"
import { loanStatus, overdueDays, fineDue, canRenew, inr } from "@/lib/librarycirc"
import { safeDate } from "@/lib/format-date"

export const dynamic = "force-dynamic"

export default async function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const l = await getLoanAction(id)

  if (!l) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Loan not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this loan. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/library-circulation"><ArrowLeft className="mr-2 h-4 w-4" />Back to circulation</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const st = loanStatus(l)
  const fine = fineDue(l)
  const rows: Array<[string, string]> = [
    ["Accession no", l.accessionNo],
    ["Author", l.author],
    ["Category", l.category],
    ["Member", `${l.member} (${l.memberId})`],
    ["Member type", `${l.memberType}${l.classLevel ? ` · Class ${l.classLevel}` : ""}`],
    ["Issued", safeDate(l.issueDate, "dd MMM yyyy")],
    ["Due", safeDate(l.dueDate, "dd MMM yyyy")],
    ["Returned", l.returnDate ? safeDate(l.returnDate, "dd MMM yyyy") : "—"],
    ["Renewals", `${l.renewalCount}${canRenew(l) ? " (renewable)" : ""}`],
    ["Overdue", `${overdueDays(l)} day(s)`],
    ["Fine / day", inr(l.finePerDay)],
    ["Fine waived", inr(l.fineWaived)],
    ["Fine due", inr(fine)],
  ]

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{l.title}</PageHeaderHeading>
        <PageHeaderDescription>{l.accessionNo} · issued to {l.member} · due {safeDate(l.dueDate, "dd MMM yyyy")}</PageHeaderDescription>
        <PageHeaderActions>
          {st !== "Returned" ? <MarkReturnedButton id={l.id} label="Mark returned" /> : null}
          <Button asChild variant="outline"><Link href={`/library-circulation/${l.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link></Button>
          <DeleteLoanButton id={l.id} title={l.title} redirectTo="/library-circulation" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm"><Link href="/library-circulation"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <Badge className={st === "Returned" ? "bg-green-100 text-green-700 border-0" : st === "Overdue" ? "bg-red-100 text-red-700 border-0" : "bg-blue-100 text-blue-700 border-0"}>{st}</Badge>
        {fine > 0 ? <Badge className="bg-red-100 text-red-700 border-0">Fine {inr(fine)}</Badge> : null}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Loan details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between border-b py-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium text-right">{v}</dd></div>
            ))}
          </dl>
          {l.notes ? <p className="mt-4 text-sm"><span className="text-muted-foreground">Notes: </span>{l.notes}</p> : null}
        </CardContent>
      </Card>
    </Shell>
  )
}

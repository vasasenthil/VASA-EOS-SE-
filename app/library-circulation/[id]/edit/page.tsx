import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getLoanAction } from "../../actions"
import { LoanForm } from "../../components/loan-form"
import type { LoanInput } from "@/lib/librarycirc"

export const dynamic = "force-dynamic"

export default async function EditLoanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const l = await getLoanAction(id)

  if (!l) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Loan not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/library-circulation"><ArrowLeft className="mr-2 h-4 w-4" />Back to circulation</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: LoanInput = {
    accessionNo: l.accessionNo, title: l.title, author: l.author, category: l.category, member: l.member, memberId: l.memberId,
    memberType: l.memberType, classLevel: l.classLevel, issueDate: l.issueDate, dueDate: l.dueDate, returnDate: l.returnDate,
    renewalCount: l.renewalCount, finePerDay: l.finePerDay, fineWaived: l.fineWaived, notes: l.notes,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit loan — {l.title}</PageHeaderHeading>
        <PageHeaderDescription>Update the loan, record a return or waive a fine. Changes are audited.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/library-circulation/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to loan</Link></Button></div>
      <LoanForm id={id} initial={initial} />
    </Shell>
  )
}

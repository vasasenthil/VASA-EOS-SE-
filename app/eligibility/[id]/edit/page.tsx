import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getCaseAction } from "../../actions"
import { EligibilityForm } from "../../components/eligibility-form"
import type { CaseInput } from "@/lib/eligibility"

export const dynamic = "force-dynamic"

export default async function EditEligibilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await getCaseAction(id)

  if (!c) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Case not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/eligibility"><ArrowLeft className="mr-2 h-4 w-4" />Back to cases</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: CaseInput = {
    subject: c.subject, reference: c.reference, category: c.category, facts: c.facts, decision: c.decision, decidedBy: c.decidedBy, notes: c.notes,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit {c.subject}</PageHeaderHeading>
        <PageHeaderDescription>Update the facts or record the decision. The engine derivation recomputes live. Changes are audited.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/eligibility/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to case</Link></Button></div>
      <EligibilityForm id={id} initial={initial} />
    </Shell>
  )
}

import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getProposalAction } from "../../actions"
import { ProposalForm } from "../../components/proposal-form"
import type { ProposalInput } from "@/lib/policysim"

export const dynamic = "force-dynamic"

export default async function EditProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getProposalAction(id)

  if (!p) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Proposal not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/policy-simulator"><ArrowLeft className="mr-2 h-4 w-4" />Back to simulator</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: ProposalInput = {
    title: p.title, scheme: p.scheme, scope: p.scope, population: p.population, baselineCoveragePct: p.baselineCoveragePct,
    unitCost: p.unitCost, targetCoveragePct: p.targetCoveragePct, equityWeighted: p.equityWeighted, status: p.status,
    decidedBy: p.decidedBy, sanctionedBudget: p.sanctionedBudget, notes: p.notes,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit {p.title}</PageHeaderHeading>
        <PageHeaderDescription>Update the lever or record the sanction decision. The engine projection recomputes live. Changes are audited.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/policy-simulator/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to proposal</Link></Button></div>
      <ProposalForm id={id} initial={initial} />
    </Shell>
  )
}

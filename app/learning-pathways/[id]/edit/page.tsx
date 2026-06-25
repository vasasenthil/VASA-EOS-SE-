import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getPathwayAction } from "../../actions"
import { PathwayForm } from "../../components/pathway-form"
import type { PathwayInput } from "@/lib/pathways"

export const dynamic = "force-dynamic"

export default async function EditPathwayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getPathwayAction(id)

  if (!p) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Pathway not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/learning-pathways"><ArrowLeft className="mr-2 h-4 w-4" />Back to pathways</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: PathwayInput = {
    student: p.student, apaarId: p.apaarId, classLevel: p.classLevel, section: p.section, subject: p.subject, title: p.title,
    objectives: p.objectives, threshold: p.threshold, planStatus: p.planStatus, approvedBy: p.approvedBy, plan: p.plan,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit {p.title}</PageHeaderHeading>
        <PageHeaderDescription>Update mastery or approve the pathway. The engine recommendation recomputes live. Changes are audited.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/learning-pathways/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to pathway</Link></Button></div>
      <PathwayForm id={id} initial={initial} />
    </Shell>
  )
}

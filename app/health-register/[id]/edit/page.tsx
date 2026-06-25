import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getHealthAction } from "../../actions"
import { HealthForm } from "../../components/health-form"
import type { HealthInput } from "@/lib/healthregister"

export const dynamic = "force-dynamic"

export default async function EditHealthPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await getHealthAction(id)

  if (!r) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Record not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/health-register"><ArrowLeft className="mr-2 h-4 w-4" />Back to register</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: HealthInput = {
    student: r.student, apaarId: r.apaarId, classLevel: r.classLevel, section: r.section, gender: r.gender, screeningDate: r.screeningDate,
    heightCm: r.heightCm, weightKg: r.weightKg, vision: r.vision, hearing: r.hearing, dental: r.dental,
    immunisationUpToDate: r.immunisationUpToDate, hemoglobin: r.hemoglobin, remarks: r.remarks,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit {r.student}</PageHeaderHeading>
        <PageHeaderDescription>Update the screening. BMI, band and referral flags recompute live. Changes are audited.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/health-register/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to record</Link></Button></div>
      <HealthForm id={id} initial={initial} />
    </Shell>
  )
}

import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getKpiAction } from "../../../actions"
import { KpiForm } from "../../../components/kpi-form"
import type { KpiInput } from "@/lib/rollup"

export const dynamic = "force-dynamic"

export default async function EditKpiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const k = await getKpiAction(id)

  if (!k) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Snapshot not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/governance-rollup"><ArrowLeft className="mr-2 h-4 w-4" />Back to roll-up</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: KpiInput = {
    schoolName: k.schoolName, udise: k.udise, district: k.district, block: k.block, enrolment: k.enrolment,
    attendancePct: k.attendancePct, passPct: k.passPct, feeCollectionPct: k.feeCollectionPct, atRiskCount: k.atRiskCount,
    complianceGaps: k.complianceGaps, academicYear: k.academicYear,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit {k.schoolName}</PageHeaderHeading>
        <PageHeaderDescription>Update the school&apos;s KPIs. The roll-up recomputes across block, district and state. Changes are audited.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/governance-rollup?district=${encodeURIComponent(k.district)}&block=${encodeURIComponent(k.block)}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to block</Link></Button></div>
      <KpiForm id={id} initial={initial} />
    </Shell>
  )
}

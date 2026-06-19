import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { KpiForm } from "../../components/kpi-form"

export default function NewKpiPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New School KPI Snapshot</PageHeaderHeading>
        <PageHeaderDescription>Capture a school&apos;s KPIs — they roll up (enrolment-weighted) to block, district and state.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/governance-rollup"><ArrowLeft className="mr-2 h-4 w-4" />Back to roll-up</Link></Button></div>
      <KpiForm />
    </Shell>
  )
}

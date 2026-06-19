import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { HealthForm } from "../components/health-form"

export default function NewHealthPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Health Record</PageHeaderHeading>
        <PageHeaderDescription>Record a screening — BMI, nutrition band and referral flags are computed automatically.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/health-register"><ArrowLeft className="mr-2 h-4 w-4" />Back to register</Link></Button></div>
      <HealthForm />
    </Shell>
  )
}

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { StaffForm } from "../components/staff-form"

export default function NewStaffPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Staff Record</PageHeaderHeading>
        <PageHeaderDescription>Onboard a staff member — identity, role, demographics, contact, service and leave balances.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/staff-directory"><ArrowLeft className="mr-2 h-4 w-4" />Back to directory</Link></Button></div>
      <StaffForm />
    </Shell>
  )
}

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ReferralFormUI } from "./referral-form"

export default function NewReferralPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New RBSK Health Referral</PageHeaderHeading>
        <PageHeaderDescription>
          A screening record under Rashtriya Bal Swasthya Karyakaram: the RBSK category (4 Ds), severity, screening
          date (not in the future), findings, and DPDP-consented guardian contact. The form triages the case and
          decides specialist referral automatically, then routes Headmaster → Block Medical Officer → District DEIC
          (for referral cases), with a full audit trail.
        </PageHeaderDescription>
      </PageHeader>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/health-referrals"><ArrowLeft className="mr-2 h-4 w-4" />Back to referrals inbox</Link>
        </Button>
      </div>
      <ReferralFormUI />
    </Shell>
  )
}

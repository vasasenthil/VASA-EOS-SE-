import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { FundForm } from "../components/fund-form"

export default function NewFundPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Fund-Flow Row</PageHeaderHeading>
        <PageHeaderDescription>Record the local books for a scheme — allocated, released and utilised. Release rate and utilisation compute live; the fund-flow invariant (allocated ≥ released ≥ utilised) is enforced.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/scheme-fund-flow"><ArrowLeft className="mr-2 h-4 w-4" />Back to ledger</Link></Button></div>
      <FundForm />
    </Shell>
  )
}

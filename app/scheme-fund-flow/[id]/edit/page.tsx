import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getFundAction } from "../../actions"
import { FundForm } from "../../components/fund-form"
import type { FundLedgerInput } from "@/lib/fundledger"

export const dynamic = "force-dynamic"

export default async function EditFundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await getFundAction(id)

  if (!r) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Fund-flow row not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/scheme-fund-flow"><ArrowLeft className="mr-2 h-4 w-4" />Back to ledger</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: FundLedgerInput = {
    schemeCode: r.schemeCode, schemeName: r.schemeName, financialYear: r.financialYear, tier: r.tier,
    allocated: r.allocated, released: r.released, utilised: r.utilised, asOf: r.asOf, notes: r.notes,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit {r.schemeName}</PageHeaderHeading>
        <PageHeaderDescription>Update the local fund-flow books. Release rate and utilisation recompute live. Changes are audited.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/scheme-fund-flow/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to row</Link></Button></div>
      <FundForm id={id} initial={initial} />
    </Shell>
  )
}

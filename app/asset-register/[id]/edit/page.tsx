import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getAssetAction } from "../../actions"
import { AssetForm } from "../../components/asset-form"
import type { AssetInput } from "@/lib/assetmgmt"

export const dynamic = "force-dynamic"

export default async function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const a = await getAssetAction(id)

  if (!a) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Asset not found</CardTitle></CardHeader>
          <CardContent><Button asChild variant="outline" size="sm"><Link href="/asset-register"><ArrowLeft className="mr-2 h-4 w-4" />Back to register</Link></Button></CardContent>
        </Card>
      </Shell>
    )
  }

  const initial: AssetInput = {
    assetTag: a.assetTag, name: a.name, category: a.category, location: a.location, quantity: a.quantity, unit: a.unit,
    condition: a.condition, status: a.status, assignedTo: a.assignedTo, purchaseDate: a.purchaseDate, unitCost: a.unitCost,
    usefulLifeYears: a.usefulLifeYears, reorderLevel: a.reorderLevel, fundingSource: a.fundingSource, notes: a.notes,
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Edit {a.name}</PageHeaderHeading>
        <PageHeaderDescription>Update the asset, condition, assignment or valuation. Changes are audited.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href={`/asset-register/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to asset</Link></Button></div>
      <AssetForm id={id} initial={initial} />
    </Shell>
  )
}

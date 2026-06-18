import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil, AlertTriangle } from "lucide-react"
import { getAssetAction } from "../actions"
import { DeleteAssetButton } from "../components/asset-actions"
import { totalValue, bookValue, accumulatedDepreciation, assetAgeYears, isLowStock, inr } from "@/lib/assetmgmt"
import { safeDate } from "@/lib/format-date"

export const dynamic = "force-dynamic"

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const a = await getAssetAction(id)

  if (!a) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Asset not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this asset. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/asset-register"><ArrowLeft className="mr-2 h-4 w-4" />Back to register</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const low = isLowStock(a)
  const identity: Array<[string, string]> = [
    ["Asset tag", a.assetTag],
    ["Category", a.category],
    ["Location", a.location],
    ["Quantity", `${a.quantity} ${a.unit}`],
    ["Condition", a.condition],
    ["Status", a.status],
    ["Assigned to", a.assignedTo || "—"],
    ["Reorder level", String(a.reorderLevel)],
    ["Funding source", a.fundingSource],
  ]
  const valuation: Array<[string, string]> = [
    ["Purchase date", safeDate(a.purchaseDate, "dd MMM yyyy")],
    ["Age", `${assetAgeYears(a.purchaseDate).toFixed(1)} yrs`],
    ["Useful life", `${a.usefulLifeYears} yrs`],
    ["Unit cost", inr(a.unitCost)],
    ["Purchase value", inr(totalValue(a))],
    ["Accumulated depreciation", inr(accumulatedDepreciation(a))],
    ["Book value (now)", inr(bookValue(a))],
  ]

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{a.name}</PageHeaderHeading>
        <PageHeaderDescription>{a.assetTag} · {a.category} · {a.location}</PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline"><Link href={`/asset-register/${a.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link></Button>
          <DeleteAssetButton id={a.id} name={a.name} redirectTo="/asset-register" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm"><Link href="/asset-register"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <Badge>{a.status}</Badge>
        <Badge variant="secondary">{a.condition}</Badge>
        {low ? <Badge className="bg-red-100 text-red-700 border-0"><AlertTriangle className="mr-1 h-3 w-3" />Low stock</Badge> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Identity & condition</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              {identity.map(([k, v]) => (
                <div key={k} className="flex justify-between border-b py-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium text-right">{v}</dd></div>
              ))}
            </dl>
            {a.notes ? <p className="mt-3 text-sm"><span className="text-muted-foreground">Notes: </span>{a.notes}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Valuation (straight-line)</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              {valuation.map(([k, v]) => (
                <div key={k} className="flex justify-between border-b py-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium text-right">{v}</dd></div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

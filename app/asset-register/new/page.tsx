import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AssetForm } from "../components/asset-form"

export default function NewAssetPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Asset</PageHeaderHeading>
        <PageHeaderDescription>Register an asset or stock line — identity, condition, procurement and valuation. Total and book value compute automatically.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/asset-register"><ArrowLeft className="mr-2 h-4 w-4" />Back to register</Link></Button></div>
      <AssetForm />
    </Shell>
  )
}

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { AssetRegister } from "./asset-register"

export default function AssetsPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Asset Register</PageHeaderHeading>
        <PageHeaderDescription>
          Tag and track fixed assets by category, location and condition. Assets in poor or unusable condition are
          surfaced as needing attention and feed the maintenance pipeline.
        </PageHeaderDescription>
      </PageHeader>
      <AssetRegister />
    </Shell>
  )
}

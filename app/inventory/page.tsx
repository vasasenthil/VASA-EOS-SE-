import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { InventoryDesk } from "./inventory-desk"
import { listMovementsAction } from "./actions"

export default async function InventoryPage() {
  const initial = await listMovementsAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Inventory Issue / Receive</PageHeaderHeading>
        <PageHeaderDescription>
          Record stock movements for textbooks, notebooks, uniforms, cycles and laptops — issues draw stock down, receipts
          replenish it, and items at or below their reorder level are flagged live.
        </PageHeaderDescription>
      </PageHeader>
      <InventoryDesk initial={initial} />
    </Shell>
  )
}

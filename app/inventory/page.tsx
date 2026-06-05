import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { InventoryDesk } from "./inventory-desk"

export default function InventoryPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Inventory Issue / Receive</PageHeaderHeading>
        <PageHeaderDescription>
          Record stock movements for textbooks, notebooks, uniforms, cycles and laptops — issues draw stock down, receipts
          replenish it, and items at or below their reorder level are flagged live.
        </PageHeaderDescription>
      </PageHeader>
      <InventoryDesk />
    </Shell>
  )
}

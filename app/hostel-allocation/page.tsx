import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { AllocationBoard } from "./allocation-board"

export default function HostelAllocationPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Hostel Allocation</PageHeaderHeading>
        <PageHeaderDescription>
          Allocate and vacate beds across the Adi Dravidar, BC/MBC, KGBV and Tribal welfare hostels — occupancy and free
          beds update live, and full hostels are flagged.
        </PageHeaderDescription>
      </PageHeader>
      <AllocationBoard />
    </Shell>
  )
}

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { DistributionBoard } from "./distribution-board"

export default function DistributionPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Free-Scheme Distribution</PageHeaderHeading>
        <PageHeaderDescription>
          Track free textbooks, uniforms, cycles and laptops from entitled → issued → acknowledged, with last-mile
          coverage. Production reconciles against inventory and the beneficiary&apos;s APAAR record.
        </PageHeaderDescription>
      </PageHeader>
      <DistributionBoard />
    </Shell>
  )
}

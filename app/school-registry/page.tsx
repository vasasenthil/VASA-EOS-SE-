import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { integrationModes } from "@/lib/integrations"
import { SchoolLookup } from "./school-lookup"
import { ReconciliationPanel } from "./reconciliation-panel"

export default function SchoolRegistryPage() {
  const mode = integrationModes.udise
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Registry (UDISE+)</PageHeaderHeading>
        <PageHeaderDescription>
          The UDISE+ school registry behind a typed port. With INTEGRATION_UDISE=live and a UDISE_BASE_URL gateway it
          federates a real state-hosted registry; otherwise it returns deterministic mock records. Each response is
          tagged with its adapter mode and a trace id for transparency and audit.
        </PageHeaderDescription>
      </PageHeader>
      <div className="space-y-6">
        <ReconciliationPanel />
        <SchoolLookup mode={mode} />
      </div>
    </Shell>
  )
}

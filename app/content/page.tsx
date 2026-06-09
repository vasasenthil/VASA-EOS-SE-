import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { integrationModes } from "@/lib/integrations"
import { ContentExplorer } from "./content-explorer"

export default function ContentPage() {
  const mode = integrationModes.diksha
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Content Discovery (DIKSHA)</PageHeaderHeading>
        <PageHeaderDescription>
          The DIKSHA content backbone behind a typed port. This is the platform&apos;s first real HTTP-backed integration:
          with INTEGRATION_DIKSHA=live it calls the public DIKSHA Composite Search API; otherwise it returns deterministic
          mock results. Either way the response is tagged with its adapter mode for transparency and audit.
        </PageHeaderDescription>
      </PageHeader>
      <ContentExplorer mode={mode} />
    </Shell>
  )
}

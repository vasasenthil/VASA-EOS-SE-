import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { AccessExplorer } from "./access-explorer"

export default function AccessExplorerPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Access Explorer (5-model PDP)</PageHeaderHeading>
        <PageHeaderDescription>
          Evaluate the platform&apos;s unified access policy live — pick a role, an action and a request context, and see
          the Policy Decision Point&apos;s verdict and reason. The same `requireAccess()` guard enforces this in server
          actions; deny policies win and absent any grant access fails closed.
        </PageHeaderDescription>
      </PageHeader>
      <AccessExplorer />
    </Shell>
  )
}

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { ForumBoard } from "./forum-board"
import { listForumsAction } from "./actions"
import { getCurrentRole } from "@/lib/auth/current-role"

export const dynamic = "force-dynamic"

export default async function GovernanceForumsPage() {
  const [initial, role] = await Promise.all([listForumsAction(), getCurrentRole()])
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Governance Forums &amp; Meetings (RACI)</PageHeaderHeading>
        <PageHeaderDescription>
          Run the recurring coordination forums as real, audited processes: table an agenda item, let a quorum of
          members adopt the resolution, and have the chair ratify significant items. Dynamic routing skips Minister
          ratification for routine business. Items flow into the Oversight Command Centre. Switch role to act as the
          Secretary, a Director, or the Minister.
        </PageHeaderDescription>
      </PageHeader>
      <ForumBoard initial={initial} sessionRole={role} />
    </Shell>
  )
}

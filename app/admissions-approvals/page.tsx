import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { AdmissionsApprovalBoard } from "./admissions-approval-board"
import { listApplicantsAction } from "./actions"
import { getCurrentRole } from "@/lib/auth/current-role"

export default async function AdmissionsApprovalsPage() {
  const [initial, role] = await Promise.all([listApplicantsAction(), getCurrentRole()])
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Admissions Approval Workflow</PageHeaderHeading>
        <PageHeaderDescription>
          A two-level intake flow on the workflow engine: the Academic Head verifies documents, then the Principal
          enrols the student — at which point an APAAR id is minted. Acts as your signed-in role; full audit trail.
        </PageHeaderDescription>
      </PageHeader>
      <AdmissionsApprovalBoard initial={initial} sessionRole={role} />
    </Shell>
  )
}

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"
import Link from "next/link"
import { SafetyIncidentBoard } from "./safety-incident-board"
import { listIncidentsAction } from "./actions"
import { getCurrentRole } from "@/lib/auth/current-role"

export const dynamic = "force-dynamic"

export default async function SafetyIncidentsPage() {
  const [initial, role] = await Promise.all([listIncidentsAction(), getCurrentRole()])
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Child-Safety Incidents (POCSO)</PageHeaderHeading>
        <PageHeaderDescription>
          A safeguarding workflow: an incident is verified by the Headmaster (who makes any mandatory CWC/Police report
          within 24 hours), reviewed at the block, and — for POCSO or high-severity cases — escalated to the District
          Child Protection Unit, with a tamper-evident audit trail. POCSO §23 confidentiality is enforced: no victim
          identity is captured. Switch role to act at each tier.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild>
            <Link href="/safety-incidents/new"><FilePlus className="mr-2 h-4 w-4" />Report incident</Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>
      <SafetyIncidentBoard initial={initial} sessionRole={role} />
    </Shell>
  )
}

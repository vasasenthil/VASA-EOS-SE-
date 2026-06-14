import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { getCurrentRole } from "@/lib/auth/current-role"
import { countAwaiting } from "@/lib/workflow/pending"
import type { WorkflowDef, WorkflowInstance } from "@/lib/workflow"
import {
  RECOGNITION_APPROVAL,
  GRIEVANCE_ESCALATION,
  ADMISSION_APPROVAL,
  LEAVE_APPROVAL,
  SMC_RESOLUTION,
  MAINTENANCE_WORKFLOW,
  FORUM_RESOLUTION,
  SCHOLARSHIP_SANCTION,
  HEALTH_REFERRAL,
  TRANSFER_REQUEST,
  INFRA_WORKS,
  SAFETY_INCIDENT,
  RTI_REQUEST,
  GEM_PROCUREMENT,
} from "@/lib/workflow/definitions"
import { listRecognitionsAction } from "@/app/recognition-approvals/actions"
import { listGrievanceFlowsAction } from "@/app/grievance-approvals/actions"
import { listApplicantsAction } from "@/app/admissions-approvals/actions"
import { listLeaveFlowsAction } from "@/app/leave-approvals/actions"
import { listResolutionsAction } from "@/app/smc-approvals/actions"
import { listTicketFlowsAction } from "@/app/maintenance-approvals/actions"
import { listForumsAction } from "@/app/governance/forums/actions"
import { listScholarshipsAction } from "@/app/scholarship-approvals/actions"
import { listReferralsAction } from "@/app/health-referrals/actions"
import { listTransfersAction } from "@/app/transfer-approvals/actions"
import { listWorksAction } from "@/app/works-approvals/actions"
import { listIncidentsAction } from "@/app/safety-incidents/actions"
import { listRtisAction } from "@/app/rti-approvals/actions"
import { listIndentsAction } from "@/app/procurement-approvals/actions"

export const dynamic = "force-dynamic"

type Item = { instance: WorkflowInstance }

interface Vertical {
  label: string
  route: string
  def: WorkflowDef
  domain: string
  fetch: () => Promise<Item[]>
}

const VERTICALS: Vertical[] = [
  { label: "School Recognition", route: "/recognition-approvals", def: RECOGNITION_APPROVAL, domain: "Policy & Governance", fetch: listRecognitionsAction },
  { label: "Grievance Redressal", route: "/grievance-approvals", def: GRIEVANCE_ESCALATION, domain: "Identity & Data", fetch: listGrievanceFlowsAction },
  { label: "Student Admission (RTE)", route: "/admissions-approvals", def: ADMISSION_APPROVAL, domain: "Academic & Assessment", fetch: listApplicantsAction },
  { label: "Teacher Leave", route: "/leave-approvals", def: LEAVE_APPROVAL, domain: "Roles & Hierarchy", fetch: listLeaveFlowsAction },
  { label: "SMC Resolution", route: "/smc-approvals", def: SMC_RESOLUTION, domain: "Policy & Governance", fetch: listResolutionsAction },
  { label: "Maintenance Ticket", route: "/maintenance-approvals", def: MAINTENANCE_WORKFLOW, domain: "Infrastructure & Records", fetch: listTicketFlowsAction },
  { label: "Governance Forum", route: "/governance/forums", def: FORUM_RESOLUTION, domain: "Policy & Governance", fetch: listForumsAction },
  { label: "Scholarship / Benefit (DBT)", route: "/scholarship-approvals", def: SCHOLARSHIP_SANCTION, domain: "Schemes & Welfare", fetch: listScholarshipsAction },
  { label: "RBSK Health Referral", route: "/health-referrals", def: HEALTH_REFERRAL, domain: "Health, Safety & Welfare", fetch: listReferralsAction },
  { label: "Teacher Transfer", route: "/transfer-approvals", def: TRANSFER_REQUEST, domain: "Roles & Hierarchy", fetch: listTransfersAction },
  { label: "Infrastructure Works", route: "/works-approvals", def: INFRA_WORKS, domain: "Infrastructure & Records", fetch: listWorksAction },
  { label: "Child-Safety Incident (POCSO)", route: "/safety-incidents", def: SAFETY_INCIDENT, domain: "Health, Safety & Welfare", fetch: listIncidentsAction },
  { label: "RTI Request", route: "/rti-approvals", def: RTI_REQUEST, domain: "Identity & Data", fetch: listRtisAction },
  { label: "GeM Procurement", route: "/procurement-approvals", def: GEM_PROCUREMENT, domain: "Schemes & Welfare", fetch: listIndentsAction },
]

export default async function ApprovalsHubPage() {
  const role = await getCurrentRole()
  const scoped = !!role && role !== "ADMIN"
  const lists = await Promise.all(VERTICALS.map((v) => v.fetch().catch(() => [] as Item[])))

  const rows = VERTICALS.map((v, i) => {
    const items = lists[i]
    const open = items.filter((it) => it.instance.status === "in_progress").length
    const awaiting = scoped ? countAwaiting(items, v.def, role as string) : 0
    return { ...v, open, awaiting, total: items.length }
  }).sort((a, b) => b.awaiting - a.awaiting || b.open - a.open)

  const totalAwaiting = rows.reduce((n, r) => n + r.awaiting, 0)
  const totalOpen = rows.reduce((n, r) => n + r.open, 0)

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>My Approvals</PageHeaderHeading>
        <PageHeaderDescription>
          Every workflow-backed approval across the platform in one inbox. {scoped ? (
            <>Acting as <strong>{role}</strong>: <strong>{totalAwaiting}</strong> case(s) await your decision across {rows.filter((r) => r.awaiting > 0).length} workflow(s); {totalOpen} open in total.</>
          ) : (
            <>Showing all <strong>{totalOpen}</strong> open case(s) across {VERTICALS.length} workflows — switch to a specific role to see the queue gated to that tier.</>
          )}
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <Card key={r.route} className={r.awaiting > 0 ? "border-primary/40" : undefined}>
            <CardContent className="flex flex-col gap-2 py-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{r.label}</div>
                  <div className="text-xs text-muted-foreground">{r.domain}</div>
                </div>
                {r.awaiting > 0 ? <Badge>{r.awaiting} for you</Badge> : <Badge variant="outline">{r.open} open</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">{r.open} in progress · {r.total} total</div>
              <Button asChild size="sm" variant="ghost" className="mt-1 justify-between">
                <Link href={r.route}>Open inbox <ArrowRight className="h-4 w-4 opacity-50" /></Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </Shell>
  )
}

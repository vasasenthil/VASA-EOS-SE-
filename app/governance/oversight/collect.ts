import "server-only"

import { currentStep, progress, type WorkflowDef, type WorkflowInstance } from "@/lib/workflow"
import { WORKFLOW_DEFS } from "@/lib/workflow/definitions"
import type { OversightItem } from "@/lib/governance/oversight"

import { listLeaveFlows } from "@/lib/leaveflow/store"
import { listResolutions } from "@/lib/smcflow/store"
import { listRecognitions } from "@/lib/recognitionflow/store"
import { listApplicants } from "@/lib/admissionsflow/store"
import { listGrievanceFlows } from "@/lib/grievanceflow/store"
import { listTicketFlows } from "@/lib/maintenanceflow/store"
import { listForums } from "@/lib/forumflow/store"

const DEF_BY_ID = new Map<string, WorkflowDef>(WORKFLOW_DEFS.map((d) => [d.id, d]))

function lastUpdated(inst: WorkflowInstance): string {
  const h = inst.history
  return h.length ? h[h.length - 1].at : ""
}

function project(recordId: string, title: string, inst: WorkflowInstance): OversightItem {
  const def = DEF_BY_ID.get(inst.defId)
  const step = def ? currentStep(def, inst) : null
  return {
    flowId: inst.defId,
    flowLabel: def?.name ?? inst.defId,
    recordId,
    title,
    status: inst.status,
    currentRole: step?.approverRole ?? null,
    currentStepName: step?.name ?? null,
    pct: def ? progress(def, inst).pct : 0,
    updatedAt: lastUpdated(inst),
  }
}

/** Gather every live approval instance across the six flows. Fail-soft per flow. */
export async function collectOversight(): Promise<OversightItem[]> {
  const [leave, smc, recog, adm, grv, maint, forum] = await Promise.all([
    listLeaveFlows().catch(() => []),
    listResolutions().catch(() => []),
    listRecognitions().catch(() => []),
    listApplicants().catch(() => []),
    listGrievanceFlows().catch(() => []),
    listTicketFlows().catch(() => []),
    listForums().catch(() => []),
  ])

  return [
    ...leave.map((r) => project(r.id, `${r.teacher} — ${r.type} (${r.days}d)`, r.instance)),
    ...smc.map((r) => project(r.id, r.title, r.instance)),
    ...recog.map((r) => project(r.id, `${r.school}, ${r.district} (${r.type})`, r.instance)),
    ...adm.map((r) => project(r.id, `${r.name} — ${r.className}`, r.instance)),
    ...grv.map((r) => project(r.id, `${r.applicant} — ${r.category}`, r.instance)),
    ...maint.map((r) => project(r.id, `${r.category} — ${r.priority}`, r.instance)),
    ...forum.map((r) => project(r.id, `${r.forum} — ${r.title}`, r.instance)),
  ]
}

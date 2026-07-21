import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PORTALS, type PortalRole } from "@/config/portals"
import { stakeholderWorkflowSummary, workflowsForStakeholder } from "@/lib/workflow/stakeholders"

const ACTION_LABEL = {
  initiate: "Can initiate",
  approve: "Approves",
  observe: "Observes",
}

export default function StakeholderWorkflowPage() {
  const summary = stakeholderWorkflowSummary()
  const roles = Object.keys(PORTALS) as PortalRole[]

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Dynamic Stakeholder Workflow Matrix</PageHeaderHeading>
        <PageHeaderDescription>
          A generated, per-role map of the platform workflow engine: every stakeholder portal receives a lane to
          initiate, approve, or observe workflow-backed cases, and approver lanes are derived from the live workflow
          step definitions rather than duplicated in the UI.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-sm">Stakeholders covered</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{summary.rolesCovered}/{summary.roles}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Workflows routed</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{summary.workflowsCovered}/{summary.workflows}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Dynamic workflows</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{summary.dynamicWorkflows}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Total lanes</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{summary.lanes}</CardContent></Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {roles.map((role) => {
          const portal = PORTALS[role]
          const lanes = workflowsForStakeholder(role)
          return (
            <Card key={role}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{portal.label}</CardTitle>
                    <p className="text-xs text-muted-foreground">{portal.tier} · {portal.home}</p>
                  </div>
                  <Badge variant="outline">{role}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lanes.map((lane) => (
                    <div key={`${lane.role}-${lane.workflowId}`} className="rounded-md border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{lane.workflowName}</span>
                        {lane.actions.map((action) => <Badge key={action} variant="secondary">{ACTION_LABEL[action]}</Badge>)}
                      </div>
                      {lane.approverSteps.length ? (
                        <p className="mt-1 text-xs text-muted-foreground">Approval step: {lane.approverSteps.join("; ")}</p>
                      ) : null}
                      {lane.dynamicSteps.length ? (
                        <p className="mt-1 text-xs text-muted-foreground">Dynamic branch: {lane.dynamicSteps.join("; ")}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </Shell>
  )
}

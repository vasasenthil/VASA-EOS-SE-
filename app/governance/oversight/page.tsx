import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { collectOversight } from "./collect"
import {
  summarizeOversight,
  rollupByFlow,
  pendingByRole,
  agingProfile,
} from "@/lib/governance/oversight"

export const dynamic = "force-dynamic"

// Inbox route for each approval process, so an overseer can jump straight to act.
const INBOX: Record<string, string> = {
  "leave-approval": "/leave-approvals",
  "smc-resolution": "/smc-approvals",
  "recognition-approval": "/recognition-approvals",
  "admission-approval": "/admissions-approvals",
  "grievance-escalation": "/grievance-approvals",
  "maintenance-workflow": "/maintenance-approvals",
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  in_progress: "secondary",
  approved: "default",
  rejected: "destructive",
}

export default async function GovernanceOversightPage() {
  const items = await collectOversight()
  const s = summarizeOversight(items)
  const flows = rollupByFlow(items)
  const roles = pendingByRole(items)
  const aging = agingProfile(items)

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Governance Oversight — Command Centre</PageHeaderHeading>
        <PageHeaderDescription>
          A live, cross-process rollup of every approval in flight across the platform —
          leave, SMC resolutions, school recognition, admissions, grievances and maintenance.
          Who is each item waiting on, how the backlog is aging, and where to act.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/oversight/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download register (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-semibold">{s.total}</div>
            <div className="text-sm text-muted-foreground">Items tracked</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-semibold">{s.inProgress}</div>
            <div className="text-sm text-muted-foreground">Awaiting decision ({s.activePct}%)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.approved}</div>
            <div className="text-sm text-muted-foreground">Approved / resolved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-semibold text-destructive">{s.rejected}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By process</CardTitle>
          </CardHeader>
          <CardContent>
            {flows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No approval activity yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Process</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Approved</TableHead>
                    <TableHead className="text-right">Rejected</TableHead>
                    <TableHead className="text-right">Inbox</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flows.map((f) => (
                    <TableRow key={f.flowId}>
                      <TableCell className="font-medium">{f.flowLabel}</TableCell>
                      <TableCell className="text-right">{f.inProgress}</TableCell>
                      <TableCell className="text-right">{f.approved}</TableCell>
                      <TableCell className="text-right">{f.rejected}</TableCell>
                      <TableCell className="text-right">
                        {INBOX[f.flowId] ? (
                          <Link className="text-primary underline underline-offset-4" href={INBOX[f.flowId]}>
                            Open
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Awaiting which role</CardTitle>
          </CardHeader>
          <CardContent>
            {roles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing is currently awaiting a decision.</p>
            ) : (
              <div className="space-y-2">
                {roles.map((r) => (
                  <div key={r.role} className="flex items-center justify-between">
                    <span className="font-mono text-sm">{r.role}</span>
                    <Badge variant="secondary">{r.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Backlog aging (in-progress)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-5">
            {aging.map((a) => (
              <div key={a.bucket} className="rounded-lg border p-3 text-center">
                <div className="text-xl font-semibold">{a.count}</div>
                <div className="text-xs text-muted-foreground">{a.bucket}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Live register</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items in any flow yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Process</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Awaiting</TableHead>
                  <TableHead className="text-right">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((i) => (
                  <TableRow key={`${i.flowId}:${i.recordId}`}>
                    <TableCell className="text-muted-foreground">{i.flowLabel}</TableCell>
                    <TableCell className="font-medium">{i.title}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[i.status]}>{i.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      {i.currentRole ? (
                        <span className="font-mono text-sm">{i.currentRole}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                      {i.currentStepName ? (
                        <span className="ml-2 text-xs text-muted-foreground">{i.currentStepName}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">{i.pct}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Shell>
  )
}

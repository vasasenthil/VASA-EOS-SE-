import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { resolveSubject } from "@/lib/access/resolve"
import {
  SCOPE_TENANTS,
  SCOPE_RECORDS,
  scopeRecords,
  visibleTenantIds,
  jurisdictionLabel,
  nodeForRole,
  scopeBreakdown,
} from "@/lib/access/scope"

export const dynamic = "force-dynamic"

export default async function ScopeExplorerPage() {
  const subject = await resolveSubject()
  const role = subject.roles[0]
  const node = nodeForRole(role)
  const visible = node ? scopeRecords(SCOPE_TENANTS, node, SCOPE_RECORDS) : []
  const visibleNodeIds = node ? new Set(visibleTenantIds(SCOPE_TENANTS, node)) : new Set<string>()
  const matrix = scopeBreakdown()

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Data Scope Explorer (ReBAC Jurisdiction)</PageHeaderHeading>
        <PageHeaderDescription>
          Downward-governance scoping made operational: every role sees only the records within its jurisdiction
          subtree — a Principal one school, a BEO a block, a DEO a district, the State everything. Set
          <code className="mx-1 rounded bg-muted px-1">DEMO_ROLE</code> (or sign in as a role) and watch the data narrow.
        </PageHeaderDescription>
      </PageHeader>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your jurisdiction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge>{role}</Badge>
            <span className="text-sm text-muted-foreground">
              {node ? jurisdictionLabel(SCOPE_TENANTS, node) : "No hierarchy jurisdiction (e.g. vendor / researcher / public)"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Visible school records: <strong>{visible.length}</strong> of {SCOPE_RECORDS.length}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Records you can see</CardTitle>
          </CardHeader>
          <CardContent>
            {visible.length === 0 ? (
              <p className="text-sm text-muted-foreground">No records in your jurisdiction.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead className="text-right">Enrolment</TableHead>
                    <TableHead className="text-right">Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-right">{r.enrolment.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right">{r.attendancePct}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jurisdiction tree</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {SCOPE_TENANTS.map((t) => {
                const depth = t.id.split("-").length - 1
                const inScope = visibleNodeIds.has(t.id)
                return (
                  <li
                    key={t.id}
                    style={{ paddingLeft: `${depth * 14}px` }}
                    className={inScope ? "" : "text-muted-foreground/40"}
                  >
                    {inScope ? "● " : "○ "}
                    {t.name} <span className="text-xs text-muted-foreground">({t.tier})</span>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Scoping matrix — what each role sees</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Anchored at</TableHead>
                <TableHead className="text-right">Nodes governed</TableHead>
                <TableHead className="text-right">Records visible</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matrix.map((m) => (
                <TableRow key={m.role} className={m.role === role ? "bg-muted/50" : ""}>
                  <TableCell className="font-medium">{m.role}</TableCell>
                  <TableCell className="text-muted-foreground">{m.nodeName}</TableCell>
                  <TableCell className="text-right">{m.visibleNodes}</TableCell>
                  <TableCell className="text-right">{m.visibleRecords}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

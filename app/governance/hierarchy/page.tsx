import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AI_CONTROL_TOWER, GOVERNANCE_TIERS, ROLE_SCOPE_MATRIX, TENANCY_HIERARCHY, governanceHierarchySummary } from "@/lib/governance/hierarchy"

export default function GovernanceHierarchyPage() {
  const summary = governanceHierarchySummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>TN Governance Structure & Hierarchies</PageHeaderHeading>
        <PageHeaderDescription>
          Canonical operating map for Tamil Nadu School Education: T0–T6 tenancy scope, G1–G7 governance authority,
          role-to-scope mappings, and AI Control Tower bodies in one audited reference page.
        </PageHeaderDescription>
      </PageHeader>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold">{summary.tenancyTiers}</div><p className="text-sm text-muted-foreground">Tenancy tiers</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold">{summary.governanceTiers}</div><p className="text-sm text-muted-foreground">Governance tiers</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold">{summary.roleMappings}</div><p className="text-sm text-muted-foreground">Role mappings</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold">{summary.aiControlBodies}</div><p className="text-sm text-muted-foreground">AI control bodies</p></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>T0–T6 tenancy hierarchy</CardTitle><CardDescription>Determines jurisdiction and data visibility.</CardDescription></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>Tier</TableHead><TableHead>Body</TableHead><TableHead>Scope</TableHead><TableHead>Authority</TableHead></TableRow></TableHeader><TableBody>
            {TENANCY_HIERARCHY.map((node) => <TableRow key={node.id}><TableCell><Badge>{node.id}</Badge> {node.label}</TableCell><TableCell>{node.body}</TableCell><TableCell>{node.scope}</TableCell><TableCell>{node.authority}</TableCell></TableRow>)}
          </TableBody></Table>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle>G1–G7 governance authority</CardTitle><CardDescription>Determines decision rights, escalation, audit and sovereign control.</CardDescription></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>Tier</TableHead><TableHead>Body</TableHead><TableHead>Scope</TableHead><TableHead>Authority</TableHead></TableRow></TableHeader><TableBody>
            {GOVERNANCE_TIERS.map((node) => <TableRow key={node.id}><TableCell><Badge variant="secondary">{node.id}</Badge> {node.label}</TableCell><TableCell>{node.body}</TableCell><TableCell>{node.scope}</TableCell><TableCell>{node.authority}</TableCell></TableRow>)}
          </TableBody></Table>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle>Role-to-scope matrix</CardTitle><CardDescription>Operational guardrail for route policy, cutover and data scoping.</CardDescription></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>Role</TableHead><TableHead>Tenant scope</TableHead><TableHead>Governance tier</TableHead><TableHead>Can govern</TableHead></TableRow></TableHeader><TableBody>
            {ROLE_SCOPE_MATRIX.map((row) => <TableRow key={row.role}><TableCell className="font-medium">{row.role}</TableCell><TableCell>{row.tenancyTier}</TableCell><TableCell>{row.governanceTier}</TableCell><TableCell>{row.canGovern}</TableCell></TableRow>)}
          </TableBody></Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>AI Control Tower</CardTitle><CardDescription>Responsible AI command structure for high-stakes education decisions.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {AI_CONTROL_TOWER.map((node) => <div key={node.id} className="rounded-lg border p-4"><Badge>{node.id}</Badge><h3 className="mt-2 font-semibold">{node.label}</h3><p className="text-sm text-muted-foreground">{node.body}</p><p className="mt-2 text-sm">{node.authority}</p></div>)}
        </CardContent>
      </Card>
    </Shell>
  )
}

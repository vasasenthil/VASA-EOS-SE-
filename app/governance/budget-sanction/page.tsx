import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { BUDGET, inr } from "@/lib/finance"
import {
  SANCTION_PROPOSALS,
  availableForReappropriation,
  validateProposal,
  sanctionSummary,
  type SanctionStatus,
} from "@/lib/finance/sanction"

const STATUS_VARIANT: Record<SanctionStatus, "default" | "secondary" | "outline"> = {
  sanctioned: "default",
  proposed: "secondary",
  rejected: "outline",
}

export default function BudgetSanctionPage() {
  const s = sanctionSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Budget Sanction &amp; Re-appropriation</PageHeaderHeading>
        <PageHeaderDescription>
          The Secretary&apos;s competent-authority power over the purse: sanctioning supplementary funds to a head and
          re-appropriating <strong>savings</strong> (allocation not yet spent) between heads. The engine refuses to move
          committed money — a re-appropriation may only draw a head&apos;s unspent balance — and refuses self-transfers and
          over-draws. {s.sanctioned} of {s.proposals} proposals are sanctioned; {s.proposals - s.valid} fail validation.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/budget-sanction/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.proposals}</div><div className="text-sm text-muted-foreground">Proposals</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.sanctioned}</div><div className="text-sm text-muted-foreground">Sanctioned</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{inr(s.sanctionedAmount)}</div><div className="text-sm text-muted-foreground">Funds moved/added</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.valid}<span className="text-base text-muted-foreground"> / {s.proposals}</span></div><div className="text-sm text-muted-foreground">Pass validation</div></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="mb-3 text-sm font-semibold">Budget heads — savings available for re-appropriation</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Head</TableHead>
                <TableHead className="text-right">Allocated</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead className="text-right">Savings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {BUDGET.map((b) => (
                <TableRow key={b.head}>
                  <TableCell className="font-medium">{b.head}</TableCell>
                  <TableCell className="text-right">{inr(b.allocated)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{inr(b.spent)}</TableCell>
                  <TableCell className="text-right">{inr(availableForReappropriation(b.head))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-3 text-sm font-semibold">Sanction proposals</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Movement</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Justification</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SANCTION_PROPOSALS.map((p) => {
                const v = validateProposal(p)
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.id}</TableCell>
                    <TableCell className="text-muted-foreground">{p.kind}</TableCell>
                    <TableCell className="text-sm">{p.sourceHead ? `${p.sourceHead} → ${p.targetHead}` : `+ ${p.targetHead}`}</TableCell>
                    <TableCell className="text-right">{inr(p.amount)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.justification}
                      {!v.ok && <span className="ml-1 text-red-600 dark:text-red-500">({v.reason})</span>}
                    </TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

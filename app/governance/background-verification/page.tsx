import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { STAFF_VERIFICATIONS, VERIFICATION_CHECKS, verdict, type CheckStatus, type VerificationVerdict } from "@/lib/staff/background-verification"
import { verificationSummary } from "@/lib/staff/background-verification"

const VERDICT_VARIANT: Record<VerificationVerdict, "default" | "secondary" | "outline"> = {
  cleared: "default",
  "in-progress": "secondary",
  flagged: "outline",
}

const CHECK_MARK: Record<CheckStatus, string> = { cleared: "✓", pending: "…", flagged: "✕" }
const CHECK_CLASS: Record<CheckStatus, string> = {
  cleared: "text-green-600 dark:text-green-500",
  pending: "text-muted-foreground",
  flagged: "text-red-600 dark:text-red-500 font-semibold",
}

export default function BackgroundVerificationPage() {
  const s = verificationSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Staff Background Verification</PageHeaderHeading>
        <PageHeaderDescription>
          No adult joins a school until cleared. POCSO 2012 makes pre-appointment verification mandatory — identity,
          qualification, police verification, POCSO antecedents and medical fitness. A candidate is cleared to appoint
          ONLY when every check is cleared; a single flagged check blocks appointment outright. {s.flagged} candidates
          are flagged and {s.inProgress} are still in progress; {s.clearanceRatePct}% cleared.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/background-verification/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.total}</div><div className="text-sm text-muted-foreground">Candidates</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.cleared}</div><div className="text-sm text-muted-foreground">Cleared to appoint</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-amber-600 dark:text-amber-500">{s.inProgress}</div><div className="text-sm text-muted-foreground">In progress</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-red-600 dark:text-red-500">{s.flagged}</div><div className="text-sm text-muted-foreground">Flagged (blocked)</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                {VERIFICATION_CHECKS.map((c) => (
                  <TableHead key={c} className="text-center text-xs">{c}</TableHead>
                ))}
                <TableHead>Verdict</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STAFF_VERIFICATIONS.map((v) => (
                <TableRow key={v.staffId}>
                  <TableCell>
                    <div className="font-medium">{v.name}</div>
                    <div className="text-xs text-muted-foreground">{v.staffId} · {v.role}</div>
                  </TableCell>
                  {v.checks.map((c, i) => (
                    <TableCell key={i} className={`text-center ${CHECK_CLASS[c]}`}>{CHECK_MARK[c]}</TableCell>
                  ))}
                  <TableCell><Badge variant={VERDICT_VARIANT[verdict(v)]} className={verdict(v) === "flagged" ? "border-red-500 text-red-600 dark:text-red-500" : ""}>{verdict(v)}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}

import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { BudgetFormUI } from "./budget-form"

export default function NewBudgetPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Budget Proposal</PageHeaderHeading>
        <PageHeaderDescription>
          A rule-governed financial proposal — proposal type, budget head, amount, fiscal year and justification. Fresh
          sanctions and proposals ≥ ₹50 crore are routed automatically to the Cabinet / Minister; re-appropriations must
          name a distinct source head. It then flows Directorate → Secretariat &amp; Finance → Cabinet / Minister with a
          full audit trail.
        </PageHeaderDescription>
      </PageHeader>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/budget-approvals"><ArrowLeft className="mr-2 h-4 w-4" />Back to budget inbox</Link>
        </Button>
      </div>
      <BudgetFormUI />
    </Shell>
  )
}

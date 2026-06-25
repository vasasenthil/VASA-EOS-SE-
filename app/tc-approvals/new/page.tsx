import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { TcFormUI } from "./tc-form"

export default function NewTcPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Transfer Certificate Request</PageHeaderHeading>
        <PageHeaderDescription>
          A rule-governed leaving certificate — student, APAAR id, UDISE code, class last studied, certificate type and
          reason. A TC can never be issued with pending dues; inter-state and duplicate certificates are routed
          automatically for a Block counter-signature. It then flows Class Teacher → Headmaster → Block with a full
          audit trail and updates the APAAR migration record.
        </PageHeaderDescription>
      </PageHeader>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/tc-approvals"><ArrowLeft className="mr-2 h-4 w-4" />Back to TC inbox</Link>
        </Button>
      </div>
      <TcFormUI />
    </Shell>
  )
}

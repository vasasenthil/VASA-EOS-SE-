import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { PathwayForm } from "../components/pathway-form"

export default function NewPathwayPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>New Learning Pathway</PageHeaderHeading>
        <PageHeaderDescription>Capture the learner&apos;s mastery across objectives — the Personalisation Engine recommends the next-ready steps live; you approve the pathway.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/learning-pathways"><ArrowLeft className="mr-2 h-4 w-4" />Back to pathways</Link></Button></div>
      <PathwayForm />
    </Shell>
  )
}

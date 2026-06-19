import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { TaskForm } from "../components/task-form"

export default function NewTaskPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Dispatch an Agent Task</PageHeaderHeading>
        <PageHeaderDescription>Choose an agent and describe the task — the agent runs and returns an advisory output queued for your review.</PageHeaderDescription>
      </PageHeader>
      <div className="mb-4"><Button asChild variant="outline" size="sm"><Link href="/agent-console"><ArrowLeft className="mr-2 h-4 w-4" />Back to console</Link></Button></div>
      <TaskForm />
    </Shell>
  )
}

"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, CircleCheckBig, RefreshCw, Trash2 } from "lucide-react"
import type { AgentTask, TaskStatus } from "@/lib/agentconsole"
import { reviewTaskAction, rerunTaskAction, deleteTaskAction } from "../actions"

export function TaskReview({ task }: { task: AgentTask }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function decide(status: TaskStatus) {
    const verb = status === "Approved" ? "approve" : status === "Rejected" ? "reject" : "complete"
    const reviewedBy = window.prompt(`Your name/role to ${verb} this agent task (human authority):`, "Reviewing officer")
    if (!reviewedBy) return
    let notes = ""
    if (status === "Rejected") notes = window.prompt("Reason for rejection:", "") ?? ""
    start(async () => {
      const res = await reviewTaskAction(task.id, { status, reviewedBy, notes })
      if (res.ok) router.refresh()
      else alert(res.errors?.reviewedBy ?? res.reason ?? "Could not record the decision.")
    })
  }
  function rerun() {
    start(async () => { const res = await rerunTaskAction(task.id); if (res.ok) router.refresh(); else alert(res.reason ?? "Could not re-run.") })
  }
  function remove() {
    if (!confirm("Delete this agent task?")) return
    start(async () => { const res = await deleteTaskAction(task.id); if (res.ok) router.push("/agent-console"); else alert(res.reason ?? "Could not delete.") })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {task.status === "Pending" ? (
        <>
          {task.requiresApproval ? (
            <>
              <Button variant="outline" size="sm" disabled={pending} onClick={() => decide("Approved")}><CheckCircle2 className="mr-1 h-4 w-4 text-green-600" />Approve</Button>
              <Button variant="outline" size="sm" disabled={pending} onClick={() => decide("Rejected")}><XCircle className="mr-1 h-4 w-4 text-red-600" />Reject</Button>
            </>
          ) : (
            <Button variant="outline" size="sm" disabled={pending} onClick={() => decide("Completed")}><CircleCheckBig className="mr-1 h-4 w-4 text-green-600" />Mark completed</Button>
          )}
        </>
      ) : null}
      <Button variant="outline" size="sm" disabled={pending} onClick={rerun}><RefreshCw className="mr-1 h-4 w-4" />Re-run</Button>
      <Button variant="outline" size="sm" disabled={pending} onClick={remove}><Trash2 className="mr-1 h-4 w-4 text-red-600" />Delete</Button>
    </div>
  )
}

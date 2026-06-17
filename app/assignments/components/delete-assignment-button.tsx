"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteAssignmentAction } from "../actions"

export function DeleteAssignmentButton({ id, title, redirectTo }: { id: string; title: string; redirectTo?: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  function onDelete() {
    if (!confirm(`Delete assignment "${title}"? This cannot be undone.`)) return
    start(async () => {
      const res = await deleteAssignmentAction(id)
      if (res.ok) { if (redirectTo) router.push(redirectTo); else router.refresh() }
      else alert(res.reason ?? "Could not delete the assignment.")
    })
  }
  return (
    <Button variant="outline" size="icon" onClick={onDelete} disabled={pending} aria-label={`Delete ${title}`}>
      <Trash2 className="h-4 w-4 text-red-600" />
    </Button>
  )
}

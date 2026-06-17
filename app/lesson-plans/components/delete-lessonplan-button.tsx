"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteLessonPlanAction } from "../actions"

export function DeleteLessonPlanButton({ id, topic, redirectTo }: { id: string; topic: string; redirectTo?: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  function onDelete() {
    if (!confirm(`Delete the lesson plan "${topic}"? This cannot be undone.`)) return
    start(async () => {
      const res = await deleteLessonPlanAction(id)
      if (res.ok) { if (redirectTo) router.push(redirectTo); else router.refresh() }
      else alert(res.reason ?? "Could not delete the lesson plan.")
    })
  }
  return (
    <Button variant="outline" size="icon" onClick={onDelete} disabled={pending} aria-label={`Delete ${topic}`}>
      <Trash2 className="h-4 w-4 text-red-600" />
    </Button>
  )
}

"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteGradeAction } from "../actions"

export function DeleteGradeButton({ id, student, redirectTo }: { id: string; student: string; redirectTo?: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  function onDelete() {
    if (!confirm(`Delete the grade for "${student}"? This cannot be undone.`)) return
    start(async () => {
      const res = await deleteGradeAction(id)
      if (res.ok) { if (redirectTo) router.push(redirectTo); else router.refresh() }
      else alert(res.reason ?? "Could not delete the grade.")
    })
  }
  return (
    <Button variant="outline" size="icon" onClick={onDelete} disabled={pending} aria-label={`Delete grade for ${student}`}>
      <Trash2 className="h-4 w-4 text-red-600" />
    </Button>
  )
}

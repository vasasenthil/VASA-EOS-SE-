"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteReportCardAction } from "../actions"

export function DeleteReportCardButton({ id, student, redirectTo }: { id: string; student: string; redirectTo?: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  function onDelete() {
    if (!confirm(`Delete the report card for "${student}"? This cannot be undone.`)) return
    start(async () => {
      const res = await deleteReportCardAction(id)
      if (res.ok) { if (redirectTo) router.push(redirectTo); else router.refresh() }
      else alert(res.reason ?? "Could not delete the report card.")
    })
  }
  return (
    <Button variant="outline" size="icon" onClick={onDelete} disabled={pending} aria-label={`Delete report card for ${student}`}>
      <Trash2 className="h-4 w-4 text-red-600" />
    </Button>
  )
}

"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteTimetableAction } from "../actions"

export function DeleteTimetableButton({ id, label, redirectTo }: { id: string; label: string; redirectTo?: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  function onDelete() {
    if (!confirm(`Delete the timetable entry (${label})? This cannot be undone.`)) return
    start(async () => {
      const res = await deleteTimetableAction(id)
      if (res.ok) { if (redirectTo) router.push(redirectTo); else router.refresh() }
      else alert(res.reason ?? "Could not delete the timetable entry.")
    })
  }
  return (
    <Button variant="outline" size="icon" onClick={onDelete} disabled={pending} aria-label={`Delete ${label}`}>
      <Trash2 className="h-4 w-4 text-red-600" />
    </Button>
  )
}

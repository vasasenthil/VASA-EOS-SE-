"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteCourseAction } from "../actions"

export function DeleteCourseButton({ id, name, redirectTo }: { id: string; name: string; redirectTo?: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  function onDelete() {
    if (!confirm(`Delete course "${name}"? This cannot be undone.`)) return
    start(async () => {
      const res = await deleteCourseAction(id)
      if (res.ok) {
        if (redirectTo) router.push(redirectTo)
        else router.refresh()
      } else {
        alert(res.reason ?? "Could not delete the course.")
      }
    })
  }
  return (
    <Button variant="outline" size="icon" onClick={onDelete} disabled={pending} aria-label={`Delete ${name}`}>
      <Trash2 className="h-4 w-4 text-red-600" />
    </Button>
  )
}

"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteWorkTimeAction } from "../actions"

export function DeleteWorkTimeButton({ id, name, redirectTo }: { id: string; name: string; redirectTo?: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  function onDelete() {
    if (!confirm(`Delete the working-time profile "${name}"? This cannot be undone.`)) return
    start(async () => {
      const res = await deleteWorkTimeAction(id)
      if (res.ok) { if (redirectTo) router.push(redirectTo); else router.refresh() }
      else alert(res.reason ?? "Could not delete the profile.")
    })
  }
  return (
    <Button variant="outline" size="icon" onClick={onDelete} disabled={pending} aria-label={`Delete ${name}`}>
      <Trash2 className="h-4 w-4 text-red-600" />
    </Button>
  )
}

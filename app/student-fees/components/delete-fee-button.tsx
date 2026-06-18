"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteFeeAction } from "../actions"

export function DeleteFeeButton({ id, student, redirectTo }: { id: string; student: string; redirectTo?: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  function onDelete() {
    if (!confirm(`Delete the fee record for "${student}"? This cannot be undone.`)) return
    start(async () => {
      const res = await deleteFeeAction(id)
      if (res.ok) { if (redirectTo) router.push(redirectTo); else router.refresh() }
      else alert(res.reason ?? "Could not delete the fee record.")
    })
  }
  return (
    <Button variant="outline" size="icon" onClick={onDelete} disabled={pending} aria-label={`Delete fee record for ${student}`}>
      <Trash2 className="h-4 w-4 text-red-600" />
    </Button>
  )
}

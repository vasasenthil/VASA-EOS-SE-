"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Database } from "lucide-react"
import { deleteHealthAction, seedHealthAction } from "../actions"

export function DeleteHealthButton({ id, name, redirectTo }: { id: string; name: string; redirectTo?: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  function onDelete() {
    if (!confirm(`Delete the health record for "${name}"? This cannot be undone.`)) return
    start(async () => {
      const res = await deleteHealthAction(id)
      if (res.ok) { if (redirectTo) router.push(redirectTo); else router.refresh() }
      else alert(res.reason ?? "Could not delete the record.")
    })
  }
  return (
    <Button variant="outline" size="icon" onClick={onDelete} disabled={pending} aria-label={`Delete ${name}`}>
      <Trash2 className="h-4 w-4 text-red-600" />
    </Button>
  )
}

export function SeedHealthButton() {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <Button variant="outline" disabled={pending} onClick={() => start(async () => { await seedHealthAction(); router.refresh() })}>
      <Database className="mr-2 h-4 w-4" />Seed demo records
    </Button>
  )
}

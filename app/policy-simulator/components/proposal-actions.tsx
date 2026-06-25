"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Database } from "lucide-react"
import { deleteProposalAction, seedProposalsAction } from "../actions"

export function DeleteProposalButton({ id, label, redirectTo }: { id: string; label: string; redirectTo?: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  function onDelete() {
    if (!confirm(`Delete the proposal "${label}"? This cannot be undone.`)) return
    start(async () => {
      const res = await deleteProposalAction(id)
      if (res.ok) { if (redirectTo) router.push(redirectTo); else router.refresh() }
      else alert(res.reason ?? "Could not delete the proposal.")
    })
  }
  return (
    <Button variant="outline" size="icon" onClick={onDelete} disabled={pending} aria-label={`Delete ${label}`}>
      <Trash2 className="h-4 w-4 text-red-600" />
    </Button>
  )
}

export function SeedProposalsButton() {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <Button variant="outline" disabled={pending} onClick={() => start(async () => { await seedProposalsAction(); router.refresh() })}>
      <Database className="mr-2 h-4 w-4" />Seed demo proposals
    </Button>
  )
}

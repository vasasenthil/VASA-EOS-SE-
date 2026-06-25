"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Database, RotateCcw } from "lucide-react"
import { deleteLoanAction, seedLoansAction, markReturnedAction } from "../actions"

export function DeleteLoanButton({ id, title, redirectTo }: { id: string; title: string; redirectTo?: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  function onDelete() {
    if (!confirm(`Delete the loan for "${title}"? This cannot be undone.`)) return
    start(async () => {
      const res = await deleteLoanAction(id)
      if (res.ok) { if (redirectTo) router.push(redirectTo); else router.refresh() }
      else alert(res.reason ?? "Could not delete the loan.")
    })
  }
  return (
    <Button variant="outline" size="icon" onClick={onDelete} disabled={pending} aria-label={`Delete loan for ${title}`}>
      <Trash2 className="h-4 w-4 text-red-600" />
    </Button>
  )
}

export function MarkReturnedButton({ id, label = "Return" }: { id: string; label?: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => start(async () => {
      const res = await markReturnedAction(id)
      if (res.ok) router.refresh()
      else alert(res.reason ?? "Could not mark returned.")
    })}>
      <RotateCcw className="mr-1 h-4 w-4" />{label}
    </Button>
  )
}

export function SeedLoansButton() {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <Button variant="outline" disabled={pending} onClick={() => start(async () => { await seedLoansAction(); router.refresh() })}>
      <Database className="mr-2 h-4 w-4" />Seed demo loans
    </Button>
  )
}

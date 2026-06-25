"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Database } from "lucide-react"
import { deleteKpiAction, seedKpisAction } from "../actions"

export function DeleteKpiButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  function onDelete() {
    if (!confirm(`Delete the KPI snapshot for "${name}"? This cannot be undone.`)) return
    start(async () => { const res = await deleteKpiAction(id); if (res.ok) router.refresh(); else alert(res.reason ?? "Could not delete.") })
  }
  return (
    <Button variant="outline" size="icon" onClick={onDelete} disabled={pending} aria-label={`Delete ${name}`}>
      <Trash2 className="h-4 w-4 text-red-600" />
    </Button>
  )
}

export function SeedKpisButton() {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <Button variant="outline" disabled={pending} onClick={() => start(async () => { await seedKpisAction(); router.refresh() })}>
      <Database className="mr-2 h-4 w-4" />Seed demo KPIs
    </Button>
  )
}

"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Database } from "lucide-react"
import { deleteAssetAction, seedAssetsAction } from "../actions"

export function DeleteAssetButton({ id, name, redirectTo }: { id: string; name: string; redirectTo?: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  function onDelete() {
    if (!confirm(`Delete the asset "${name}"? This cannot be undone.`)) return
    start(async () => {
      const res = await deleteAssetAction(id)
      if (res.ok) { if (redirectTo) router.push(redirectTo); else router.refresh() }
      else alert(res.reason ?? "Could not delete the asset.")
    })
  }
  return (
    <Button variant="outline" size="icon" onClick={onDelete} disabled={pending} aria-label={`Delete ${name}`}>
      <Trash2 className="h-4 w-4 text-red-600" />
    </Button>
  )
}

export function SeedAssetsButton() {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <Button variant="outline" disabled={pending} onClick={() => start(async () => { await seedAssetsAction(); router.refresh() })}>
      <Database className="mr-2 h-4 w-4" />Seed demo assets
    </Button>
  )
}

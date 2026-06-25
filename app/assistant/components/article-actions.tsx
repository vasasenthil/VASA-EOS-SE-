"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Database } from "lucide-react"
import { deleteArticleAction, seedArticlesAction } from "../actions"

export function DeleteArticleButton({ id, title, redirectTo }: { id: string; title: string; redirectTo?: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  function onDelete() {
    if (!confirm(`Delete the article "${title}"? The assistant will no longer cite it.`)) return
    start(async () => {
      const res = await deleteArticleAction(id)
      if (res.ok) { if (redirectTo) router.push(redirectTo); else router.refresh() }
      else alert(res.reason ?? "Could not delete the article.")
    })
  }
  return (
    <Button variant="outline" size="icon" onClick={onDelete} disabled={pending} aria-label={`Delete ${title}`}>
      <Trash2 className="h-4 w-4 text-red-600" />
    </Button>
  )
}

export function SeedArticlesButton() {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <Button variant="outline" disabled={pending} onClick={() => start(async () => { await seedArticlesAction(); router.refresh() })}>
      <Database className="mr-2 h-4 w-4" />Seed TN canon
    </Button>
  )
}

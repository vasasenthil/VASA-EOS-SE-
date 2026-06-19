"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Ban } from "lucide-react"
import { revokeAction } from "../actions"

export function RevokeButton({ id }: { id: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function submit() {
    setErr(null)
    start(async () => {
      const r = await revokeAction(id, reason)
      if (r.ok) { setOpen(false); router.refresh() }
      else setErr(r.error ?? "Could not revoke.")
    })
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Ban className="mr-2 h-4 w-4 text-red-600" />Revoke
      </Button>
    )
  }
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for revocation" className="sm:w-72" />
      <div className="flex gap-2">
        <Button variant="destructive" onClick={submit} disabled={pending}>Confirm revoke</Button>
        <Button variant="ghost" onClick={() => { setOpen(false); setErr(null) }} disabled={pending}>Cancel</Button>
      </div>
      {err ? <span className="text-xs text-red-600">{err}</span> : null}
    </div>
  )
}

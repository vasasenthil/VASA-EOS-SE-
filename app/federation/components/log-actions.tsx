"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Flag, Trash2, Database } from "lucide-react"
import type { FederationLog } from "@/lib/federation"
import { reconcileAction, deleteLogAction, seedLogsAction } from "../actions"

export function ReconcileControls({ log }: { log: FederationLog }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  function decide(status: "Reconciled" | "Flagged") {
    const reconciledBy = window.prompt(`Your name/role to mark this ${status.toLowerCase()} (human authority):`, "Reviewing officer")
    if (!reconciledBy) return
    const notes = status === "Flagged" ? window.prompt("Discrepancy / reason:", "") ?? "" : ""
    start(async () => {
      const res = await reconcileAction(log.id, { status, reconciledBy, notes })
      if (res.ok) router.refresh(); else alert(res.errors?.reconciledBy ?? res.reason ?? "Could not reconcile.")
    })
  }
  function remove() {
    if (!confirm("Delete this federation log?")) return
    start(async () => { const res = await deleteLogAction(log.id); if (res.ok) router.push("/federation"); else alert(res.reason ?? "Could not delete.") })
  }
  return (
    <div className="flex flex-wrap gap-2">
      {log.status === "Pending" ? (
        <>
          <Button variant="outline" size="sm" disabled={pending} onClick={() => decide("Reconciled")}><CheckCircle2 className="mr-1 h-4 w-4 text-green-600" />Reconcile</Button>
          <Button variant="outline" size="sm" disabled={pending} onClick={() => decide("Flagged")}><Flag className="mr-1 h-4 w-4 text-red-600" />Flag discrepancy</Button>
        </>
      ) : null}
      <Button variant="outline" size="sm" disabled={pending} onClick={remove}><Trash2 className="mr-1 h-4 w-4 text-red-600" />Delete</Button>
    </div>
  )
}

export function SeedLogsButton() {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <Button variant="outline" disabled={pending} onClick={() => start(async () => { await seedLogsAction(); router.refresh() })}>
      <Database className="mr-2 h-4 w-4" />Seed demo logs
    </Button>
  )
}

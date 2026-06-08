"use client"

import { useState, useTransition } from "react"
import type { ToolRequest, ToolRequestStatus } from "@/lib/agentflow/store"
import { decideToolRequestAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const STATUS_VARIANT: Record<ToolRequestStatus, "secondary" | "default" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
}

export function ApprovalsBoard({ initial = [] }: { initial?: ToolRequest[] }) {
  const [rows, setRows] = useState<ToolRequest[]>(initial)
  const [pending, startTransition] = useTransition()

  function decide(id: string, approve: boolean) {
    startTransition(async () => {
      const res = await decideToolRequestAction(id, approve)
      if (res.ok && res.request) setRows((prev) => prev.map((r) => (r.id === id ? (res.request as ToolRequest) : r)))
    })
  }

  const waiting = rows.filter((r) => r.status === "pending").length

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{waiting} awaiting decision.</p>
      {rows.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No agent tool requests.</CardContent></Card>
      ) : (
        rows.map((r) => (
          <Card key={r.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="font-mono">{r.tool}</span>
                <Badge variant="outline">{r.agent}</Badge>
                <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-mono text-xs text-muted-foreground">{JSON.stringify(r.args)}</p>
              {r.output ? <p className="text-sm">{r.output}</p> : null}
              {r.status === "pending" ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => decide(r.id, true)} disabled={pending}>Approve &amp; run</Button>
                  <Button size="sm" variant="outline" onClick={() => decide(r.id, false)} disabled={pending}>Reject</Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

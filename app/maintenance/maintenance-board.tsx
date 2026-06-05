"use client"

import { useState } from "react"
import { MAINT_CATEGORIES, nextTicketStatus, maintenanceSummary, type Priority, type Ticket, type TicketStatus } from "@/lib/maintenance"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const STATUS_VARIANT: Record<TicketStatus, "default" | "secondary" | "outline"> = {
  open: "outline",
  in_progress: "secondary",
  resolved: "default",
}
const PRIORITY_VARIANT: Record<Priority, "default" | "secondary" | "destructive" | "outline"> = {
  low: "outline",
  medium: "secondary",
  high: "destructive",
}

const TODAY = new Date().toISOString().slice(0, 10)

export function MaintenanceBoard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [category, setCategory] = useState(MAINT_CATEGORIES[0])
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<Priority>("medium")

  const s = maintenanceSummary(tickets)

  function raise() {
    if (!description.trim()) return
    setTickets((prev) => [
      { id: `T-${Date.now()}`, category, description: description.trim(), priority, status: "open", raisedOn: TODAY },
      ...prev,
    ])
    setDescription("")
  }

  function advance(id: string) {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: nextTicketStatus(t.status) } : t)))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.open}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">In progress</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.inProgress}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">High &amp; open</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.highOpen}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Raise a ticket</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {MAINT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="d">Description</Label><Input id="d" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Class 9 fan not working" /></div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <Button onClick={raise} disabled={!description.trim()} className="w-full">Raise ticket</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tickets ({tickets.length})</CardTitle></CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tickets yet.</p>
            ) : (
              <ul className="space-y-2">
                {tickets.map((t) => (
                  <li key={t.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{t.category}</span>
                      <span className="flex items-center gap-2">
                        <Badge variant={PRIORITY_VARIANT[t.priority]}>{t.priority}</Badge>
                        <Badge variant={STATUS_VARIANT[t.status]}>{t.status.replace("_", " ")}</Badge>
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground">{t.description}</p>
                    {t.status !== "resolved" ? (
                      <Button size="sm" variant="outline" className="mt-2" onClick={() => advance(t.id)}>Advance status</Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

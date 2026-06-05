"use client"

import { useState } from "react"
import { lostFoundSummary, filterByStatus, type ItemStatus, type LostItem } from "@/lib/lostfound"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const STATUS_VARIANT: Record<ItemStatus, "destructive" | "secondary" | "default"> = {
  lost: "destructive",
  found: "secondary",
  claimed: "default",
}

export function LostFoundBoard() {
  const [items, setItems] = useState<LostItem[]>([])
  const [filter, setFilter] = useState<ItemStatus | "all">("all")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [reportedBy, setReportedBy] = useState("")
  const [status, setStatus] = useState<ItemStatus>("found")

  const s = lostFoundSummary(items)
  const shown = filterByStatus(items, filter)

  function add() {
    if (!name.trim()) return
    setItems((prev) => [
      {
        id: `lf-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        reportedBy: reportedBy.trim() || "Front office",
        status,
        date: new Date().toISOString().slice(0, 10),
      },
      ...prev,
    ])
    setName("")
    setDescription("")
    setLocation("")
  }

  function claim(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: "claimed" } : i)))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total entries</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Reported lost</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.lost}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Awaiting claim</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.openFound}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Claimed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.claimed}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Log an item</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="n">Item</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Blue water bottle" /></div>
            <div className="space-y-1.5"><Label htmlFor="ds">Description</Label><Input id="ds" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Marks, brand, contents" /></div>
            <div className="space-y-1.5"><Label htmlFor="loc">Location</Label><Input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Class 7 corridor" /></div>
            <div className="space-y-1.5"><Label htmlFor="rb">Reported by</Label><Input id="rb" value={reportedBy} onChange={(e) => setReportedBy(e.target.value)} placeholder="Name / desk" /></div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select value={status} onChange={(e) => setStatus(e.target.value as ItemStatus)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="found">Found (in custody)</option>
                <option value="lost">Lost (reported missing)</option>
              </select>
            </div>
            <Button onClick={add} disabled={!name.trim()} className="w-full">Add to register</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Register ({shown.length})</CardTitle>
              <select value={filter} onChange={(e) => setFilter(e.target.value as ItemStatus | "all")} className="h-8 rounded-md border bg-background px-2 text-xs">
                <option value="all">All</option>
                <option value="lost">Lost</option>
                <option value="found">Found</option>
                <option value="claimed">Claimed</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {shown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items in this view.</p>
            ) : (
              <ul className="space-y-2">
                {shown.map((it) => (
                  <li key={it.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{it.name}</span>
                      <Badge variant={STATUS_VARIANT[it.status]}>{it.status}</Badge>
                    </div>
                    {it.description ? <p className="mt-1 text-muted-foreground">{it.description}</p> : null}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{it.location || "—"} · {it.date} · {it.reportedBy}</span>
                      {it.status !== "claimed" ? (
                        <Button size="sm" variant="outline" onClick={() => claim(it.id)}>Mark claimed</Button>
                      ) : null}
                    </div>
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

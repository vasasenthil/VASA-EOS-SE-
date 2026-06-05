"use client"

import { useState } from "react"
import { INVENTORY } from "@/lib/procurement"
import { adjust, isLow, type Movement, type MovementType } from "@/lib/stock"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const TODAY = new Date().toISOString().slice(0, 10)

export function InventoryDesk() {
  const [stock, setStock] = useState<Record<string, number>>(() =>
    Object.fromEntries(INVENTORY.map((i) => [i.item, i.inStock])),
  )
  const [moves, setMoves] = useState<Movement[]>([])
  const [item, setItem] = useState(INVENTORY[0]?.item ?? "")
  const [type, setType] = useState<MovementType>("issue")
  const [qty, setQty] = useState(10)

  function apply() {
    if (qty <= 0) return
    setStock((s) => ({ ...s, [item]: adjust(s[item] ?? 0, type, qty) }))
    setMoves((m) => [{ id: `mv-${Date.now()}`, item, type, qty, at: TODAY }, ...m])
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
      <Card>
        <CardHeader>
          <CardTitle>Stock movement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Item</Label>
            <select value={item} onChange={(e) => setItem(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {INVENTORY.map((i) => <option key={i.item} value={i.item}>{i.item}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Movement</Label>
              <select value={type} onChange={(e) => setType(e.target.value as MovementType)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="issue">Issue (out)</option>
                <option value="receive">Receive (in)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="q">Quantity</Label>
              <Input id="q" type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            </div>
          </div>
          <Button onClick={apply} disabled={qty <= 0} className="w-full">Record movement</Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Stock on hand</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {INVENTORY.map((i) => {
                const qOnHand = stock[i.item] ?? 0
                const low = isLow(qOnHand, i.reorderAt)
                return (
                  <li key={i.item} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span>
                      <span className="font-medium">{i.item}</span>
                      <span className="block text-xs text-muted-foreground">reorder at {i.reorderAt} {i.unit}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono">{qOnHand} {i.unit}</span>
                      {low ? <Badge variant="destructive">low</Badge> : <Badge>ok</Badge>}
                    </span>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Movement log ({moves.length})</CardTitle></CardHeader>
          <CardContent>
            {moves.length === 0 ? (
              <p className="text-sm text-muted-foreground">No movements yet.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {moves.map((m) => (
                  <li key={m.id} className="flex items-center justify-between">
                    <span>{m.item}</span>
                    <span className="flex items-center gap-2">
                      <Badge variant={m.type === "issue" ? "secondary" : "outline"}>{m.type === "issue" ? "−" : "+"}{m.qty}</Badge>
                      <span className="text-xs text-muted-foreground">{m.at}</span>
                    </span>
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

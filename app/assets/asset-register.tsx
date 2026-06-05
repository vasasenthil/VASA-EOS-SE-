"use client"

import { useState } from "react"
import { ASSETS, ASSET_CATEGORIES, assetTag, assetSummary, type Asset, type AssetCondition } from "@/lib/assets"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const CONDITION_VARIANT: Record<AssetCondition, "default" | "secondary" | "destructive" | "outline"> = {
  good: "default",
  fair: "secondary",
  poor: "destructive",
  unusable: "destructive",
}

export function AssetRegister() {
  const [assets, setAssets] = useState<Asset[]>(ASSETS)
  const [seq, setSeq] = useState(ASSETS.length + 1)
  const [name, setName] = useState("")
  const [category, setCategory] = useState(ASSET_CATEGORIES[0])
  const [location, setLocation] = useState("")
  const [condition, setCondition] = useState<AssetCondition>("good")

  const s = assetSummary(assets)

  function add() {
    if (!name.trim()) return
    setAssets((prev) => [{ id: `a-${seq}`, tag: assetTag(seq), name: name.trim(), category, location: location.trim(), condition }, ...prev])
    setSeq((n) => n + 1)
    setName("")
    setLocation("")
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Assets</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Good</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.byCondition.good}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Needs attention</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.needsAttention}</div><p className="text-xs text-muted-foreground mt-1">poor + unusable → maintenance</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Unusable</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.byCondition.unusable}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.8fr]">
        <Card>
          <CardHeader><CardTitle>Register asset</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="n">Name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Projector" /></div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {ASSET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="l">Location</Label><Input id="l" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Class 8-A" /></div>
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <select value={condition} onChange={(e) => setCondition(e.target.value as AssetCondition)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
                <option value="unusable">Unusable</option>
              </select>
            </div>
            <Button onClick={add} disabled={!name.trim()} className="w-full">Register &amp; tag</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Register</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Condition</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.tag}</TableCell>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{a.category}</TableCell>
                    <TableCell className="text-muted-foreground">{a.location || "—"}</TableCell>
                    <TableCell><Badge variant={CONDITION_VARIANT[a.condition]}>{a.condition}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

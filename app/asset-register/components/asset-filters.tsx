"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, FilterX } from "lucide-react"
import { ASSET_CATEGORIES, CONDITIONS, ASSET_STATUSES } from "@/lib/assetmgmt"

export function AssetFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [q, setQ] = useState(sp.get("q") ?? "")

  function push(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(Array.from(sp.entries()))
    for (const [k, v] of Object.entries(next)) { if (!v || v === "all") params.delete(k); else params.set(k, v) }
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  const category = sp.get("category") ?? "all"
  const condition = sp.get("condition") ?? "all"
  const status = sp.get("status") ?? "all"
  const lowStock = sp.get("lowStock") === "1"
  const hasFilters = !!sp.get("q") || category !== "all" || condition !== "all" || status !== "all" || lowStock

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6 items-end">
      <div className="lg:col-span-2">
        <form onSubmit={(e) => { e.preventDefault(); push({ q }) }} className="flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, tag or location…" />
          <Button type="submit" variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
        </form>
      </div>
      <Select value={category} onValueChange={(v) => push({ category: v })}>
        <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent><SelectItem value="all">All categories</SelectItem>{ASSET_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={condition} onValueChange={(v) => push({ condition: v })}>
        <SelectTrigger><SelectValue placeholder="Condition" /></SelectTrigger>
        <SelectContent><SelectItem value="all">All conditions</SelectItem>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={status} onValueChange={(v) => push({ status: v })}>
        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent><SelectItem value="all">All statuses</SelectItem>{ASSET_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
      </Select>
      <div className="flex gap-2">
        <Button variant={lowStock ? "default" : "outline"} className="flex-1" onClick={() => push({ lowStock: lowStock ? undefined : "1" })}>Low stock</Button>
        {hasFilters ? <Button variant="ghost" size="icon" onClick={() => { setQ(""); router.push(pathname) }} aria-label="Clear filters"><FilterX className="h-4 w-4" /></Button> : null}
      </div>
    </div>
  )
}

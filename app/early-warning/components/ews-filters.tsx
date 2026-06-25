"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, FilterX } from "lucide-react"
import { CLASS_LEVELS } from "@/lib/students"

export function EwsFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [q, setQ] = useState(sp.get("q") ?? "")

  function push(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(Array.from(sp.entries()))
    for (const [k, v] of Object.entries(next)) { if (!v || v === "all") params.delete(k); else params.set(k, v) }
    router.push(`${pathname}?${params.toString()}`)
  }

  const level = sp.get("level") ?? "all"
  const cls = sp.get("class") ?? "all"
  const hasFilters = !!sp.get("q") || level !== "all" || cls !== "all"

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
      <div className="lg:col-span-2">
        <form onSubmit={(e) => { e.preventDefault(); push({ q }) }} className="flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student or APAAR…" />
          <Button type="submit" variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
        </form>
      </div>
      <Select value={level} onValueChange={(v) => push({ level: v })}>
        <SelectTrigger><SelectValue placeholder="Risk level" /></SelectTrigger>
        <SelectContent><SelectItem value="all">All levels</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent>
      </Select>
      <div className="flex gap-2">
        <Select value={cls} onValueChange={(v) => push({ class: v })}>
          <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All classes</SelectItem>{CLASS_LEVELS.map((c) => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent>
        </Select>
        {hasFilters ? <Button variant="ghost" size="icon" onClick={() => { setQ(""); router.push(pathname) }} aria-label="Clear filters"><FilterX className="h-4 w-4" /></Button> : null}
      </div>
    </div>
  )
}

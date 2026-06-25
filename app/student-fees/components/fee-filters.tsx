"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, FilterX } from "lucide-react"
import { CLASS_LEVELS, SECTIONS } from "@/lib/studentfees"

export function FeeFilters() {
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

  const cls = sp.get("class") ?? "all"
  const section = sp.get("section") ?? "all"
  const status = sp.get("status") ?? "all"
  const defaulter = sp.get("defaulter") === "1"
  const hasFilters = !!sp.get("q") || cls !== "all" || section !== "all" || status !== "all" || defaulter

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6 items-end">
      <div className="lg:col-span-2">
        <form onSubmit={(e) => { e.preventDefault(); push({ q }) }} className="flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student or APAAR…" />
          <Button type="submit" variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
        </form>
      </div>
      <Select value={cls} onValueChange={(v) => push({ class: v })}>
        <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
        <SelectContent><SelectItem value="all">All classes</SelectItem>{CLASS_LEVELS.map((c) => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={section} onValueChange={(v) => push({ section: v })}>
        <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
        <SelectContent><SelectItem value="all">All sections</SelectItem>{SECTIONS.map((s) => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={status} onValueChange={(v) => push({ status: v })}>
        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Partial">Partial</SelectItem><SelectItem value="Pending">Pending</SelectItem></SelectContent>
      </Select>
      <div className="flex gap-2">
        <Button variant={defaulter ? "default" : "outline"} className="flex-1" onClick={() => push({ defaulter: defaulter ? undefined : "1" })}>
          Defaulters
        </Button>
        {hasFilters ? <Button variant="ghost" size="icon" onClick={() => { setQ(""); router.push(pathname) }} aria-label="Clear filters"><FilterX className="h-4 w-4" /></Button> : null}
      </div>
    </div>
  )
}

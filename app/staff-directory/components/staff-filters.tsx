"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, FilterX } from "lucide-react"
import { DESIGNATIONS, CADRES, EMPLOYMENT_TYPES, STAFF_STATUSES } from "@/lib/staffmaster"

export function StaffFilters() {
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

  const cadre = sp.get("cadre") ?? "all"
  const designation = sp.get("designation") ?? "all"
  const employmentType = sp.get("employmentType") ?? "all"
  const status = sp.get("status") ?? "all"
  const hasFilters = !!sp.get("q") || cadre !== "all" || designation !== "all" || employmentType !== "all" || status !== "all"

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6 items-end">
      <div className="lg:col-span-2">
        <form onSubmit={(e) => { e.preventDefault(); push({ q }) }} className="flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, staff id or email…" />
          <Button type="submit" variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
        </form>
      </div>
      <Select value={cadre} onValueChange={(v) => push({ cadre: v })}>
        <SelectTrigger><SelectValue placeholder="Cadre" /></SelectTrigger>
        <SelectContent><SelectItem value="all">All cadres</SelectItem>{CADRES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={designation} onValueChange={(v) => push({ designation: v })}>
        <SelectTrigger><SelectValue placeholder="Designation" /></SelectTrigger>
        <SelectContent><SelectItem value="all">All designations</SelectItem>{DESIGNATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={employmentType} onValueChange={(v) => push({ employmentType: v })}>
        <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent><SelectItem value="all">All types</SelectItem>{EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
      </Select>
      <div className="flex gap-2">
        <Select value={status} onValueChange={(v) => push({ status: v })}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem>{STAFF_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        {hasFilters ? <Button variant="ghost" size="icon" onClick={() => { setQ(""); router.push(pathname) }} aria-label="Clear filters"><FilterX className="h-4 w-4" /></Button> : null}
      </div>
    </div>
  )
}

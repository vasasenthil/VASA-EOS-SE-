"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, FilterX } from "lucide-react"
import { BOOK_CATEGORIES, MEMBER_TYPES } from "@/lib/librarycirc"

export function LoanFilters() {
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

  const status = sp.get("status") ?? "all"
  const category = sp.get("category") ?? "all"
  const memberType = sp.get("memberType") ?? "all"
  const hasFilters = !!sp.get("q") || status !== "all" || category !== "all" || memberType !== "all"

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6 items-end">
      <div className="lg:col-span-2">
        <form onSubmit={(e) => { e.preventDefault(); push({ q }) }} className="flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, member or accession…" />
          <Button type="submit" variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
        </form>
      </div>
      <Select value={status} onValueChange={(v) => push({ status: v })}>
        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="Issued">Issued</SelectItem><SelectItem value="Overdue">Overdue</SelectItem><SelectItem value="Returned">Returned</SelectItem></SelectContent>
      </Select>
      <Select value={category} onValueChange={(v) => push({ category: v })}>
        <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent><SelectItem value="all">All categories</SelectItem>{BOOK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={memberType} onValueChange={(v) => push({ memberType: v })}>
        <SelectTrigger><SelectValue placeholder="Member" /></SelectTrigger>
        <SelectContent><SelectItem value="all">All members</SelectItem>{MEMBER_TYPES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
      </Select>
      <div className="flex gap-2">
        {hasFilters ? <Button variant="ghost" size="icon" onClick={() => { setQ(""); router.push(pathname) }} aria-label="Clear filters"><FilterX className="h-4 w-4" /></Button> : null}
      </div>
    </div>
  )
}

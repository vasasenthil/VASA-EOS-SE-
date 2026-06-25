"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, FilterX } from "lucide-react"
import { REPORT_CARD_STATUSES, TERMS, CLASS_LEVELS } from "@/lib/reportcards"

export function ReportCardFilters() {
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
  const cls = sp.get("class") ?? "all"
  const term = sp.get("term") ?? "all"
  const outcome = sp.get("outcome") ?? "all"
  const hasFilters = !!sp.get("q") || status !== "all" || cls !== "all" || term !== "all" || outcome !== "all"

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
      <Select value={term} onValueChange={(v) => push({ term: v })}>
        <SelectTrigger><SelectValue placeholder="Term" /></SelectTrigger>
        <SelectContent><SelectItem value="all">All terms</SelectItem>{TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={outcome} onValueChange={(v) => push({ outcome: v })}>
        <SelectTrigger><SelectValue placeholder="Outcome" /></SelectTrigger>
        <SelectContent><SelectItem value="all">All outcomes</SelectItem><SelectItem value="Pass">Pass</SelectItem><SelectItem value="Fail">Fail</SelectItem></SelectContent>
      </Select>
      <div className="flex gap-2">
        <Select value={status} onValueChange={(v) => push({ status: v })}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem>{REPORT_CARD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        {hasFilters ? <Button variant="ghost" size="icon" onClick={() => { setQ(""); router.push(pathname) }} aria-label="Clear filters"><FilterX className="h-4 w-4" /></Button> : null}
      </div>
    </div>
  )
}

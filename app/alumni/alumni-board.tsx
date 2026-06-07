"use client"

import { useState, useTransition } from "react"
import { newAlumniId, decadeOf, alumniSummary, type Alumnus } from "@/lib/alumni"
import { registerAlumnusAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AlumniBoard({ initial = [] }: { initial?: Alumnus[] }) {
  const [list, setList] = useState<Alumnus[]>(initial)
  const [name, setName] = useState("")
  const [batchYear, setBatchYear] = useState(2020)
  const [occupation, setOccupation] = useState("")
  const [contact, setContact] = useState("")
  const [, startTransition] = useTransition()

  const s = alumniSummary(list)

  function add() {
    if (!name.trim()) return
    const optimistic: Alumnus = { id: newAlumniId(), name: name.trim(), batchYear, occupation: occupation.trim(), contact: contact.trim() }
    setList((prev) => [optimistic, ...prev])
    startTransition(async () => {
      const saved = await registerAlumnusAction({ name: optimistic.name, batchYear, occupation: optimistic.occupation, contact: optimistic.contact })
      if (saved) setList((prev) => prev.map((a) => (a.id === optimistic.id ? saved : a)))
    })
    setName("")
    setOccupation("")
    setContact("")
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Alumni</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Decades</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{Object.keys(s.byDecade).length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Latest batch</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.latestBatch || "—"}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Register alumnus</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="n">Name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="y">Batch year</Label><Input id="y" type="number" min={1950} max={2030} value={batchYear} onChange={(e) => setBatchYear(Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label htmlFor="o">Occupation</Label><Input id="o" value={occupation} onChange={(e) => setOccupation(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="c">Contact</Label><Input id="c" value={contact} onChange={(e) => setContact(e.target.value)} /></div>
            <Button onClick={add} disabled={!name.trim()} className="w-full">Add to registry</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Registry ({list.length})</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {list.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span>
                    <span className="font-medium">{a.name}</span>
                    <span className="block text-xs text-muted-foreground">{a.occupation || "—"}{a.contact ? ` · ${a.contact}` : ""}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant="outline">{a.batchYear}</Badge>
                    <Badge variant="secondary">{decadeOf(a.batchYear)}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

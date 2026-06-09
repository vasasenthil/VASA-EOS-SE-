"use client"

import { useState } from "react"
import { ECONTENT_LIBRARY, CONTENT_TYPES, newContentId, filterContent, econtentSummary, type ContentType, type EContent } from "@/lib/econtent"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function EContentBoard() {
  const [items, setItems] = useState<EContent[]>(ECONTENT_LIBRARY)
  const [q, setQ] = useState("")
  const [typeFilter, setTypeFilter] = useState<ContentType | "all">("all")
  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("Mathematics")
  const [type, setType] = useState<ContentType>("Video")
  const [language, setLanguage] = useState("Tamil")

  const s = econtentSummary(items)
  const shown = filterContent(items, { q, type: typeFilter === "all" ? undefined : typeFilter })

  function add() {
    if (!title.trim()) return
    setItems((prev) => [{ id: newContentId(), title: title.trim(), subject, type, language }, ...prev])
    setTitle("")
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Resources</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Subjects</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.subjects}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Videos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.byType.Video}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Interactive</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.byType.Interactive}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Add resource</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="t">Title</Label><Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="sb">Subject</Label><Input id="sb" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <select value={type} onChange={(e) => setType(e.target.value as ContentType)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                  {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5"><Label htmlFor="lg">Language</Label><Input id="lg" value={language} onChange={(e) => setLanguage(e.target.value)} /></div>
            </div>
            <Button onClick={add} disabled={!title.trim()} className="w-full">Add to library</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Library ({shown.length})</CardTitle>
              <div className="flex gap-2">
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-8 w-32" />
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as ContentType | "all")} className="h-8 rounded-md border bg-background px-2 text-xs">
                  <option value="all">All types</option>
                  {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {shown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matching resources.</p>
            ) : (
              <ul className="space-y-2">
                {shown.map((i) => (
                  <li key={i.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span>
                      <span className="font-medium">{i.title}</span>
                      <span className="block text-xs text-muted-foreground">{i.subject} · {i.language}</span>
                    </span>
                    <Badge variant="outline">{i.type}</Badge>
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

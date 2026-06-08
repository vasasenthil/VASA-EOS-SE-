"use client"

import { useState, useTransition } from "react"
import { NOTICE_CATEGORIES, NOTICE_AUDIENCES, newNoticeId, sortNotices, noticeSummary, type Notice, type NoticeCategory, type NoticeAudience } from "@/lib/notices"
import { publishNoticeAction, setPinnedAction } from "./actions"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const TODAY = new Date().toISOString().slice(0, 10)

export function NoticeBoard({ initial = [] }: { initial?: Notice[] }) {
  const [notices, setNotices] = useState<Notice[]>(initial)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [category, setCategory] = useState<NoticeCategory>("General")
  const [audience, setAudience] = useState<NoticeAudience>("All")
  const [, startTransition] = useTransition()

  const s = noticeSummary(notices)
  const shown = sortNotices(notices)

  function publish() {
    if (!title.trim()) return
    const optimistic: Notice = { id: newNoticeId(), title: title.trim(), body: body.trim(), category, audience, date: TODAY, pinned: category === "Urgent", tenantId: DEFAULT_SCHOOL_NODE }
    setNotices((prev) => [optimistic, ...prev])
    startTransition(async () => {
      const saved = await publishNoticeAction({ title: optimistic.title, body: optimistic.body, category, audience })
      if (saved) setNotices((prev) => prev.map((n) => (n.id === optimistic.id ? saved : n)))
    })
    setTitle("")
    setBody("")
  }
  function togglePin(id: string) {
    let next = false
    setNotices((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n
        next = !n.pinned
        return { ...n, pinned: next }
      }),
    )
    startTransition(async () => {
      const saved = await setPinnedAction(id, next)
      if (saved) setNotices((prev) => prev.map((n) => (n.id === id ? saved : n)))
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Notices</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pinned</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.pinned}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Urgent</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.urgent}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Publish notice</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="t">Title</Label><Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="b">Body</Label><Input id="b" value={body} onChange={(e) => setBody(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <select value={category} onChange={(e) => setCategory(e.target.value as NoticeCategory)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                  {NOTICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Audience</Label>
                <select value={audience} onChange={(e) => setAudience(e.target.value as NoticeAudience)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                  {NOTICE_AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <Button onClick={publish} disabled={!title.trim()} className="w-full">Publish</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Board</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {shown.map((n) => (
                <li key={n.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-medium">{n.pinned ? "📌" : ""}{n.title}</span>
                    <span className="flex items-center gap-2">
                      <Badge variant={n.category === "Urgent" ? "destructive" : "outline"}>{n.category}</Badge>
                      <Button size="sm" variant="ghost" onClick={() => togglePin(n.id)}>{n.pinned ? "Unpin" : "Pin"}</Button>
                    </span>
                  </div>
                  {n.body ? <p className="mt-1 text-muted-foreground">{n.body}</p> : null}
                  <div className="mt-1 text-xs text-muted-foreground">{n.audience} · {n.date}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

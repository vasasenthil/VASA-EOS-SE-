"use client"

import { useState, useTransition } from "react"
import { GL_DOMAINS, glSummary, type Lecture } from "@/lib/guestlectures"
import { createLectureAction } from "./actions"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function GuestLecturesBoard({ initial = [] }: { initial?: Lecture[] }) {
  const [lectures, setLectures] = useState<Lecture[]>(initial)
  const [speaker, setSpeaker] = useState("")
  const [topic, setTopic] = useState("")
  const [org, setOrg] = useState("")
  const [domain, setDomain] = useState(GL_DOMAINS[0])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [audience, setAudience] = useState(60)
  const [cls, setCls] = useState("")
  const [, startTransition] = useTransition()

  const s = glSummary(lectures)

  function add() {
    if (!speaker.trim() || !topic.trim()) return
    const optimistic: Lecture = { id: `gl-${Date.now()}`, speaker: speaker.trim(), topic: topic.trim(), org: org.trim() || "—", domain, date, audience, cls: cls.trim() || "All", tenantId: DEFAULT_SCHOOL_NODE }
    setLectures((prev) => [optimistic, ...prev])
    startTransition(async () => {
      const saved = await createLectureAction({ speaker: optimistic.speaker, topic: optimistic.topic, org: optimistic.org, domain: optimistic.domain, date: optimistic.date, audience: optimistic.audience, cls: optimistic.cls })
      if (saved) setLectures((prev) => prev.map((l) => (l.id === optimistic.id ? saved : l)))
    })
    setSpeaker("")
    setTopic("")
    setOrg("")
    setCls("")
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Sessions</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.lectures}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Resource persons</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.speakers}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Audience reached</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.audienceTotal}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Domains covered</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.domains}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Record a guest lecture</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="sp">Speaker / resource person</Label><Input id="sp" value={speaker} onChange={(e) => setSpeaker(e.target.value)} placeholder="e.g. Dr R. Kannan" /></div>
            <div className="space-y-1.5"><Label htmlFor="tp">Topic</Label><Input id="tp" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Careers in AI" /></div>
            <div className="space-y-1.5"><Label htmlFor="og">Organisation</Label><Input id="og" value={org} onChange={(e) => setOrg(e.target.value)} placeholder="e.g. Anna University" /></div>
            <div className="space-y-1.5">
              <Label>Domain</Label>
              <select value={domain} onChange={(e) => setDomain(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {GL_DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label htmlFor="dt">Date</Label><Input id="dt" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="au">Audience</Label><Input id="au" type="number" min={0} value={audience} onChange={(e) => setAudience(Number(e.target.value))} /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="cl">Class group</Label><Input id="cl" value={cls} onChange={(e) => setCls(e.target.value)} placeholder="e.g. 9-10" /></div>
            <Button onClick={add} disabled={!speaker.trim() || !topic.trim()} className="w-full">Record session</Button>
            <p className="text-xs text-muted-foreground">Brings community and industry expertise into the classroom; builds the school&apos;s resource-person network.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Guest lectures ({lectures.length})</CardTitle></CardHeader>
          <CardContent>
            {lectures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No guest lectures recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {lectures.map((l) => (
                  <li key={l.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{l.topic}</span>
                      <Badge variant="outline">{l.domain}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{l.speaker} ({l.org}) · {l.date} · {l.audience} in {l.cls}</p>
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

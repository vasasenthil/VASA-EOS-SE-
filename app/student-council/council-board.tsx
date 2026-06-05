"use client"

import { useState } from "react"
import { COUNCIL_POSITIONS, councilSummary, declareWinners, type Candidate } from "@/lib/council"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CouncilBoard() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [name, setName] = useState("")
  const [cls, setCls] = useState("")
  const [position, setPosition] = useState(COUNCIL_POSITIONS[0])

  const s = councilSummary(candidates)

  function add() {
    if (!name.trim()) return
    setCandidates((prev) => [
      { id: `cd-${Date.now()}`, name: name.trim(), cls: cls.trim() || "—", position, votes: 0, elected: false },
      ...prev,
    ])
    setName("")
    setCls("")
  }

  function vote(id: string) {
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, votes: c.votes + 1 } : c)))
  }

  function declare() {
    const winners = new Set(declareWinners(candidates))
    setCandidates((prev) => prev.map((c) => ({ ...c, elected: winners.has(c.id) })))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Candidates</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.candidates}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Votes cast</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.totalVotes}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Positions filled</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.positionsFilled}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Positions</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{COUNCIL_POSITIONS.length}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Nominate candidate</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="n">Name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Candidate name" /></div>
            <div className="space-y-1.5"><Label htmlFor="c">Class / section</Label><Input id="c" value={cls} onChange={(e) => setCls(e.target.value)} placeholder="e.g. 8A" /></div>
            <div className="space-y-1.5">
              <Label>Position contested</Label>
              <select value={position} onChange={(e) => setPosition(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {COUNCIL_POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <Button onClick={add} disabled={!name.trim()} className="w-full">Nominate</Button>
            <Button onClick={declare} variant="secondary" disabled={candidates.length === 0} className="w-full">Declare winners</Button>
            <p className="text-xs text-muted-foreground">Highest votes per position wins. Builds student voice and leadership; a demo ballot, not a secret-ballot system.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ballot ({candidates.length})</CardTitle></CardHeader>
          <CardContent>
            {candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No candidates nominated yet.</p>
            ) : (
              <ul className="space-y-2">
                {candidates.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span>
                      <span className="font-medium">{c.name} {c.elected ? <Badge className="ml-1">Elected</Badge> : null}</span>
                      <span className="block text-xs text-muted-foreground">{c.position} · {c.cls}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline">{c.votes} vote{c.votes === 1 ? "" : "s"}</Badge>
                      <Button size="sm" variant="outline" onClick={() => vote(c.id)}>+1 vote</Button>
                    </span>
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

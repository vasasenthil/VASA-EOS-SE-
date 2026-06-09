"use client"

import { useState } from "react"
import { ANGANWADI_CENTRES, ageEligible, preprimarySummary, type PrePrimaryChild } from "@/lib/preprimary"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function PrePrimaryForm() {
  const [children, setChildren] = useState<PrePrimaryChild[]>([])
  const [seq, setSeq] = useState(1)
  const [name, setName] = useState("")
  const [age, setAge] = useState(4)
  const [gender, setGender] = useState("female")
  const [centre, setCentre] = useState(ANGANWADI_CENTRES[0])

  const s = preprimarySummary(children)
  const eligible = ageEligible(age)

  function register() {
    if (!name.trim() || !eligible) return
    setChildren((prev) => [{ id: `pp-${seq}`, name: name.trim(), age, gender, centre }, ...prev])
    setSeq((n) => n + 1)
    setName("")
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Registered</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Eligible (3-6)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.eligible}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Girls</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.girls}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Register child</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="n">Child name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="a">Age</Label>
                <Input id="a" type="number" min={1} max={8} value={age} onChange={(e) => setAge(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Anganwadi centre</Label>
              <select value={centre} onChange={(e) => setCentre(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {ANGANWADI_CENTRES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {!eligible ? <p className="text-xs text-destructive">ECCE eligibility is ages 3-6.</p> : null}
            <Button onClick={register} disabled={!name.trim() || !eligible} className="w-full">Register</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Children ({children.length})</CardTitle></CardHeader>
          <CardContent>
            {children.length === 0 ? (
              <p className="text-sm text-muted-foreground">No children registered yet.</p>
            ) : (
              <ul className="space-y-2">
                {children.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span>
                      <span className="font-medium">{c.name}</span>
                      <span className="block text-xs text-muted-foreground">{c.centre} · {c.gender}</span>
                    </span>
                    <Badge variant="outline">age {c.age}</Badge>
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

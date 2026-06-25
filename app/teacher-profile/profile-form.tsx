"use client"

import { useState } from "react"
import { DEFAULT_PROFILE, profileCompleteness, type TeacherProfile } from "@/lib/profile"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export function ProfileForm() {
  const [profile, setProfile] = useState<TeacherProfile>(DEFAULT_PROFILE)
  const [saved, setSaved] = useState(false)

  const pct = profileCompleteness(profile)

  function set<K extends keyof TeacherProfile>(k: K, v: TeacherProfile[K]) {
    setProfile((p) => ({ ...p, [k]: v }))
    setSaved(false)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader><CardTitle>My profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="n">Name</Label><Input id="n" value={profile.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="d">Designation</Label><Input id="d" value={profile.designation} onChange={(e) => set("designation", e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="ex">Experience (yrs)</Label><Input id="ex" type="number" min={0} value={profile.experienceYears} onChange={(e) => set("experienceYears", Number(e.target.value))} /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="s">Subjects</Label><Input id="s" value={profile.subjects} onChange={(e) => set("subjects", e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="q">Qualification</Label><Input id="q" value={profile.qualification} onChange={(e) => set("qualification", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="p">Phone</Label><Input id="p" value={profile.phone} onChange={(e) => set("phone", e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="e">Email</Label><Input id="e" value={profile.email} onChange={(e) => set("email", e.target.value)} /></div>
          </div>
          <Button onClick={() => setSaved(true)} className="w-full">{saved ? "Saved ✓" : "Save profile"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Completeness</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold">{pct}%</span>
              {pct === 100 ? <Badge>complete</Badge> : <Badge variant="outline">incomplete</Badge>}
            </div>
            <Progress value={pct} className="mt-2 h-2" />
          </div>
          <p className="text-sm text-muted-foreground">
            Add phone and email to reach 100%. A complete profile improves directory accuracy and substitution matching.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

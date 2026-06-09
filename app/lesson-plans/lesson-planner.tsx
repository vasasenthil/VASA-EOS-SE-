"use client"

import { useState } from "react"
import { SAMPLE_PLANS, newPlanId, planCompleteness, type LessonPlan } from "@/lib/lesson-plan"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY = { subject: "", className: "", topic: "", objectives: "", materials: "", date: "" }

export function LessonPlanner() {
  const [plans, setPlans] = useState<LessonPlan[]>(SAMPLE_PLANS)
  const [form, setForm] = useState({ ...EMPTY })

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function add() {
    if (!form.subject.trim() || !form.topic.trim()) return
    setPlans((p) => [{ id: newPlanId(), ...form }, ...p])
    setForm({ ...EMPTY })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <Card>
        <CardHeader>
          <CardTitle>New lesson plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(
            [
              ["subject", "Subject"],
              ["className", "Class"],
              ["topic", "Topic"],
              ["objectives", "Learning objectives"],
              ["materials", "Materials"],
              ["date", "Date"],
            ] as [keyof typeof form, string][]
          ).map(([k, label]) => (
            <div key={k} className="space-y-1.5">
              <Label htmlFor={k}>{label}</Label>
              <Input
                id={k}
                type={k === "date" ? "date" : "text"}
                value={form[k]}
                onChange={(e) => set(k, e.target.value)}
              />
            </div>
          ))}
          <Button onClick={add} disabled={!form.subject.trim() || !form.topic.trim()} className="w-full">
            Add lesson plan
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plans ({plans.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {plans.map((p) => {
              const pct = planCompleteness(p)
              return (
                <li key={p.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{p.topic || "(untitled)"}</span>
                    <Badge variant={pct === 100 ? "default" : "secondary"}>{pct}% ready</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>{p.subject}</span>
                    {p.className ? <span>{p.className}</span> : null}
                    {p.date ? <span>{p.date}</span> : null}
                  </div>
                  {p.objectives ? <p className="mt-1 text-sm text-muted-foreground">{p.objectives}</p> : null}
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

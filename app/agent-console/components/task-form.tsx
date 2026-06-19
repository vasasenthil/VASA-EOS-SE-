"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ShieldAlert, Bot } from "lucide-react"
import { emptyTask, validateTask, AGENT_OPTIONS, agentOption, type TaskInput, type TaskErrors } from "@/lib/agentconsole"
import { createTaskAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function TaskForm() {
  const router = useRouter()
  const [f, setF] = useState<TaskInput>(emptyTask())
  const [errors, setErrors] = useState<TaskErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const shown = submitted ? validateTask(f).errors : errors
  const opt = agentOption(f.agent)

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateTask(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = await createTaskAction(f)
      if (res.ok && res.id) router.push(`/agent-console/${res.id}`)
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not dispatch the task.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-4 w-4 text-indigo-600" />Dispatch a task to an agent</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="agent">Agent *</Label>
          <select id="agent" value={f.agent} onChange={(e) => setF((p) => ({ ...p, agent: e.target.value }))} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {AGENT_OPTIONS.map((a) => <option key={a.name} value={a.name}>{a.label}{a.highStakes ? " (high-stakes · approval)" : ""}</option>)}
          </select>
          <Err msg={shown.agent} />
        </div>
        {opt ? (
          <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            <p>{opt.scope}</p>
            {opt.highStakes ? <p className="mt-1 inline-flex items-center gap-1 text-amber-700"><ShieldAlert className="h-3.5 w-3.5" />High-stakes agent — its action requires human approval before execution.</p> : <Badge variant="secondary" className="mt-1">Advisory output for human review</Badge>}
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="input">Task *</Label>
          <Textarea id="input" value={f.input} onChange={(e) => setF((p) => ({ ...p, input: e.target.value }))} rows={4} placeholder="Describe the task for the agent (e.g. 'Compute Pudhumai Penn benefit for Class 11 girls in Egmore block')…" />
          <Err msg={shown.input} />
        </div>
        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{pending ? "Running agent…" : "Run agent & queue for review"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import {
  emptyForumResolution,
  validateForumResolution,
  completenessPct,
  requiresMinister,
  GOVERNANCE_FORUMS,
  FORUM_CATEGORIES,
  MINISTER_RATIFICATION_THRESHOLD,
  type ForumResolutionForm,
  type FieldErrors,
} from "@/lib/governance/forum-resolution"
import { fileForumAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

const thresholdCr = Math.round(MINISTER_RATIFICATION_THRESHOLD / 10_000_000)

export function ForumFormUI() {
  const router = useRouter()
  const [f, setF] = useState<ForumResolutionForm>(emptyForumResolution())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [itemDraft, setItemDraft] = useState("")
  const [pending, startTransition] = useTransition()

  function set<K extends keyof ForumResolutionForm>(key: K, value: ForumResolutionForm[K]) {
    setF((prev) => ({ ...prev, [key]: value }))
  }

  const shown = submitted ? validateForumResolution(f).errors : errors
  const pct = completenessPct(f)
  const minister = requiresMinister(f)

  function addItem() {
    const v = itemDraft.trim()
    if (!v) return
    setF((prev) => ({ ...prev, actionItems: [...prev.actionItems, v] }))
    setItemDraft("")
  }

  function removeItem(i: number) {
    setF((prev) => ({ ...prev, actionItems: prev.actionItems.filter((_, idx) => idx !== i) }))
  }

  function submit() {
    setSubmitted(true)
    const v = validateForumResolution(f)
    setErrors(v.errors)
    if (!v.ok) return
    startTransition(async () => {
      const saved = await fileForumAction({
        forum: f.forum,
        title: f.title.trim(),
        requiresMinister: minister,
        actionItems: f.actionItems,
        details: {
          category: f.category,
          meetingDate: f.meetingDate,
          decisionText: f.decisionText.trim(),
          responsible: f.responsible.trim(),
          accountable: f.accountable.trim(),
          fundImplication: f.fundImplication || undefined,
        },
      })
      if (saved) router.push("/governance/forums")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Governance Forum Resolution</CardTitle>
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Completeness</span><span>{pct}%</span></div>
          <Progress value={pct} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="forum">Forum *</Label>
            <select id="forum" value={f.forum} onChange={(e) => set("forum", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{GOVERNANCE_FORUMS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select><Err msg={shown.forum} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat">Category *</Label>
            <select id="cat" value={f.category} onChange={(e) => set("category", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{FORUM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select><Err msg={shown.category} />
          </div>
        </div>

        <div className="space-y-1.5"><Label htmlFor="title">Resolution / agenda title *</Label><Input id="title" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Q1 FY26 budget reallocation" /><Err msg={shown.title} /></div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="date">Meeting date *</Label><Input id="date" type="date" value={f.meetingDate} onChange={(e) => set("meetingDate", e.target.value)} /><Err msg={shown.meetingDate} /></div>
          <div className="space-y-1.5"><Label htmlFor="fund">Fund implication ₹ (optional)</Label><Input id="fund" type="number" min={0} value={f.fundImplication || ""} onChange={(e) => set("fundImplication", Number(e.target.value))} placeholder="0" /><Err msg={shown.fundImplication} /></div>
          <div className="space-y-1.5"><Label htmlFor="resp">Responsible (RACI) *</Label><Input id="resp" value={f.responsible} onChange={(e) => set("responsible", e.target.value)} placeholder="Driver who executes" /><Err msg={shown.responsible} /></div>
          <div className="space-y-1.5"><Label htmlFor="acct">Accountable (RACI) *</Label><Input id="acct" value={f.accountable} onChange={(e) => set("accountable", e.target.value)} placeholder="Single owner who answers" /><Err msg={shown.accountable} /></div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="text">Resolution text *</Label>
          <Textarea id="text" value={f.decisionText} onChange={(e) => set("decisionText", e.target.value)} rows={4} placeholder="The substantive resolution as adopted (min 30 characters)." />
          <Err msg={shown.decisionText} />
        </div>

        <div className="space-y-1.5">
          <Label>Action items (optional)</Label>
          <div className="flex gap-2">
            <Input value={itemDraft} onChange={(e) => setItemDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem() } }} placeholder="Add a follow-up action and press Enter" />
            <Button type="button" variant="outline" onClick={addItem}>Add</Button>
          </div>
          {f.actionItems.length > 0 && (
            <ul className="mt-1 space-y-1">
              {f.actionItems.map((it, i) => (
                <li key={i} className="flex items-center justify-between rounded-md border bg-muted/40 px-2.5 py-1.5 text-sm">
                  <span>{it}</span>
                  <button type="button" onClick={() => removeItem(i)} className="text-muted-foreground hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={f.significant} onChange={(e) => set("significant", e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>Flag as <strong>significant</strong> — force Minister ratification regardless of fund value.</span>
        </label>

        <Badge variant={minister ? "default" : "outline"} className={minister ? "" : "border-amber-500 text-amber-600 dark:text-amber-500"}>
          {minister ? "Routes to Minister ratification" : "Routine — no Minister ratification"}
        </Badge>
        <p className="text-xs text-muted-foreground">Items flagged significant, or with a fund implication ≥ ₹{thresholdCr} crore, escalate to the Minister automatically.</p>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={f.declaration} onChange={(e) => set("declaration", e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>I confirm this item is duly tabled at the forum with the stated ownership.</span>
        </label>
        <Err msg={shown.declaration} />

        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>Table resolution</Button>
          <p className="text-xs text-muted-foreground">Routes to <strong>Secretary</strong> adoption → <strong>2-Director quorum</strong>{minister ? <> → <strong>Minister ratification</strong></> : null}, with a full audit trail.</p>
        </div>
      </CardContent>
    </Card>
  )
}

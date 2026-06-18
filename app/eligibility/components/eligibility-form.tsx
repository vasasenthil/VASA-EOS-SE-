"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Cpu, ShieldCheck, CheckCircle2 } from "lucide-react"
import {
  emptyCase, validateCase, derive, factsFor, RULE_SETS, CATEGORIES, DECISIONS,
  type CaseInput, type CaseErrors, type FactEntry,
} from "@/lib/eligibility"
import { createCaseAction, updateCaseAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function EligibilityForm({ id, initial }: { id?: string; initial?: CaseInput }) {
  const router = useRouter()
  const [f, setF] = useState<CaseInput>(initial ?? emptyCase())
  const [errors, setErrors] = useState<CaseErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof CaseInput>(k: K, v: CaseInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  function setCategory(cat: string) { setF((p) => ({ ...p, category: cat, facts: factsFor(cat) })) }
  function setFact(key: string, value: string) { setF((p) => ({ ...p, facts: p.facts.map((x) => (x.key === key ? { ...x, value } : x)) })) }

  const shown = submitted ? validateCase(f).errors : errors
  const ruleSet = RULE_SETS[f.category]
  const result = derive(f.facts, f.category) // live Reasoning Engine output

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateCase(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateCaseAction(id, f) : await createCaseAction(f)
      if (res.ok) router.push(id ? `/eligibility/${id}` : "/eligibility")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the case.")
    })
  }

  function valueOf(key: string) { return f.facts.find((x) => x.key === key)?.value ?? "" }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit case" : "New eligibility / compliance case"}</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Subject & rule set</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5"><Label htmlFor="subject">Subject *</Label><Input id="subject" value={f.subject} onChange={(e) => set("subject", e.target.value)} placeholder="Applicant / school name" /><Err msg={shown.subject} /></div>
            <div className="space-y-1.5"><Label htmlFor="ref">Reference</Label><Input id="ref" value={f.reference} onChange={(e) => set("reference", e.target.value)} placeholder="APAAR / UDISE" /></div>
            <div className="space-y-1.5"><Label htmlFor="cat">Rule set *</Label><select id="cat" value={f.category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select><Err msg={shown.category} /></div>
          </div>
          {ruleSet ? <p className="text-xs text-muted-foreground">{ruleSet.description}</p> : null}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Facts</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(ruleSet?.factKeys ?? []).map((fk) => (
              <div key={fk.key} className="space-y-1.5">
                <Label htmlFor={fk.key}>{fk.label}</Label>
                {fk.type === "bool" ? (
                  <select id={fk.key} value={valueOf(fk.key)} onChange={(e) => setFact(fk.key, e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="true">Yes</option><option value="false">No</option></select>
                ) : fk.type === "enum" ? (
                  <select id={fk.key} value={valueOf(fk.key)} onChange={(e) => setFact(fk.key, e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{(fk.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}</select>
                ) : (
                  <Input id={fk.key} type={fk.type === "number" ? "number" : "text"} value={valueOf(fk.key)} onChange={(e) => setFact(fk.key, e.target.value)} />
                )}
              </div>
            ))}
          </div>
          <Err msg={shown.facts} />
        </section>

        {/* Live Reasoning Engine derivation */}
        <section className="space-y-2 rounded-md border border-indigo-200 bg-indigo-50/40 p-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Cpu className="h-4 w-4 text-indigo-600" />
            <span className="font-semibold">Reasoning Engine — derived conclusions</span>
            <Badge className="bg-indigo-100 text-indigo-700 border-0"><ShieldCheck className="mr-1 h-3 w-3" />Human authority</Badge>
          </div>
          {result.conclusions.length === 0 ? (
            <p className="text-xs text-muted-foreground">{result.explanation}</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {result.conclusions.map((c) => (
                <li key={c.ruleId} className="flex flex-wrap items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600 shrink-0" />
                  <span><strong>{c.conclusion}</strong> <span className="text-xs text-muted-foreground">— {c.because} <Badge variant="outline" className="ml-1">{c.ruleId}</Badge></span></span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">{result.explanation}</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Decision (you decide)</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5"><Label htmlFor="dec">Decision *</Label><select id="dec" value={f.decision} onChange={(e) => set("decision", e.target.value as CaseInput["decision"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{DECISIONS.map((d) => <option key={d} value={d}>{d}</option>)}</select><Err msg={shown.decision} /></div>
            <div className="space-y-1.5 lg:col-span-2"><Label htmlFor="by">Decided by</Label><Input id="by" value={f.decidedBy} onChange={(e) => set("decidedBy", e.target.value)} placeholder="Officer who decides" /><Err msg={shown.decidedBy} /></div>
          </div>
          <Textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Decision notes…" />
        </section>

        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create case"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}

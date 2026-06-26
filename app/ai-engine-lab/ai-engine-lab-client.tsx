"use client"

import { useActionState } from "react"
import {
  runAnalyticsAction,
  runConverseAction,
  runAssessAction,
  runReasonAction,
  runPersonaliseAction,
  runPolicyAction,
  type AnalyticsState,
  type ConverseState,
  type AssessState,
  type ReasonState,
  type PersonaliseState,
  type PolicyState,
} from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

const A0: AnalyticsState = { ok: false, message: "" }
const C0: ConverseState = { ok: false, message: "" }
const S0: AssessState = { ok: false, message: "" }
const R0: ReasonState = { ok: false, message: "" }
const P0: PersonaliseState = { ok: false, message: "" }
const PL0: PolicyState = { ok: false, message: "" }

/** Analytics engine — type a series, get summary stats + trend + anomalies, computed live. */
export function AnalyticsPlayground() {
  const [state, action, pending] = useActionState(runAnalyticsAction, A0)
  return (
    <form action={action} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="series">Numeric series (e.g. weekly attendance %)</Label>
        <Input id="series" name="series" defaultValue="90, 91, 89, 92, 50, 88" placeholder="comma or space separated" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Analysing…" : "Run Analytics engine"}</Button>
      {state.result && (
        <div className="rounded-lg border p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">n {state.result.n}</Badge>
            <Badge variant="outline">mean {state.result.mean}</Badge>
            <Badge variant="outline">median {state.result.median}</Badge>
            <Badge variant="outline">min {state.result.min}</Badge>
            <Badge variant="outline">max {state.result.max}</Badge>
            <Badge variant="outline">σ {state.result.stdev}</Badge>
            <Badge variant={state.result.trend === "down" ? "destructive" : state.result.trend === "up" ? "default" : "secondary"}>trend {state.result.trend}</Badge>
            <Badge variant={state.result.anomalies.length ? "destructive" : "secondary"}>
              {state.result.anomalies.length ? `anomaly @ position ${state.result.anomalies.map((i) => i + 1).join(", ")}` : "no anomalies"}
            </Badge>
          </div>
          <p className="mt-2 text-muted-foreground">{state.result.explanation}</p>
        </div>
      )}
      {!state.ok && state.message && <p className="text-sm text-destructive">✕ {state.message}</p>}
    </form>
  )
}

/** Conversational engine — grounded, citation-backed answers over a fixed school-policy corpus. */
export function ConversePlayground() {
  const [state, action, pending] = useActionState(runConverseAction, C0)
  return (
    <form action={action} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="question">Ask about TN school-education policy</Label>
        <Input id="question" name="question" defaultValue="What is the pupil teacher ratio norm?" required />
      </div>
      <p className="text-xs text-muted-foreground">
        Try: &ldquo;How many CPD hours does a teacher need?&rdquo; · &ldquo;What is the mid-day meal foodgrain
        norm?&rdquo; · &ldquo;What are the four Ds in RBSK?&rdquo;
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Answering…" : "Ask the Conversational engine"}</Button>
      {state.result && (
        <div className="rounded-lg border p-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant={state.result.grounded ? "default" : "destructive"}>{state.result.grounded ? "grounded" : "no match"}</Badge>
            <span className="text-xs text-muted-foreground">confidence {Math.round(state.result.confidence * 100)}%</span>
          </div>
          <p className="mt-2">{state.result.answer}</p>
          {state.result.citations.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {state.result.citations.map((c, i) => (
                <Badge key={c.source + i} variant="outline" className="text-[10px]">{c.source}</Badge>
              ))}
            </div>
          )}
        </div>
      )}
      {!state.ok && state.message && !state.result && <p className="text-sm text-destructive">✕ {state.message}</p>}
    </form>
  )
}

const BAND_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  A1: "default", A2: "default", B1: "secondary", B2: "secondary", C1: "secondary", C2: "secondary", E: "destructive",
}

/** Assessment engine — enter marks per item, get grade band + per-objective mastery + weak-objective flags. */
export function AssessPlayground() {
  const [state, action, pending] = useActionState(runAssessAction, S0)
  const items = [
    { id: "q1", label: "Q1 · Algebra (/10)" },
    { id: "q2", label: "Q2 · Algebra (/10)" },
    { id: "q3", label: "Q3 · Geometry (/10)" },
  ]
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.id} className="space-y-1">
            <Label htmlFor={it.id}>{it.label}</Label>
            <Input id={it.id} name={it.id} type="number" min={0} max={10} defaultValue={it.id === "q3" ? 3 : 8} required />
          </div>
        ))}
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Marking…" : "Run Assessment engine"}</Button>
      {state.result && (
        <div className="rounded-lg border p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={BAND_VARIANT[state.result.band] ?? "secondary"}>band {state.result.band}</Badge>
            <Badge variant="outline">{state.result.score}/{state.result.max}</Badge>
            <Badge variant="outline">{state.result.pct}%</Badge>
            {state.result.weakObjectives.length > 0 && (
              <Badge variant="destructive">weak: {state.result.weakObjectives.join(", ")}</Badge>
            )}
          </div>
          <table className="mt-2 w-full text-xs">
            <tbody>
              {state.result.objectiveMastery.map((m) => (
                <tr key={m.objective} className="border-t">
                  <td className="py-1 pr-3 font-medium">{m.objective}</td>
                  <td className="py-1 pr-3">{m.awarded}/{m.max}</td>
                  <td className="py-1">
                    <span className="inline-block h-2 w-24 overflow-hidden rounded bg-muted align-middle">
                      <span className="block h-full bg-primary" style={{ width: `${m.pct}%` }} />
                    </span>
                    <span className="ml-2">{m.pct}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!state.ok && state.message && !state.result && <p className="text-sm text-destructive">✕ {state.message}</p>}
    </form>
  )
}

/** Reasoning engine — transparent, rule-based RTE-eligibility inference with full provenance. */
export function ReasonPlayground() {
  const [state, action, pending] = useActionState(runReasonAction, R0)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="r-cat">Category</Label>
          <select id="r-cat" name="category" defaultValue="EWS" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="EWS">EWS</option>
            <option value="DG">DG (disadvantaged)</option>
            <option value="General">General</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="r-age">Age</Label>
          <Input id="r-age" name="age" type="number" min={0} max={18} defaultValue={7} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="r-dist">Distance (km)</Label>
          <Input id="r-dist" name="distanceKm" type="number" min={0} step={0.1} defaultValue={0.5} required />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        The engine fires the RTE admission rules over your facts and shows every conclusion with the exact rule and
        clause that justified it — no opaque scoring.
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Inferring…" : "Run Reasoning engine"}</Button>
      {state.result && (
        <div className="rounded-lg border p-4 text-sm">
          {state.result.conclusions.length === 0 ? (
            <p className="text-muted-foreground">No rule fired for these facts.</p>
          ) : (
            <ul className="space-y-2">
              {state.result.conclusions.map((c, i) => (
                <li key={c.ruleId + i}>
                  <span className="font-medium">{c.conclusion}</span>
                  <span className="block text-xs text-muted-foreground">{c.because} · rule {c.ruleId}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {!state.ok && state.message && !state.result && <p className="text-sm text-destructive">✕ {state.message}</p>}
    </form>
  )
}

/** Personalisation engine — per-objective mastery → the next objectives a learner is ready for (prereq-aware). */
export function PersonalisePlayground() {
  const [state, action, pending] = useActionState(runPersonaliseAction, P0)
  const fields = [
    { id: "add", label: "Addition" },
    { id: "mul", label: "Multiplication" },
    { id: "div", label: "Division" },
    { id: "frac", label: "Fractions" },
  ]
  const dflt: Record<string, number> = { add: 90, mul: 30, div: 0, frac: 0 }
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-4">
        {fields.map((f) => (
          <div key={f.id} className="space-y-1">
            <Label htmlFor={`p-${f.id}`}>{f.label} %</Label>
            <Input id={`p-${f.id}`} name={f.id} type="number" min={0} max={100} defaultValue={dflt[f.id]} required />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        The path is Addition → Multiplication → Division → Fractions; the engine recommends only objectives whose
        prerequisites are already mastered, so it never skips ahead.
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Planning…" : "Run Personalisation engine"}</Button>
      {state.result && (
        <div className="rounded-lg border p-4 text-sm">
          {state.result.recommendations.length === 0 ? (
            <p className="text-muted-foreground">Nothing ready right now — clear the prerequisites first.</p>
          ) : (
            <ul className="space-y-1">
              {state.result.recommendations.map((r) => (
                <li key={r.objectiveId} className="flex items-start gap-2">
                  <Badge variant="default">next</Badge>
                  <span><span className="font-medium">{r.label}</span> — <span className="text-muted-foreground">{r.reason}</span></span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-muted-foreground">{state.result.explanation}</p>
        </div>
      )}
      {!state.ok && state.message && !state.result && <p className="text-sm text-destructive">✕ {state.message}</p>}
    </form>
  )
}

/** Policy engine — project newly-covered beneficiaries + indicative cost of a coverage lever. */
export function PolicyPlayground() {
  const [state, action, pending] = useActionState(runPolicyAction, PL0)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="pl-label">Scheme</Label>
          <Input id="pl-label" name="label" defaultValue="Breakfast scheme expansion" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pl-pop">Eligible population</Label>
          <Input id="pl-pop" name="population" type="number" min={0} defaultValue={100000} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pl-base">Current coverage %</Label>
          <Input id="pl-base" name="baselineCoverage" type="number" min={0} max={100} defaultValue={60} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pl-target">Target coverage %</Label>
          <Input id="pl-target" name="targetCoverage" type="number" min={0} max={100} defaultValue={85} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pl-cost">Unit cost (₹/beneficiary)</Label>
          <Input id="pl-cost" name="unitCost" type="number" min={0} defaultValue={200} required />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Projecting…" : "Run Policy engine"}</Button>
      {state.result && (
        <div className="rounded-lg border p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">+{state.result.newlyCovered.toLocaleString("en-IN")} covered</Badge>
            <Badge variant="outline">→ {(state.result.projectedCoverage * 100).toFixed(0)}% coverage</Badge>
            <Badge variant="secondary">₹{state.result.indicativeCost.toLocaleString("en-IN")}</Badge>
          </div>
          <p className="mt-2">{state.result.explanation}</p>
          <p className="mt-1 text-xs text-muted-foreground">{state.result.equityNote}</p>
        </div>
      )}
      {!state.ok && state.message && !state.result && <p className="text-sm text-destructive">✕ {state.message}</p>}
    </form>
  )
}

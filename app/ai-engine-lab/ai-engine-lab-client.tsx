"use client"

import { useActionState } from "react"
import {
  runAnalyticsAction,
  runConverseAction,
  type AnalyticsState,
  type ConverseState,
} from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

const A0: AnalyticsState = { ok: false, message: "" }
const C0: ConverseState = { ok: false, message: "" }

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

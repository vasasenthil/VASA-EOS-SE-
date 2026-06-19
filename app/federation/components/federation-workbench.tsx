"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Network, Search, FilePlus2, GitCompareArrows } from "lucide-react"
import { FEDERATION_SOURCES, federationSource, type FederationResult } from "@/lib/federation"
import type { ReconcileReport, FieldState, ReconcileRecommendation } from "@/lib/federation/reconcile"
import { lookupAction, logLookupAction, reconcileApaarAction } from "../actions"

const REC_STYLE: Record<ReconcileRecommendation, string> = {
  Reconciled: "bg-green-100 text-green-700",
  Review: "bg-amber-100 text-amber-700",
  Flagged: "bg-red-100 text-red-700",
}
const STATE_STYLE: Record<FieldState, string> = {
  match: "text-green-700",
  drift: "text-red-700 font-medium",
  "missing-upstream": "text-amber-700",
  "missing-local": "text-amber-700",
}
const STATE_LABEL: Record<FieldState, string> = {
  match: "match",
  drift: "drift",
  "missing-upstream": "missing upstream",
  "missing-local": "missing locally",
}

export function FederationWorkbench() {
  const router = useRouter()
  const [source, setSource] = useState<string>(FEDERATION_SOURCES[0].key)
  const [key, setKey] = useState("")
  const [result, setResult] = useState<FederationResult | null>(null)
  const [report, setReport] = useState<ReconcileReport | null>(null)
  const [reconcileMsg, setReconcileMsg] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const src = federationSource(source)

  function run() {
    if (!key.trim()) return
    setReport(null); setReconcileMsg(null)
    start(async () => setResult(await lookupAction(source, key)))
  }
  function detectDrift() {
    setReport(null); setReconcileMsg(null)
    start(async () => {
      const res = await reconcileApaarAction(key)
      if (res.ok) setReport(res.report)
      else setReconcileMsg(res.reason)
    })
  }
  function logForReconcile() {
    if (!result) return
    const advisory = report ? ` · advisory: ${report.recommendation} (${report.matchPct}% match)` : ""
    const summary = `${result.title}${result.fields.length ? " · " + result.fields.map((f) => `${f.label}: ${f.value}`).join(" · ") : ""}${advisory}`
    start(async () => {
      const res = await logLookupAction({ source, key, summary, mode: result.mode })
      if (res.ok && res.id) router.push(`/federation/${res.id}`)
      else alert(res.reason ?? "Could not log the lookup.")
    })
  }

  return (
    <Card className="mb-6 border-indigo-200">
      <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Network className="h-4 w-4 text-indigo-600" />Federation workbench — query a system of record</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-12">
          <select value={source} onChange={(e) => { setSource(e.target.value); setResult(null); setReport(null); setReconcileMsg(null) }} className="sm:col-span-4 h-9 rounded-md border bg-background px-3 text-sm">
            {FEDERATION_SOURCES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <Input className="sm:col-span-6" value={key} onChange={(e) => setKey(e.target.value)} placeholder={src?.placeholder} onKeyDown={(e) => { if (e.key === "Enter") run() }} />
          <Button className="sm:col-span-2" onClick={run} disabled={pending}><Search className="mr-1 h-4 w-4" />Query</Button>
        </div>
        <p className="text-xs text-muted-foreground">{src?.port} · {src?.keyLabel}. Reads the live source of truth — the platform federates, it does not duplicate.</p>

        {result && !pending ? (
          <div className="rounded-md border bg-muted/40 p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={result.ok ? "bg-green-100 text-green-700 border-0" : "bg-amber-100 text-amber-700 border-0"}>{result.ok ? "Found" : "Not found"}</Badge>
              <Badge variant="outline">{result.mode === "live" ? "live gateway" : "mock (no MoU configured)"}</Badge>
              <span className="font-medium">{result.title}</span>
            </div>
            {result.fields.length > 0 ? (
              <dl className="grid gap-1 sm:grid-cols-2 text-sm">
                {result.fields.map((f, i) => <div key={i} className="flex justify-between border-b py-1"><dt className="text-muted-foreground">{f.label}</dt><dd className="font-medium">{f.value}</dd></div>)}
              </dl>
            ) : result.error ? <p className="text-xs text-muted-foreground">{result.error}</p> : null}
            {result.ok ? (
              <div className="flex flex-wrap gap-2">
                {source === "apaar" ? <Button variant="outline" size="sm" onClick={detectDrift} disabled={pending}><GitCompareArrows className="mr-1 h-4 w-4" />Detect drift vs local record</Button> : null}
                <Button variant="outline" size="sm" onClick={logForReconcile} disabled={pending}><FilePlus2 className="mr-1 h-4 w-4" />Log for reconciliation</Button>
              </div>
            ) : null}
          </div>
        ) : pending ? <p className="text-sm text-muted-foreground">Querying the federation gateway…</p> : null}

        {reconcileMsg && !pending ? <p className="text-xs text-amber-700 dark:text-amber-500">{reconcileMsg}</p> : null}

        {report && !pending ? (
          <div className="rounded-md border border-indigo-200 bg-indigo-50/40 p-3 space-y-2 dark:bg-indigo-950/20">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">Drift detection</span>
              <Badge className={`${REC_STYLE[report.recommendation]} border-0`}>{report.recommendation}</Badge>
              <span className="text-xs text-muted-foreground">{report.matchPct}% of {report.comparable} compared fields agree</span>
            </div>
            <p className="text-xs text-muted-foreground">{report.rationale}</p>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-xs"><tr><th className="px-2 py-1 text-left">Field</th><th className="px-2 py-1 text-left">Upstream (source of truth)</th><th className="px-2 py-1 text-left">Local record</th><th className="px-2 py-1 text-left">State</th></tr></thead>
                <tbody>
                  {report.fields.map((f) => (
                    <tr key={f.field} className="border-t">
                      <td className="px-2 py-1">{f.label}{f.critical ? <span className="ml-1 text-[10px] text-muted-foreground">(critical)</span> : null}</td>
                      <td className="px-2 py-1">{f.upstream || <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-2 py-1">{f.local || <span className="text-muted-foreground">—</span>}</td>
                      <td className={`px-2 py-1 ${STATE_STYLE[f.state]}`}>{STATE_LABEL[f.state]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-muted-foreground">Advisory only — a human reconciler decides. Log it to record the decision in the HITL reconciliation trail.</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

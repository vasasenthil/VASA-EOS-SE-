"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Network, Search, FilePlus2 } from "lucide-react"
import { FEDERATION_SOURCES, federationSource, type FederationResult } from "@/lib/federation"
import { lookupAction, logLookupAction } from "../actions"

export function FederationWorkbench() {
  const router = useRouter()
  const [source, setSource] = useState<string>(FEDERATION_SOURCES[0].key)
  const [key, setKey] = useState("")
  const [result, setResult] = useState<FederationResult | null>(null)
  const [pending, start] = useTransition()
  const src = federationSource(source)

  function run() {
    if (!key.trim()) return
    start(async () => setResult(await lookupAction(source, key)))
  }
  function logForReconcile() {
    if (!result) return
    const summary = `${result.title}${result.fields.length ? " · " + result.fields.map((f) => `${f.label}: ${f.value}`).join(" · ") : ""}`
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
          <select value={source} onChange={(e) => { setSource(e.target.value); setResult(null) }} className="sm:col-span-4 h-9 rounded-md border bg-background px-3 text-sm">
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
            {result.ok ? <Button variant="outline" size="sm" onClick={logForReconcile} disabled={pending}><FilePlus2 className="mr-1 h-4 w-4" />Log for reconciliation</Button> : null}
          </div>
        ) : pending ? <p className="text-sm text-muted-foreground">Querying the federation gateway…</p> : null}
      </CardContent>
    </Card>
  )
}

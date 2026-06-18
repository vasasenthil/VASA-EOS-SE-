"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, ShieldCheck, BookOpen, Send } from "lucide-react"
import type { ConversationalResult } from "@/lib/knowledgebase"
import { askAction } from "../actions"

const SUGGESTIONS = ["Who is eligible for Pudhumai Penn?", "What is the RTE 25% rule?", "What is the attendance norm?", "Explain NEP 5+3+3+4"]

export function AskPanel() {
  const [q, setQ] = useState("")
  const [result, setResult] = useState<ConversationalResult | null>(null)
  const [asked, setAsked] = useState("")
  const [pending, start] = useTransition()

  function run(query: string) {
    const text = query.trim()
    if (!text) return
    setAsked(text)
    start(async () => setResult(await askAction(text)))
  }

  return (
    <Card className="mb-6 border-indigo-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2"><MessageCircle className="h-4 w-4 text-indigo-600" />Ask the assistant
          <Badge className="bg-indigo-100 text-indigo-700 border-0 ml-1"><ShieldCheck className="mr-1 h-3 w-3" />Grounded · Human authority</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={(e) => { e.preventDefault(); run(q) }} className="flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask a question about TN schemes, RTE, attendance, fees, policy…" />
          <Button type="submit" disabled={pending}><Send className="mr-1 h-4 w-4" />Ask</Button>
        </form>
        <div className="flex flex-wrap gap-1">
          {SUGGESTIONS.map((s) => (
            <Button key={s} type="button" variant="outline" size="sm" className="text-xs" onClick={() => { setQ(s); run(s) }}>{s}</Button>
          ))}
        </div>

        {pending ? <p className="text-sm text-muted-foreground">Searching the knowledge base…</p> : null}

        {result && !pending ? (
          <div className="rounded-md border bg-muted/40 p-3 space-y-2">
            <p className="text-xs text-muted-foreground">You asked: <span className="font-medium">{asked}</span></p>
            <p className="text-sm">{result.answer}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge className={result.grounded ? "bg-green-100 text-green-700 border-0" : "bg-amber-100 text-amber-700 border-0"}>{result.grounded ? "Grounded" : "Not grounded"}</Badge>
              <Badge variant="secondary">confidence {Math.round(result.confidence * 100)}%</Badge>
            </div>
            {result.citations.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1 text-xs">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">Sources:</span>
                {result.citations.map((c) => <Badge key={c.id} variant="outline">{c.source}</Badge>)}
              </div>
            ) : null}
            <p className="text-[11px] text-muted-foreground">{result.explanation} The assistant only answers from the curated knowledge base and cites its sources — it never invents.</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

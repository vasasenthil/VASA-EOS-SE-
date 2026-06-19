"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wrench, Quote, ShieldCheck, AlertTriangle } from "lucide-react"
import type { ToolDescriptor, ToolResult } from "@/lib/mcp"
import { invokeToolAction } from "./actions"

export function RetrievalConsole({ tools }: { tools: ToolDescriptor[] }) {
  const [toolName, setToolName] = useState(tools[0]?.name ?? "")
  const [input, setInput] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ToolResult | null>(null)
  const [pending, start] = useTransition()
  const tool = tools.find((t) => t.name === toolName)

  function set(k: string, v: string) { setInput((p) => ({ ...p, [k]: v })) }
  function run() {
    start(async () => setResult(await invokeToolAction(toolName, input)))
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wrench className="h-4 w-4 text-indigo-600" />Tool catalogue (MCP-style)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tool">Tool</Label>
            <select id="tool" value={toolName} onChange={(e) => { setToolName(e.target.value); setInput({}); setResult(null) }} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {tools.map((t) => <option key={t.name} value={t.name}>{t.title} ({t.category})</option>)}
            </select>
            {tool ? <p className="text-xs text-muted-foreground">{tool.description}</p> : null}
            {tool ? <p className="font-mono text-[11px] text-muted-foreground">{tool.name}</p> : null}
          </div>
          {tool?.params.map((p) => (
            <div key={p.name} className="space-y-1.5">
              <Label htmlFor={p.name}>{p.name}{p.required ? " *" : ""}</Label>
              <Input id={p.name} value={input[p.name] ?? ""} onChange={(e) => set(p.name, e.target.value)} placeholder={p.description} onKeyDown={(e) => { if (e.key === "Enter") run() }} />
            </div>
          ))}
          <Button onClick={run} disabled={pending} className="w-full">{pending ? "Invoking…" : "Invoke tool"}</Button>
          <p className="text-[11px] text-muted-foreground">In-app analogue of the Model Context Protocol — typed tools, uniform invoke, structured cited results under human authority. Not a network MCP server or an LLM.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Result</CardTitle></CardHeader>
        <CardContent>
          {!result ? (
            <p className="text-sm text-muted-foreground">Choose a tool, enter its inputs, and invoke to see a grounded, cited result.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {result.ok ? <Badge className="bg-green-100 text-green-700 border-0">ok</Badge> : <Badge className="bg-red-100 text-red-700 border-0">{result.reason ?? "failed"}</Badge>}
                {result.grounded ? <Badge className="bg-blue-100 text-blue-700 border-0"><ShieldCheck className="mr-1 h-3 w-3" />grounded</Badge> : <Badge variant="outline"><AlertTriangle className="mr-1 h-3 w-3" />ungrounded</Badge>}
                <span className="font-mono text-[11px] text-muted-foreground">{result.toolName}</span>
              </div>
              <p className="text-sm">{result.summary}</p>
              {result.citations.length > 0 ? (
                <div className="rounded-md border bg-muted/40 p-3">
                  <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground"><Quote className="h-3.5 w-3.5" />Citations</p>
                  <ul className="space-y-1 text-sm">
                    {result.citations.map((c, i) => (
                      <li key={c.id} className="flex justify-between"><span>[{i + 1}] {c.source}</span><span className="font-mono text-xs text-muted-foreground">score {c.score}</span></li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useActionState } from "react"
import { discoverAction, type ContentState } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initial: ContentState = { items: [] }

export function ContentExplorer({ mode }: { mode: "mock" | "live" }) {
  const [state, formAction, pending] = useActionState(discoverAction, initial)

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.8fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Discover content</CardTitle>
            <Badge variant={mode === "live" ? "default" : "secondary"}>{mode === "live" ? "DIKSHA live" : "mock"}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="q">Query</Label>
              <Input id="q" name="q" placeholder="e.g. fractions" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" placeholder="e.g. Mathematics" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="language">Medium / language</Label>
              <Input id="language" name="language" placeholder="e.g. Tamil" />
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Searching…" : "Search DIKSHA"}
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            {mode === "live"
              ? "Calling the DIKSHA Composite Search API live."
              : "Returning mock results. Set INTEGRATION_DIKSHA=live to call the real API."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Results</CardTitle>
            {state.traceId ? <span className="font-mono text-xs text-muted-foreground">{state.traceId}</span> : null}
          </div>
        </CardHeader>
        <CardContent>
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : !state.queried ? (
            <p className="text-sm text-muted-foreground">Search to discover learning resources.</p>
          ) : state.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No content found for that query.</p>
          ) : (
            <ul className="space-y-2">
              {state.items.map((item) => (
                <li key={item.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{item.title}</span>
                    {item.subject ? <Badge variant="outline">{item.subject}</Badge> : null}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                    {item.language ? <span>{item.language}</span> : null}
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="underline">
                        open
                      </a>
                    ) : null}
                    <span className="font-mono">{item.id}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

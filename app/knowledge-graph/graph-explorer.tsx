"use client"

import { useState } from "react"
import {
  CONCEPTS,
  getConcept,
  learningPath,
  transitivePrerequisites,
  unlocks,
  type Concept,
} from "@/lib/knowledge-graph"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function GraphExplorer() {
  const [selectedId, setSelectedId] = useState<string>("pct")
  const concept = getConcept(selectedId)
  const path = learningPath(selectedId)
  const prereqs = transitivePrerequisites(selectedId)
  const dependents = unlocks(selectedId)

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
      <Card>
        <CardHeader>
          <CardTitle>Concepts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {CONCEPTS.map((c) => {
              const active = c.id === selectedId
              const onPath = path.some((p) => p.id === c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                    active
                      ? "border-primary bg-primary/10"
                      : onPath
                        ? "border-muted bg-muted/40"
                        : "border-transparent hover:bg-muted/40"
                  }`}
                >
                  <span>{c.name}</span>
                  <Badge variant="outline">G{c.grade}</Badge>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Learning path to {concept?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-wrap items-center gap-2 text-sm">
              {path.map((c, i) => (
                <li key={c.id} className="flex items-center gap-2">
                  <span
                    className={`rounded-md border px-2 py-1 ${
                      c.id === selectedId ? "border-primary bg-primary/10 font-medium" : "border-muted"
                    }`}
                  >
                    {c.name}
                  </span>
                  {i < path.length - 1 ? <span className="text-muted-foreground">→</span> : null}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <ConceptList title="Prerequisites (transitive)" items={prereqs} empty="No prerequisites — a foundation concept." />
          <ConceptList title="Unlocks next" items={dependents} empty="Terminal concept — nothing depends on it yet." />
        </div>
      </div>
    </div>
  )
}

function ConceptList({ title, items, empty }: { title: string; items: Concept[]; empty: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ul className="space-y-1 text-sm">
            {items.map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <span>{c.name}</span>
                <Badge variant="outline">
                  {c.subject} · G{c.grade}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{empty}</p>
        )}
      </CardContent>
    </Card>
  )
}

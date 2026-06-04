"use client"

import { useState } from "react"
import { ANSWER_KEY, OMR_OPTIONS, scoreOmr, type OmrScore } from "@/lib/omr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function OmrSheet() {
  const [marked, setMarked] = useState<Record<number, string>>({})
  const [score, setScore] = useState<OmrScore | null>(null)

  function mark(q: number, option: string) {
    setMarked((m) => ({ ...m, [q]: option }))
    setScore(null)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>OMR Sheet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ANSWER_KEY.map((k) => (
              <div key={k.q} className="flex items-center gap-3">
                <span className="w-8 text-sm text-muted-foreground">Q{k.q}</span>
                <div className="flex gap-2">
                  {OMR_OPTIONS.map((o) => {
                    const selected = marked[k.q] === o
                    return (
                      <button
                        key={o}
                        type="button"
                        onClick={() => mark(k.q, o)}
                        aria-pressed={selected}
                        className={`h-8 w-8 rounded-full border text-sm ${
                          selected ? "bg-primary text-primary-foreground border-primary" : "bg-background"
                        }`}
                      >
                        {o}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <Button className="mt-4" onClick={() => setScore(scoreOmr(marked))}>
            Score sheet
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Result</CardTitle>
        </CardHeader>
        <CardContent>
          {score ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge>
                  {score.correct}/{score.total}
                </Badge>
                <Badge variant="outline">{score.pct}%</Badge>
              </div>
              <ul className="space-y-1 text-sm">
                {score.perQuestion.map((p) => (
                  <li key={p.q} className="flex items-center justify-between">
                    <span>Q{p.q}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono">{p.marked}</span>
                      {p.correct ? (
                        <Badge>correct</Badge>
                      ) : (
                        <Badge variant="destructive">key {p.key}</Badge>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Mark answers and score the sheet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

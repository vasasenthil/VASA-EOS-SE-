"use client"

import { useState } from "react"
import { SURVEY_QUESTIONS, feedbackSummary, type FeedbackResponse } from "@/lib/feedback"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function emptyRatings(): Record<string, number> {
  return Object.fromEntries(SURVEY_QUESTIONS.map((q) => [q, 3]))
}

export function FeedbackBoard() {
  const [responses, setResponses] = useState<FeedbackResponse[]>([])
  const [ratings, setRatings] = useState<Record<string, number>>(emptyRatings)
  const [comment, setComment] = useState("")

  const summary = feedbackSummary(responses)

  function submit() {
    setResponses((prev) => [{ id: `fb-${Date.now()}`, ratings: { ...ratings }, comment: comment.trim() || undefined }, ...prev])
    setRatings(emptyRatings())
    setComment("")
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <CardHeader><CardTitle>Parent survey</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {SURVEY_QUESTIONS.map((q) => (
            <div key={q} className="space-y-1.5">
              <Label className="flex items-center justify-between">
                <span>{q}</span>
                <span className="text-xs text-muted-foreground">{ratings[q]}/5</span>
              </Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRatings((r) => ({ ...r, [q]: n }))}
                    className={`h-8 w-8 rounded-md border text-sm ${ratings[q] >= n ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}
                    aria-label={`${q}: ${n}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="space-y-1.5"><Label htmlFor="cm">Comment (optional)</Label><Input id="cm" value={comment} onChange={(e) => setComment(e.target.value)} /></div>
          <Button onClick={submit} className="w-full">Submit feedback</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Results ({summary.responses})</CardTitle>
            <Badge className="text-sm">{summary.overallAvg}/5 overall</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {SURVEY_QUESTIONS.map((q) => (
              <li key={q} className="flex items-center justify-between">
                <span className="text-muted-foreground">{q}</span>
                <span className="font-medium">{summary.perQuestion[q]}/5</span>
              </li>
            ))}
          </ul>
          {responses.length > 0 ? (
            <div className="mt-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Recent comments</p>
              {responses.filter((r) => r.comment).slice(0, 5).map((r) => (
                <p key={r.id} className="text-sm">“{r.comment}”</p>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

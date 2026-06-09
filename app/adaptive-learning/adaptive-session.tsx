"use client"

import { useState } from "react"
import { SKILLS, ITEM_BANK, bktUpdate, selectNextItem, MASTERY_THRESHOLD, type Item } from "@/lib/adaptive"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

const START_SKILL = "frac"

export function AdaptiveSession() {
  const [mastery, setMastery] = useState<Record<string, number>>(() =>
    Object.fromEntries(SKILLS.map((s) => [s.id, 0.3])),
  )
  const [skillId, setSkillId] = useState(START_SKILL)
  const [item, setItem] = useState<Item | undefined>(() => selectNextItem(ITEM_BANK, START_SKILL, 0.3))
  const [feedback, setFeedback] = useState<string | null>(null)
  const [answered, setAnswered] = useState(0)

  function answer(idx: number) {
    if (!item) return
    const correct = idx === item.answerIndex
    const updated = bktUpdate(mastery[skillId] ?? 0.3, correct)
    const nextMastery = { ...mastery, [skillId]: updated }
    setMastery(nextMastery)
    setAnswered((n) => n + 1)
    setFeedback(correct ? "Correct — increasing difficulty." : "Not quite — adjusting to support.")
    setItem(selectNextItem(ITEM_BANK, skillId, updated))
  }

  function switchSkill(id: string) {
    setSkillId(id)
    setItem(selectNextItem(ITEM_BANK, id, mastery[id] ?? 0.3))
    setFeedback(null)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <Card>
        <CardHeader>
          <CardTitle>Mastery (Bayesian knowledge tracing)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {SKILLS.map((s) => {
            const m = Math.round((mastery[s.id] ?? 0) * 100)
            const mastered = (mastery[s.id] ?? 0) >= MASTERY_THRESHOLD
            return (
              <div key={s.id}>
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => switchSkill(s.id)}
                    className={`font-medium ${s.id === skillId ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {s.name}
                  </button>
                  {mastered ? <Badge>mastered</Badge> : <span className="text-xs text-muted-foreground">{m}%</span>}
                </div>
                <Progress value={m} className="h-2 mt-1" />
              </div>
            )
          })}
          <p className="text-xs text-muted-foreground">Answered: {answered} · next item chosen by ZPD (difficulty just above mastery).</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Practice</CardTitle>
        </CardHeader>
        <CardContent>
          {item ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">difficulty {(item.difficulty * 100).toFixed(0)}%</Badge>
              </div>
              <p className="text-lg font-medium">{item.prompt}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {item.options.map((o, i) => (
                  <Button key={o} variant="outline" onClick={() => answer(i)} className="justify-start">
                    {o}
                  </Button>
                ))}
              </div>
              {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No more items for this skill.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import { QUESTION_BANK, PAPER_TARGET, newQuestionId, paperSummary, type Difficulty, type Question } from "@/lib/question-bank"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const DIFF_VARIANT: Record<Difficulty, "default" | "secondary" | "destructive"> = {
  easy: "secondary",
  medium: "default",
  hard: "destructive",
}

export function QuestionBoard() {
  const [bank, setBank] = useState<Question[]>(QUESTION_BANK)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [subject, setSubject] = useState("Mathematics")
  const [text, setText] = useState("")
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [marks, setMarks] = useState(5)

  const paper = paperSummary(bank.filter((q) => selected.has(q.id)))

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function addQuestion() {
    if (!text.trim()) return
    setBank((prev) => [{ id: newQuestionId(), subject, text: text.trim(), difficulty, marks }, ...prev])
    setText("")
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <Card>
        <CardHeader><CardTitle>Question bank ({bank.length})</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {bank.map((q) => (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => toggle(q.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-md border p-3 text-left text-sm ${selected.has(q.id) ? "border-primary bg-primary/5" : "hover:bg-accent/40"}`}
                >
                  <span>
                    <span className="font-medium">{q.text}</span>
                    <span className="block text-xs text-muted-foreground">{q.subject}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Badge variant={DIFF_VARIANT[q.difficulty]}>{q.difficulty}</Badge>
                    <span className="font-mono text-xs">{q.marks}m</span>
                    {selected.has(q.id) ? <Badge variant="outline">✓</Badge> : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4">
            <div className="space-y-1.5"><Label htmlFor="sub">Subject</Label><Input id="sub" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="mk">Marks</Label><Input id="mk" type="number" min={1} value={marks} onChange={(e) => setMarks(Number(e.target.value))} /></div>
            <div className="col-span-2 space-y-1.5"><Label htmlFor="tx">Question</Label><Input id="tx" value={text} onChange={(e) => setText(e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </select>
            </div>
            <div className="flex items-end"><Button onClick={addQuestion} disabled={!text.trim()} className="w-full">Add to bank</Button></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Paper blueprint</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold">{paper.totalMarks}</span>
            <span className="text-sm text-muted-foreground">/ {PAPER_TARGET} target</span>
          </div>
          {paper.meetsTarget ? <Badge>meets target ✓</Badge> : <Badge variant="outline">{PAPER_TARGET - paper.totalMarks} marks to target</Badge>}
          <ul className="space-y-1 text-sm">
            <li className="flex justify-between"><span>Questions</span><span>{paper.count}</span></li>
            <li className="flex justify-between"><span>Easy</span><span>{paper.byDifficulty.easy}m</span></li>
            <li className="flex justify-between"><span>Medium</span><span>{paper.byDifficulty.medium}m</span></li>
            <li className="flex justify-between"><span>Hard</span><span>{paper.byDifficulty.hard}m</span></li>
          </ul>
          <p className="text-xs text-muted-foreground">Select questions from the bank to assemble the paper toward the target marks and difficulty mix.</p>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"
import { buildDailyTasks, dayProgress, streak, TASK_LABELS } from "@/lib/today"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

// Illustrative prior-days history for the streak (most recent last).
const HISTORY = [true, true, true, false, true, true]

export function TodayLoop() {
  const tasks = useMemo(() => buildDailyTasks(), [])
  const [done, setDone] = useState<Set<string>>(new Set())

  const progress = dayProgress(tasks.length, done.size)
  const currentStreak = streak([...HISTORY, progress.complete])

  function toggle(id: string) {
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s loop</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {tasks.map((t) => {
              const checked = done.has(t.id)
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => toggle(t.id)}
                    aria-pressed={checked}
                    className={`flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition ${
                      checked ? "bg-muted/60 text-muted-foreground line-through" : "hover:bg-accent/40"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                        checked ? "bg-primary text-primary-foreground border-primary" : ""
                      }`}
                    >
                      {checked ? "✓" : ""}
                    </span>
                    <span className="flex-1">
                      <span className="font-medium">{t.title}</span>
                      {t.detail ? <span className="block text-xs text-muted-foreground">{t.detail}</span> : null}
                    </span>
                    <Badge variant="outline" className="shrink-0">
                      {TASK_LABELS[t.kind]}
                    </Badge>
                  </button>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold">{progress.pct}%</span>
              <span className="text-sm text-muted-foreground">
                {progress.done}/{progress.total} done
              </span>
            </div>
            <Progress value={progress.pct} className="mt-2 h-2" />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3 text-sm">
            <span>🔥 Streak</span>
            <Badge>{currentStreak} day{currentStreak === 1 ? "" : "s"}</Badge>
          </div>
          {progress.complete ? (
            <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">All clear for today — nice work. 🎉</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Clear today&apos;s list to extend your streak. The list is rebuilt each day from your class&apos;s live
              risk and NIPUN signals.
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setDone(new Set(tasks.map((t) => t.id)))}>
              Mark all done
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDone(new Set())}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useTransition } from "react"
import {
  RECOGNITION_STAGES,
  ELIGIBILITY_CRITERIA,
  type RecognitionApplication,
} from "@/lib/recognition"
import { advanceAction, fileAction, rejectAction, deleteAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  in_progress: "secondary",
  recognised: "default",
  rejected: "destructive",
}

export function RecognitionBoard({ initial }: { initial: RecognitionApplication[] }) {
  const [apps, setApps] = useState<RecognitionApplication[]>(initial)
  const [school, setSchool] = useState("")
  const [district, setDistrict] = useState("Chennai")
  const [type, setType] = useState<"new" | "renewal">("new")
  const [pending, startTransition] = useTransition()

  function file() {
    if (!school.trim()) return
    startTransition(async () => {
      const created = await fileAction({ school: school.trim(), district, type })
      setApps((prev) => [created, ...prev])
      setSchool("")
    })
  }

  function advance(id: string) {
    startTransition(async () => setApps(await advanceAction(id)))
  }

  function reject(id: string) {
    startTransition(async () => setApps(await rejectAction(id, "Did not meet statutory norms")))
  }

  function remove(id: string) {
    startTransition(async () => setApps(await deleteAction(id)))
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>File application (TN 1973 Act)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="school">School name</Label>
            <Input id="school" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. St. Mary's Matric" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="district">District</Label>
            <Input id="district" value={district} onChange={(e) => setDistrict(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as "new" | "renewal")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New recognition</SelectItem>
                <SelectItem value="renewal">Renewal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={file} disabled={pending || !school.trim()} className="w-full">
            {pending ? "Filing…" : "File application"}
          </Button>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Statutory eligibility criteria</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ELIGIBILITY_CRITERIA.map((c) => (
                <Badge key={c} variant="outline" className="text-xs">
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recognition pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          {apps.length ? (
            <ul className="space-y-3">
              {apps.map((a) => {
                const progress = Math.round((a.stageIndex / (RECOGNITION_STAGES.length - 1)) * 100)
                return (
                  <li key={a.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{a.school}</span>
                      <Badge variant={statusVariant[a.status]}>{a.status.replace("_", " ")}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                      <span className="font-mono">{a.id}</span>
                      <span>{a.district}</span>
                      <span>{a.type}</span>
                      <span>{RECOGNITION_STAGES[a.stageIndex]}</span>
                    </div>
                    <Progress value={progress} className="h-2 mt-2" />
                    <div className="mt-2 flex items-center gap-2">
                      {a.status === "in_progress" ? (
                        <>
                          <Button size="sm" onClick={() => advance(a.id)} disabled={pending}>
                            Advance stage
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => reject(a.id)} disabled={pending}>
                            Reject
                          </Button>
                        </>
                      ) : null}
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(a.id)} disabled={pending}>
                        Delete
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No applications yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

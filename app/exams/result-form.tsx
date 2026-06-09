"use client"

import { useActionState } from "react"
import { processResultAction, type ExamState } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ShieldCheck } from "lucide-react"

const initial: ExamState = {}

export function ResultForm() {
  const [state, formAction, isPending] = useActionState(processResultAction, initial)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Process & Anchor Result</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-3 sm:grid-cols-3 sm:items-end max-w-2xl">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="apaar">Candidate APAAR</Label>
            <Input id="apaar" name="apaar" required placeholder="APAAR-XXXXXXXXXXXX" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="examType">Exam</Label>
            <select id="examType" name="examType" defaultValue="SSLC" className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="SSLC">SSLC (Class 10)</option>
              <option value="HSC">HSC (Class 12)</option>
            </select>
          </div>
          <Button type="submit" disabled={isPending} className="sm:col-span-3 sm:w-fit">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Evaluate, anchor & push to DigiLocker
          </Button>
        </form>

        {state.error ? <p className="mt-3 text-sm text-destructive">{state.error}</p> : null}

        {state.subjects ? (
          <div className="mt-4 rounded-md border bg-muted/30 p-3 text-sm space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> anchored {state.anchor}
              </Badge>
              {state.mode ? <Badge variant="outline">{state.mode}</Badge> : null}
              <Badge variant="secondary">
                {state.total}/{state.max}
              </Badge>
            </div>
            <ul className="grid gap-1 sm:grid-cols-2">
              {state.subjects.map((s) => (
                <li key={s.name} className="flex justify-between">
                  <span>{s.name}</span>
                  <span className="font-medium">{s.marks}</span>
                </li>
              ))}
            </ul>
            {state.digiLockerUri ? (
              <p className="text-xs text-muted-foreground">
                Marksheet pushed: <span className="font-mono">{state.digiLockerUri}</span>
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

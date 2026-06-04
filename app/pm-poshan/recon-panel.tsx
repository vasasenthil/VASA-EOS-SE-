"use client"

import { useActionState } from "react"
import { reconcileAction, type ReconState } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initial: ReconState = {}

export function ReconPanel() {
  const [state, formAction] = useActionState(reconcileAction, initial)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Reconciliation (meals served vs attendance)</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-3 sm:grid-cols-3 sm:items-end max-w-2xl">
          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="attendance">Attendance</Label>
            <Input id="attendance" name="attendance" type="number" min={0} required placeholder="e.g., 412" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mealsServed">Meals served</Label>
            <Input id="mealsServed" name="mealsServed" type="number" min={0} required placeholder="e.g., 418" />
          </div>
          <Button type="submit" className="sm:col-span-3 sm:w-fit">
            Reconcile
          </Button>
        </form>

        {state.error ? <p className="mt-3 text-sm text-destructive">{state.error}</p> : null}

        {state.result ? (
          <div className="mt-4 rounded-md border bg-muted/30 p-3 text-sm space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={state.result.leakageFlag ? "destructive" : "default"}>
                variance {state.result.variance >= 0 ? "+" : ""}
                {state.result.variance}
              </Badge>
              {state.result.leakageFlag ? <Badge variant="destructive">leakage flagged</Badge> : <Badge>within tolerance</Badge>}
            </div>
            <p className="text-muted-foreground">{state.result.note}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

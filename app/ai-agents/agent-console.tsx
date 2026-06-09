"use client"

import { useActionState } from "react"
import { invokeAgentAction, type AgentConsoleState } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

export interface AgentOption {
  name: string
  label: string
  highStakes?: boolean
}

const initial: AgentConsoleState = {}

export function AgentConsole({ agents }: { agents: AgentOption[] }) {
  const [state, formAction, isPending] = useActionState(invokeAgentAction, initial)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Console (mock)</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <div className="grid gap-2">
            <label htmlFor="agent" className="text-sm font-medium">
              Agent
            </label>
            <select
              id="agent"
              name="agent"
              required
              defaultValue={agents[0]?.name}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              {agents.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.label}
                  {a.highStakes ? " (human-in-the-loop)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="input" className="text-sm font-medium">
              Prompt
            </label>
            <Textarea id="input" name="input" required placeholder="Ask the agent..." rows={3} />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Invoke
          </Button>
        </form>

        {state.error ? <p className="mt-3 text-sm text-destructive">{state.error}</p> : null}

        {state.result ? (
          <div className="mt-4 rounded-md border bg-muted/30 p-3 text-sm space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={state.result.assertive ? "default" : "secondary"}>
                confidence {(state.result.confidence * 100).toFixed(0)}%
              </Badge>
              <Badge variant="outline">{state.result.mode}</Badge>
              {state.result.requiresApproval ? <Badge variant="destructive">approval required</Badge> : null}
              {!state.result.assertive ? <Badge variant="outline">suggestion</Badge> : null}
            </div>
            <p className="whitespace-pre-wrap">{state.result.output}</p>
            {state.result.reasoning ? (
              <p className="text-xs text-muted-foreground">Reasoning: {state.result.reasoning}</p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

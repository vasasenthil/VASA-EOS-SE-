"use client"

import { useActionState } from "react"
import { translateAction, type TranslateState } from "./actions"
import { LOCALES } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Volume2 } from "lucide-react"

const initial: TranslateState = {}

export function TranslateDemo() {
  const [state, formAction, isPending] = useActionState(translateAction, initial)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Translate &amp; Speak (Bhashini)</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3 max-w-xl">
          <div className="grid gap-2">
            <Label htmlFor="text">Text</Label>
            <Textarea id="text" name="text" required rows={3} placeholder="Enter a message for parents..." />
          </div>
          <div className="flex gap-3">
            <div className="grid gap-2">
              <Label htmlFor="from">From</Label>
              <select id="from" name="from" defaultValue="en" className="h-9 rounded-md border bg-background px-3 text-sm">
                {LOCALES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="to">To</Label>
              <select id="to" name="to" defaultValue="ta" className="h-9 rounded-md border bg-background px-3 text-sm">
                {LOCALES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeLabel}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Translate
          </Button>
        </form>

        {state.error ? <p className="mt-3 text-sm text-destructive">{state.error}</p> : null}

        {state.text ? (
          <div className="mt-4 rounded-md border bg-muted/30 p-3 text-sm space-y-2">
            <div className="flex items-center gap-2">
              <Badge>translation</Badge>
              {state.mode ? <Badge variant="outline">{state.mode}</Badge> : null}
            </div>
            <p className="text-base">{state.text}</p>
            {state.audioRef ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Volume2 className="h-3.5 w-3.5" /> IVR audio ready: <span className="font-mono">{state.audioRef}</span>
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

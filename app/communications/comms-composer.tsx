"use client"

import { useState } from "react"
import {
  CHANNELS,
  AUDIENCES,
  audienceSize,
  validateMessage,
  MAX_LEN,
  type Channel,
  type Audience,
  type Message,
} from "@/lib/comms"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function CommsComposer() {
  const [sent, setSent] = useState<Message[]>([])
  const [channel, setChannel] = useState<Channel>("sms")
  const [audience, setAudience] = useState<Audience>("all_parents")
  const [body, setBody] = useState("")

  const recipients = audienceSize(audience)
  const error = validateMessage(body)

  function send() {
    if (error) return
    setSent((prev) => [
      {
        id: `msg-${Date.now()}`,
        channel,
        audience,
        body: body.trim(),
        recipients,
        sentAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      },
      ...prev,
    ])
    setBody("")
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <Card>
        <CardHeader>
          <CardTitle>Compose</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Channel</Label>
            <select value={channel} onChange={(e) => setChannel(e.target.value as Channel)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {CHANNELS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Audience</Label>
            <select value={audience} onChange={(e) => setAudience(e.target.value as Audience)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {AUDIENCES.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select>
            <p className="text-xs text-muted-foreground">{recipients} recipient{recipients === 1 ? "" : "s"}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">Message</Label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full rounded-md border bg-background p-2 text-sm"
              placeholder="Type your message…"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className={error ? "text-destructive" : ""}>{error ?? "Ready to send"}</span>
              <span>{body.trim().length}/{MAX_LEN}</span>
            </div>
          </div>
          <Button onClick={send} disabled={!!error} className="w-full">
            Send to {recipients}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sent ({sent.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages sent yet.</p>
          ) : (
            <ul className="space-y-2">
              {sent.map((m) => (
                <li key={m.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="uppercase">{m.channel}</Badge>
                      <span className="text-muted-foreground">{m.recipients} recipients</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{m.sentAt}</span>
                  </div>
                  <p className="mt-1">{m.body}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

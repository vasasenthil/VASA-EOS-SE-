"use client"

import { useState } from "react"
import {
  MessageSquare,
  Bell,
  Send,
  User,
  Building,
  Clock,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PageHeader,
  PageHeaderHeading,
  PageHeaderDescription,
} from "@/components/page-header"

const NOTICES = [
  {
    id: 1,
    title: "Annual Day Celebration — 15 April 2026",
    body: "The Annual Day function will be held on 15 April at 10:00 AM. All parents are cordially invited. Please confirm attendance by 10 April.",
    from: "Principal's Office",
    date: "30 Mar 2026",
    type: "Event",
    read: false,
  },
  {
    id: 2,
    title: "Parent-Teacher Meeting — 5 April 2026",
    body: "PTM is scheduled for 5 April 2026 from 10:00 AM to 1:00 PM. Kindly attend to discuss your child's academic progress.",
    from: "Class Teacher",
    date: "28 Mar 2026",
    type: "Meeting",
    read: false,
  },
  {
    id: 3,
    title: "Holiday Notice — Dr. Ambedkar Jayanti",
    body: "The school will remain closed on 14 April 2026 on account of Dr. B.R. Ambedkar Jayanti.",
    from: "Admin Office",
    date: "27 Mar 2026",
    type: "Holiday",
    read: true,
  },
  {
    id: 4,
    title: "SA-2 Examination Schedule Released",
    body: "The SA-2 (Summative Assessment 2) timetable has been released. Exams commence from 25 April 2026. Please download the schedule from the school website.",
    from: "Examination Cell",
    date: "25 Mar 2026",
    type: "Exam",
    read: true,
  },
  {
    id: 5,
    title: "Fee Reminder — Term 4 Due",
    body: "This is a gentle reminder that Term 4 tuition fee and exam fee totalling ₹3,800 is due by 15 April 2026. Kindly clear dues to avoid late charges.",
    from: "Accounts Office",
    date: "20 Mar 2026",
    type: "Fee",
    read: true,
  },
]

const RECIPIENTS = [
  "Class Teacher",
  "Subject Teacher — Mathematics",
  "Subject Teacher — Science",
  "Subject Teacher — English",
  "Principal's Office",
  "Accounts Office",
]

const typeBadgeVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Event: "default",
  Meeting: "secondary",
  Holiday: "outline",
  Exam: "destructive",
  Fee: "secondary",
}

export default function ParentCommunicationPage() {
  const [notices, setNotices] = useState(NOTICES)
  const [selected, setSelected] = useState<typeof NOTICES[0] | null>(null)
  const [recipient, setRecipient] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sent, setSent] = useState(false)

  function markRead(id: number) {
    setNotices((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  function openNotice(n: typeof NOTICES[0]) {
    setSelected(n)
    markRead(n.id)
  }

  function handleSend() {
    if (!recipient || !subject || !message) return
    setSent(true)
    setRecipient("")
    setSubject("")
    setMessage("")
    setTimeout(() => setSent(false), 3000)
  }

  const unreadCount = notices.filter((n) => !n.read).length

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader>
        <div>
          <PageHeaderHeading>Communication</PageHeaderHeading>
          <PageHeaderDescription>
            School notices and messaging — Aryan Sharma · Class 9-A
          </PageHeaderDescription>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inbox */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-600" />
                School Notices
                {unreadCount > 0 && (
                  <Badge className="ml-2">{unreadCount} new</Badge>
                )}
              </CardTitle>
              <CardDescription>Announcements, events, and circulars</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {notices.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openNotice(n)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-slate-50 ${
                    selected?.id === n.id ? "border-blue-300 bg-blue-50" : ""
                  } ${!n.read ? "border-l-4 border-l-blue-500" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm font-medium ${!n.read ? "font-semibold" : ""}`}>
                      {n.title}
                    </p>
                    <Badge variant={typeBadgeVariant[n.type] ?? "outline"} className="text-xs shrink-0 ml-2">
                      {n.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building className="h-3 w-3" />
                    {n.from}
                    <Clock className="h-3 w-3 ml-2" />
                    {n.date}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Notice Detail */}
          {selected && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{selected.title}</CardTitle>
                <CardDescription>
                  From: {selected.from} · {selected.date}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{selected.body}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Send Message */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Send Message
              </CardTitle>
              <CardDescription>Write to a teacher or admin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sent && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                  Message sent successfully!
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">To</label>
                <Select value={recipient} onValueChange={setRecipient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECIPIENTS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Subject</label>
                <Input
                  placeholder="Message subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Message</label>
                <Textarea
                  placeholder="Type your message here..."
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSend}
                disabled={!recipient || !subject || !message}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

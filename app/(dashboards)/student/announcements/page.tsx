import {
  Bell, AlertTriangle, CheckCircle2, Calendar, MessageSquare,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shell } from "@/components/shell"
import { PageHeader } from "@/components/page-header"

const stats = [
  { label: "New Announcements", value: "3", colour: "text-blue-600" },
  { label: "Pending Acknowledgement", value: "2", colour: "text-orange-600" },
]

const priorityNotices = [
  {
    title: "Board Exam Fee Submission — Last Date December 15, 2025",
    from: "Principal",
    category: "Administrative",
    description: "CBSE Board Examination fee for Class X students must be submitted to the school office by December 15, 2025. Bring DD or online payment receipt. Fee: ₹1,500 (General), ₹1,200 (SC/ST/OBC). Contact school office for fee waiver under RTE provisions.",
    date: "2025-11-22",
    acknowledged: false,
  },
  {
    title: "Pre-Matric Scholarship Applications Open — SC/ST Students Grade 9-10",
    from: "School Counsellor",
    category: "Scholarship",
    description: "Pre-Matric Scholarship applications under MoSJE are open until November 30, 2025. SC/ST students of Class IX and X with family income below ₹2.5 Lakh per annum are eligible. Submit Form along with income certificate, caste certificate, and bank passbook copy.",
    date: "2025-11-18",
    acknowledged: false,
  },
  {
    title: "NIPUN Bharat Assessment for Grade 3-5 — December 10-12, 2025",
    from: "Academic Head",
    category: "Academic",
    description: "Note: This is for information about your younger siblings and neighbors. The NIPUN Bharat Foundational Assessment will be conducted for Grades 3, 4, and 5 on December 10-12, 2025. No preparation needed — it is a diagnostic, not a scored assessment.",
    date: "2025-11-20",
    acknowledged: true,
  },
]

const allAnnouncements = [
  { id: "ANN-047", category: "Academic", title: "SA2 Examination Schedule Released", from: "Academic Head", date: "2025-11-23", scope: "Class X", acknowledged: true },
  { id: "ANN-046", category: "Administrative", title: "Board Exam Fee Submission Deadline", from: "Principal", date: "2025-11-22", scope: "Class X-XII", acknowledged: false },
  { id: "ANN-045", category: "Event", title: "Annual Sports Day — December 22, 2025", from: "Vice Principal", date: "2025-11-21", scope: "School-wide", acknowledged: true },
  { id: "ANN-044", category: "Scholarship", title: "Pre-Matric Scholarship — Application Open", from: "School Counsellor", date: "2025-11-18", scope: "Class IX-X SC/ST", acknowledged: false },
  { id: "ANN-043", category: "Academic", title: "NIPUN Bharat Assessment (for Grade 3-5)", from: "Academic Head", date: "2025-11-20", scope: "Grade 3-5 (FYI)", acknowledged: true },
  { id: "ANN-042", category: "Health", title: "Annual Health Check-up (RBSK) — December 5-8", from: "Health Teacher", date: "2025-11-17", scope: "School-wide", acknowledged: true },
  { id: "ANN-041", category: "Event", title: "Parent-Teacher Meeting — November 29", from: "Class Teacher", date: "2025-11-14", scope: "Class X-B", acknowledged: true },
  { id: "ANN-040", category: "Academic", title: "Textbook Return Reminder — End of Year", from: "Librarian", date: "2025-11-10", scope: "Class X-XII", acknowledged: true },
  { id: "ANN-039", category: "Alert", title: "POCSO Awareness — Important Briefing", from: "Principal", date: "2025-11-08", scope: "School-wide", acknowledged: true },
  { id: "ANN-038", category: "Academic", title: "Digital Library Credentials Updated", from: "IT Coordinator", date: "2025-11-05", scope: "All Students", acknowledged: true },
  { id: "ANN-037", category: "Administrative", title: "Winter Uniform Compulsory from December 1", from: "Principal", date: "2025-11-01", scope: "School-wide", acknowledged: true },
  { id: "ANN-036", category: "Event", title: "Children's Day Celebration — November 14", from: "Student Council", date: "2025-10-28", scope: "School-wide", acknowledged: true },
]

const classNotices = [
  { title: "FA3 Assessment Date Changed to December 8-10 (was Dec 5-7)", date: "2025-11-24", from: "Class Teacher Ms. R. Sharma" },
  { title: "Computer Lab Practical Extra Class — Saturdays 10 AM (Nov 30, Dec 7)", date: "2025-11-22", from: "CS Teacher" },
  { title: "Math Olympiad Practice Session — Thursday 3:45 PM (selected students)", date: "2025-11-20", from: "Mr. Arun Mehta" },
  { title: "Class Photograph Rescheduled to November 28 (Period 5)", date: "2025-11-18", from: "Class Teacher" },
  { title: "Science Project Submission Deadline Extended to December 1 (was Nov 25)", date: "2025-11-15", from: "Ms. Rekha Pillai" },
]

const calendarEvents = [
  { date: "2025-11-25", event: "Parent-Teacher Meeting (PTM)", relevant: true },
  { date: "2025-11-28", event: "Class Photograph Day", relevant: true },
  { date: "2025-11-30", event: "Scholarship Application Deadline (SC/ST)", relevant: true },
  { date: "2025-12-01", event: "Science Project Submission Deadline", relevant: true },
  { date: "2025-12-05", event: "Annual Health Check-up (RBSK) Begins", relevant: true },
  { date: "2025-12-08", event: "FA3 Formative Assessment Begins", relevant: true },
  { date: "2025-12-15", event: "Board Exam Fee Payment Deadline", relevant: true },
  { date: "2025-12-22", event: "Annual Sports Day", relevant: true },
  { date: "2025-12-24", event: "Winter Break Begins", relevant: true },
  { date: "2026-01-02", event: "School Reopens — New Term", relevant: true },
]

function CategoryBadge({ c }: { c: string }) {
  const map: Record<string, string> = {
    Academic: "bg-blue-100 text-blue-700 border-blue-300",
    Administrative: "bg-gray-100 text-gray-700 border-gray-300",
    Event: "bg-green-100 text-green-700 border-green-300",
    Scholarship: "bg-purple-100 text-purple-700 border-purple-300",
    Health: "bg-teal-100 text-teal-700 border-teal-300",
    Alert: "bg-red-100 text-red-700 border-red-300",
  }
  return <Badge className={`${map[c] ?? "bg-gray-100 text-gray-700"} border text-xs`}>{c}</Badge>
}

export default function StudentAnnouncementsPage() {
  return (
    <Shell>
      <PageHeader
        title="Announcements & Notices"
        description="Ananya Mishra — Class X-B | School notices, class announcements and upcoming events"
      />

      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6 text-center">
              <p className={`text-4xl font-bold ${s.colour}`}>{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Priority Notices */}
      <Card className="mb-6 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-orange-700"><AlertTriangle className="h-4 w-4" />Priority Notices — Action Required</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {priorityNotices.map((n, i) => (
              <div key={i} className={`border rounded-lg p-4 ${n.acknowledged ? "bg-gray-50 border-gray-200" : "bg-orange-50 border-orange-300"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${n.acknowledged ? "text-gray-700" : "text-orange-800"}`}>{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">From: {n.from} · {n.date}</p>
                  </div>
                  <CategoryBadge c={n.category} />
                </div>
                <p className="text-xs text-gray-700">{n.description}</p>
                <div className="mt-2 flex justify-end">
                  {n.acknowledged ? (
                    <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Acknowledged</span>
                  ) : (
                    <Button variant="outline" size="sm" className="text-xs border-orange-400 text-orange-700">Mark as Acknowledged</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Announcements */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4 text-blue-600" />All Announcements</CardTitle>
          <CardDescription>School-wide and class-specific notices for this term</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allAnnouncements.map((a) => (
                <TableRow key={a.id}>
                  <TableCell><CategoryBadge c={a.category} /></TableCell>
                  <TableCell className="text-sm font-medium">{a.title}</TableCell>
                  <TableCell className="text-xs text-gray-600">{a.from}</TableCell>
                  <TableCell className="text-xs text-gray-500">{a.date}</TableCell>
                  <TableCell className="text-xs text-gray-600">{a.scope}</TableCell>
                  <TableCell>
                    {a.acknowledged ? (
                      <span className="text-green-600 text-xs flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Read</span>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-700 border-orange-300 border text-xs">Unread</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class X-B Notices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-4 w-4 text-teal-600" />Class X-B Specific Notices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {classNotices.map((n, i) => (
                <div key={i} className="p-3 bg-teal-50 border border-teal-100 rounded-md">
                  <p className="text-sm font-medium text-teal-800">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.from} · {n.date}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4 text-purple-600" />Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {calendarEvents.map((e, i) => (
                <div key={i} className="flex items-center gap-3 p-2 border rounded-md">
                  <div className="bg-purple-100 text-purple-700 text-xs font-bold rounded px-2 py-1 text-center min-w-[40px]">
                    {e.date.split("-")[2]}<br />{new Date(e.date).toLocaleString("default", { month: "short" })}
                  </div>
                  <p className="text-sm text-gray-700">{e.event}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

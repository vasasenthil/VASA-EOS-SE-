import {
  BookOpen, Bookmark, Download, ExternalLink, Monitor, Clock,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shell } from "@/components/shell"
import { PageHeader } from "@/components/page-header"

const stats = [
  { label: "Resources Available", value: "12,847", colour: "text-blue-600" },
  { label: "My Bookmarks", value: "34", colour: "text-purple-600" },
  { label: "Recently Viewed", value: "12", colour: "text-green-600" },
  { label: "Downloads This Month", value: "8", colour: "text-orange-600" },
]

const featuredResources = [
  { subject: "Mathematics", title: "Trigonometry — Complete NCERT Chapter Notes", type: "PDF", source: "NCERT Portal" },
  { subject: "Physics", title: "Electricity & Magnetism — Animated Simulations", type: "Interactive", source: "PhET Simulations" },
  { subject: "Chemistry", title: "Periodic Table Interactive & Bonding Visualiser", type: "Interactive", source: "DIKSHA" },
  { subject: "English", title: "First Flight Textbook — Chapter Summaries & Analysis", type: "PDF", source: "CBSE Academic" },
  { subject: "Biology", title: "Life Processes — Video Lectures (NCERT Aligned)", type: "Video", source: "DIKSHA" },
  { subject: "Social Studies", title: "India and the Contemporary World — Chapter Notes", type: "PDF", source: "NCERT Portal" },
]

const bookmarks = [
  { subject: "Mathematics", title: "Trigonometric Identities — Quick Reference Sheet", type: "PDF", source: "CBSE Academic", lastAccessed: "2025-11-24", rating: 5 },
  { subject: "Physics", title: "Class X Physics — Light Reflection & Refraction Notes", type: "PDF", source: "NCERT Portal", lastAccessed: "2025-11-22", rating: 5 },
  { subject: "Science", title: "Carbon Compounds — NCERT Animated Lesson", type: "Video", source: "DIKSHA", lastAccessed: "2025-11-20", rating: 4 },
  { subject: "Mathematics", title: "Coordinate Geometry — Interactive Graph Explorer", type: "Simulation", source: "Desmos (CBSE linked)", lastAccessed: "2025-11-18", rating: 5 },
  { subject: "English", title: "Formal Letter Writing — Format & Practice", type: "PDF", source: "CBSE Academic", lastAccessed: "2025-11-15", rating: 4 },
  { subject: "Chemistry", title: "Metals and Non-Metals — Lab Demonstration Video", type: "Video", source: "DIKSHA", lastAccessed: "2025-11-12", rating: 4 },
  { subject: "Social Studies", title: "Nationalism in India — NCERT Mind Map", type: "PDF", source: "NCERT Portal", lastAccessed: "2025-11-10", rating: 4 },
  { subject: "Computer Science", title: "Python for Beginners — CBSE CS Self-Learning Module", type: "Interactive", source: "CBSE Academic", lastAccessed: "2025-11-08", rating: 5 },
]

const subjectLibrary = [
  { subject: "Mathematics", count: 2847, colour: "bg-blue-100 text-blue-700" },
  { subject: "Science (Physics + Chemistry + Bio)", count: 3124, colour: "bg-green-100 text-green-700" },
  { subject: "English", count: 1843, colour: "bg-yellow-100 text-yellow-700" },
  { subject: "Social Studies", count: 1654, colour: "bg-orange-100 text-orange-700" },
  { subject: "Hindi", count: 987, colour: "bg-red-100 text-red-700" },
  { subject: "Computer Science", count: 1392, colour: "bg-purple-100 text-purple-700" },
]

const textbooks = [
  { title: "Mathematics — Real Numbers to Statistics (Class X)", status: "Downloaded" },
  { title: "Science — NCERT Class X (Physics, Chemistry, Biology)", status: "Downloaded" },
  { title: "First Flight — English Literature Class X", status: "Downloaded" },
  { title: "Footprints Without Feet — English Supplementary", status: "Not Downloaded" },
  { title: "Contemporary India II — Geography Class X", status: "Downloaded" },
  { title: "India and the Contemporary World — History Class X", status: "Downloaded" },
  { title: "Democratic Politics II — Civics Class X", status: "Not Downloaded" },
  { title: "Sparsh & Sanchayan — Hindi Class X", status: "Downloaded" },
]

const recentlyAccessed = [
  { title: "Trigonometric Identities Reference Sheet", subject: "Mathematics", accessed: "2025-11-24", timeSpent: "12 min" },
  { title: "Light Reflection & Refraction Notes", subject: "Physics", accessed: "2025-11-22", timeSpent: "25 min" },
  { title: "Carbon Compounds — Animated Lesson", subject: "Chemistry", accessed: "2025-11-20", timeSpent: "18 min" },
  { title: "Coordinate Geometry Graph Explorer", subject: "Mathematics", accessed: "2025-11-18", timeSpent: "35 min" },
  { title: "Formal Letter Writing Guide", subject: "English", accessed: "2025-11-15", timeSpent: "8 min" },
  { title: "Metals Lab Demo Video", subject: "Chemistry", accessed: "2025-11-12", timeSpent: "14 min" },
  { title: "Nationalism in India Mind Map", subject: "Social Studies", accessed: "2025-11-10", timeSpent: "10 min" },
  { title: "Python Basics — Module 1", subject: "Computer Science", accessed: "2025-11-08", timeSpent: "42 min" },
  { title: "Heredity and Evolution NCERT Notes", subject: "Biology", accessed: "2025-11-05", timeSpent: "20 min" },
  { title: "Electricity Numericals Practice Sheet", subject: "Physics", accessed: "2025-11-02", timeSpent: "30 min" },
]

function TypeBadge({ t }: { t: string }) {
  const map: Record<string, string> = {
    PDF: "bg-red-100 text-red-700 border-red-200",
    Video: "bg-blue-100 text-blue-700 border-blue-200",
    Interactive: "bg-green-100 text-green-700 border-green-200",
    Simulation: "bg-purple-100 text-purple-700 border-purple-200",
  }
  return <Badge className={`${map[t] ?? "bg-gray-100 text-gray-700"} border text-xs`}>{t}</Badge>
}

export default function StudentResourcesPage() {
  return (
    <Shell>
      <PageHeader
        title="Learning Resources"
        description="Ananya Mishra — Class X-B | Digital library, bookmarks and NCERT content"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6 text-center">
              <p className={`text-3xl font-bold ${s.colour}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Featured Resources */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-blue-600" />Featured Resources — Recommended for Class X</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {featuredResources.map((r, i) => (
              <div key={i} className="border rounded-lg p-3 hover:bg-blue-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 border text-xs">{r.subject}</Badge>
                  <TypeBadge t={r.type} />
                </div>
                <p className="text-sm font-medium">{r.title}</p>
                <p className="text-xs text-gray-500 mt-1">{r.source}</p>
                <Button variant="outline" size="sm" className="w-full mt-2 text-xs">
                  <ExternalLink className="h-3 w-3 mr-1" />Open Resource
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Subject Library */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Monitor className="h-4 w-4 text-purple-600" />Subject Resource Library</CardTitle>
            <CardDescription>Available resources across all subjects (DIKSHA + NCERT + CBSE)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {subjectLibrary.map((s) => (
                <div key={s.subject} className={`rounded-lg p-3 ${s.colour}`}>
                  <p className="text-xs font-medium">{s.subject}</p>
                  <p className="text-2xl font-bold">{s.count.toLocaleString()}</p>
                  <p className="text-xs opacity-75">resources</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recently Accessed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4 text-orange-600" />Recently Accessed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {recentlyAccessed.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-2 border rounded text-xs">
                  <div>
                    <p className="font-medium text-gray-800">{r.title}</p>
                    <p className="text-gray-500">{r.subject} · {r.accessed}</p>
                  </div>
                  <span className="text-gray-400 whitespace-nowrap ml-2">{r.timeSpent}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookmarks */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Bookmark className="h-4 w-4 text-yellow-600" />My Bookmarks (34)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Last Accessed</TableHead>
                <TableHead className="text-center">Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookmarks.map((b, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 border text-xs">{b.subject}</Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{b.title}</TableCell>
                  <TableCell><TypeBadge t={b.type} /></TableCell>
                  <TableCell className="text-xs text-gray-600">{b.source}</TableCell>
                  <TableCell className="text-xs text-gray-500">{b.lastAccessed}</TableCell>
                  <TableCell className="text-center text-yellow-500 text-sm">{"★".repeat(b.rating)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Textbooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Download className="h-4 w-4 text-teal-600" />NCERT Textbook Downloads</CardTitle>
          <CardDescription>Class X prescribed textbooks — download status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {textbooks.map((t, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-md">
                <p className="text-sm">{t.title}</p>
                {t.status === "Downloaded" ? (
                  <Badge className="bg-green-100 text-green-700 border-green-300 border text-xs ml-2 flex-shrink-0">Downloaded</Badge>
                ) : (
                  <Button variant="outline" size="sm" className="ml-2 flex-shrink-0 text-xs">
                    <Download className="h-3 w-3 mr-1" />Download
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Shell>
  )
}

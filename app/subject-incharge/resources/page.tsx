"use client"

import {
  Package,
  BookOpen,
  Monitor,
  Archive,
  Database,
  Layers,
  ShoppingCart,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Shell } from "@/components/shell"
import {
  PageHeader,
  PageHeaderHeading,
  PageHeaderDescription,
} from "@/components/page-header"

// ─── Mock Data ────────────────────────────────────────────────────────────────

const kpiCards = [
  {
    label: "Total Resources",
    value: "3,847",
    sub: "All categories combined",
    icon: Package,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Item Bank Questions",
    value: "1,842",
    sub: "Across 10 topic areas",
    icon: Database,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    label: "Digital Resources",
    value: "423",
    sub: "Across 8 platforms/tools",
    icon: Monitor,
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    label: "Physical Resources",
    value: "156",
    sub: "Inventory line items tracked",
    icon: Archive,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
]

const itemBankData = [
  {
    topic: "Number System",
    total: 248,
    easy: 90,
    medium: 102,
    hard: 56,
    lastUpdated: "12 Mar 2025",
    ncertChapters: "Ch. 1 (VI), Ch. 1 (IX)",
  },
  {
    topic: "Algebra & Polynomials",
    total: 312,
    easy: 110,
    medium: 140,
    hard: 62,
    lastUpdated: "18 Mar 2025",
    ncertChapters: "Ch. 2–4 (VIII–X)",
  },
  {
    topic: "Geometry",
    total: 198,
    easy: 78,
    medium: 82,
    hard: 38,
    lastUpdated: "05 Mar 2025",
    ncertChapters: "Ch. 5–7 (VI–IX)",
  },
  {
    topic: "Mensuration",
    total: 172,
    easy: 64,
    medium: 76,
    hard: 32,
    lastUpdated: "22 Feb 2025",
    ncertChapters: "Ch. 11 (VII–IX)",
  },
  {
    topic: "Statistics",
    total: 143,
    easy: 58,
    medium: 62,
    hard: 23,
    lastUpdated: "28 Feb 2025",
    ncertChapters: "Ch. 14 (IX), Ch. 14 (X)",
  },
  {
    topic: "Probability",
    total: 118,
    easy: 42,
    medium: 54,
    hard: 22,
    lastUpdated: "10 Mar 2025",
    ncertChapters: "Ch. 15 (IX–X)",
  },
  {
    topic: "Coordinate Geometry",
    total: 136,
    easy: 44,
    medium: 62,
    hard: 30,
    lastUpdated: "15 Mar 2025",
    ncertChapters: "Ch. 3 (X)",
  },
  {
    topic: "Trigonometry",
    total: 154,
    easy: 46,
    medium: 70,
    hard: 38,
    lastUpdated: "20 Mar 2025",
    ncertChapters: "Ch. 8–9 (X)",
  },
  {
    topic: "Quadratic Equations",
    total: 188,
    easy: 62,
    medium: 86,
    hard: 40,
    lastUpdated: "25 Mar 2025",
    ncertChapters: "Ch. 4 (X)",
  },
  {
    topic: "Linear Equations",
    total: 173,
    easy: 68,
    medium: 74,
    hard: 31,
    lastUpdated: "08 Mar 2025",
    ncertChapters: "Ch. 3–4 (VIII–IX)",
  },
]

const physicalInventory = [
  { item: "Protractors (30 cm)", quantity: 420, condition: "Good", location: "Math Lab – Shelf A1" },
  { item: "Geometric Compasses", quantity: 380, condition: "Good", location: "Math Lab – Shelf A2" },
  { item: "Graph Paper Reams (A4)", quantity: 34, condition: "Good", location: "Storeroom – Rack 3" },
  { item: "Scientific Calculators", quantity: 120, condition: "Good", location: "Math Lab – Cabinet B" },
  { item: "Geometric Models (3D Solids)", quantity: 48, condition: "Fair", location: "Math Lab – Display" },
  { item: "Number Cards (1–100 sets)", quantity: 62, condition: "Good", location: "Class VI Prep Room" },
  { item: "Measurement Tapes (1 m)", quantity: 55, condition: "Fair", location: "Math Lab – Shelf B3" },
  { item: "Abacus Sets", quantity: 36, condition: "Fair", location: "Class VI–VII Prep Room" },
  { item: "Fraction Tiles (sets)", quantity: 28, condition: "Fair", location: "Class VII Prep Room" },
  { item: "Algebra Tiles (sets)", quantity: 22, condition: "Good", location: "Math Lab – Cabinet C" },
  { item: "Tangram Sets", quantity: 44, condition: "Good", location: "Class VIII Prep Room" },
  { item: "Digital Projectors (Math Rooms)", quantity: 6, condition: "2 Out of Order", location: "Math Rooms 101–106" },
]

const digitalCatalogue = [
  {
    platform: "DIKSHA Portal",
    resourcesAvailable: 87,
    usageFrequency: "Daily",
    type: "Content Library",
    access: "Free",
  },
  {
    platform: "Khan Academy",
    resourcesAvailable: 64,
    usageFrequency: "Weekly",
    type: "Video + Practice",
    access: "Free",
  },
  {
    platform: "GeoGebra",
    resourcesAvailable: 52,
    usageFrequency: "3x/Week",
    type: "Interactive Tools",
    access: "Free",
  },
  {
    platform: "Desmos",
    resourcesAvailable: 31,
    usageFrequency: "Weekly",
    type: "Graphing Calculator",
    access: "Free",
  },
  {
    platform: "CBSE Academic Portal",
    resourcesAvailable: 48,
    usageFrequency: "Fortnightly",
    type: "Sample Papers + Guidelines",
    access: "Free",
  },
  {
    platform: "NCERT Portal",
    resourcesAvailable: 72,
    usageFrequency: "Weekly",
    type: "Textbooks + Solutions",
    access: "Free",
  },
  {
    platform: "PhET Simulations",
    resourcesAvailable: 24,
    usageFrequency: "Monthly",
    type: "Interactive Simulations",
    access: "Free",
  },
  {
    platform: "YouTube EDU (Math Channels)",
    resourcesAvailable: 45,
    usageFrequency: "Weekly",
    type: "Video Lessons",
    access: "Free",
  },
]

const resourceRequests = [
  {
    item: "Additional Geometric Compass Sets (×100)",
    qty: 100,
    justification: "Class IX–X exam season need; current stock insufficient",
    requestedBy: "Ms. Rekha Sharma",
    status: "Pending Approval",
  },
  {
    item: "A4 Graph Paper Reams (×50)",
    qty: 50,
    justification: "Statistics and coordinate geometry practicals for SA-2",
    requestedBy: "Mr. Suresh Yadav",
    status: "Pending Approval",
  },
  {
    item: "Repair/Replace Projectors (Math Room 104 & 106)",
    qty: 2,
    justification: "2 projectors out of order since January 2025; digital class impacted",
    requestedBy: "Mr. Arun Mehta",
    status: "Approved – Awaiting Procurement",
  },
  {
    item: "GeoGebra Classroom License (1-yr)",
    qty: 1,
    justification: "Enable cloud-save and student collaboration features for Class IX–X",
    requestedBy: "Ms. Deepa Nair",
    status: "Under Review",
  },
  {
    item: "Probability Dice & Card Sets (×30)",
    qty: 30,
    justification: "Required for Probability practical activities (Class IX–X, Chapter 15)",
    requestedBy: "Mr. Praveen Kumar",
    status: "Pending Approval",
  },
]

const usageAnalytics = [
  {
    resource: "Scientific Calculators",
    jan: 74,
    feb: 88,
    mar: 92,
    trend: "up",
  },
  {
    resource: "Graph Paper Reams",
    jan: 18,
    feb: 22,
    mar: 28,
    trend: "up",
  },
  {
    resource: "Geometric Compasses",
    jan: 210,
    feb: 180,
    mar: 195,
    trend: "stable",
  },
  {
    resource: "Protractors",
    jan: 180,
    feb: 165,
    mar: 170,
    trend: "stable",
  },
  {
    resource: "GeoGebra Sessions (logins)",
    jan: 340,
    feb: 420,
    mar: 510,
    trend: "up",
  },
]

// ─── Helper Components ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Good": "bg-green-100 text-green-700",
    "Fair": "bg-yellow-100 text-yellow-700",
    "2 Out of Order": "bg-red-100 text-red-700",
    "Pending Approval": "bg-amber-100 text-amber-700",
    "Approved – Awaiting Procurement": "bg-blue-100 text-blue-700",
    "Under Review": "bg-purple-100 text-purple-700",
    "Daily": "bg-green-100 text-green-700",
    "3x/Week": "bg-teal-100 text-teal-700",
    "Weekly": "bg-blue-100 text-blue-700",
    "Fortnightly": "bg-indigo-100 text-indigo-700",
    "Monthly": "bg-gray-100 text-gray-600",
  }
  return (
    <Badge className={`${map[status] ?? "bg-gray-100 text-gray-600"} border-0 text-xs font-medium`}>
      {status}
    </Badge>
  )
}

function SectionHeading({
  icon: Icon,
  title,
  description,
  iconColor = "text-blue-600",
}: {
  icon: React.ElementType
  title: string
  description?: string
  iconColor?: string
}) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`h-5 w-5 ${iconColor}`} />
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <span className="text-green-600 text-xs font-bold">▲</span>
  if (trend === "down") return <span className="text-red-600 text-xs font-bold">▼</span>
  return <span className="text-gray-400 text-xs font-bold">–</span>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResourcesPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Mathematics Resource Allocation &amp; Item Bank</PageHeaderHeading>
        <PageHeaderDescription>
          Module 22.1 &mdash; Mathematics Department Resource Management &mdash; Item Bank, Physical Inventory, Digital Catalogue &amp; Requests
        </PageHeaderDescription>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${k.bg} mb-2`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div className={`text-2xl font-bold ${k.color} leading-tight`}>{k.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{k.sub}</div>
              <div className="text-xs font-medium text-gray-600 mt-1">{k.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section A: Item Bank */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <SectionHeading
            icon={Database}
            title="Section A — Item Bank (Topic-wise Question Distribution)"
            description="1,842 questions across 10 topic areas · Difficulty split: Easy / Medium / Hard · Mapped to NCERT chapters"
            iconColor="text-indigo-600"
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs min-w-[180px]">Topic Area</TableHead>
                  <TableHead className="text-xs text-center">Total Qs</TableHead>
                  <TableHead className="text-xs text-center text-green-700">Easy</TableHead>
                  <TableHead className="text-xs text-center text-amber-700">Medium</TableHead>
                  <TableHead className="text-xs text-center text-red-700">Hard</TableHead>
                  <TableHead className="text-xs text-center w-36">Distribution</TableHead>
                  <TableHead className="text-xs">Last Updated</TableHead>
                  <TableHead className="text-xs">NCERT Chapters</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemBankData.map((row) => (
                  <TableRow key={row.topic} className="text-xs">
                    <TableCell className="font-medium">{row.topic}</TableCell>
                    <TableCell className="text-center font-bold text-gray-800">{row.total}</TableCell>
                    <TableCell className="text-center text-green-700 font-semibold">{row.easy}</TableCell>
                    <TableCell className="text-center text-amber-700 font-semibold">{row.medium}</TableCell>
                    <TableCell className="text-center text-red-700 font-semibold">{row.hard}</TableCell>
                    <TableCell>
                      <div className="flex gap-0.5 items-center h-3">
                        <div
                          className="bg-green-400 h-3 rounded-l"
                          style={{ width: `${(row.easy / row.total) * 100}%` }}
                          title={`Easy: ${row.easy}`}
                        />
                        <div
                          className="bg-amber-400 h-3"
                          style={{ width: `${(row.medium / row.total) * 100}%` }}
                          title={`Medium: ${row.medium}`}
                        />
                        <div
                          className="bg-red-400 h-3 rounded-r"
                          style={{ width: `${(row.hard / row.total) * 100}%` }}
                          title={`Hard: ${row.hard}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.lastUpdated}</TableCell>
                    <TableCell className="text-muted-foreground">{row.ncertChapters}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Section B: Physical Inventory */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <SectionHeading
            icon={Archive}
            title="Section B — Physical Resource Inventory"
            description="12 physical resource categories tracked with quantity, condition and storage location"
            iconColor="text-amber-600"
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs min-w-[220px]">Item</TableHead>
                  <TableHead className="text-xs text-center">Quantity</TableHead>
                  <TableHead className="text-xs text-center">Condition</TableHead>
                  <TableHead className="text-xs">Storage Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {physicalInventory.map((row) => (
                  <TableRow key={row.item} className="text-xs">
                    <TableCell className="font-medium">{row.item}</TableCell>
                    <TableCell className="text-center font-bold text-gray-800">{row.quantity}</TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={row.condition} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.location}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Section C: Digital Resource Catalogue */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <SectionHeading
            icon={Monitor}
            title="Section C — Digital Resource Catalogue"
            description="8 platforms and online tools used by the Mathematics department"
            iconColor="text-teal-600"
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs min-w-[180px]">Platform / Tool</TableHead>
                  <TableHead className="text-xs text-center">Resources Available</TableHead>
                  <TableHead className="text-xs">Resource Type</TableHead>
                  <TableHead className="text-xs text-center">Access</TableHead>
                  <TableHead className="text-xs text-center">Usage Frequency</TableHead>
                  <TableHead className="text-xs text-center w-40">Utilisation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {digitalCatalogue.map((row) => (
                  <TableRow key={row.platform} className="text-xs">
                    <TableCell className="font-semibold text-blue-700">{row.platform}</TableCell>
                    <TableCell className="text-center font-bold text-gray-800">{row.resourcesAvailable}</TableCell>
                    <TableCell className="text-muted-foreground">{row.type}</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-100 text-green-700 border-0 text-xs">{row.access}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={row.usageFrequency} />
                    </TableCell>
                    <TableCell>
                      <Progress
                        value={
                          row.usageFrequency === "Daily" ? 95
                          : row.usageFrequency === "3x/Week" ? 75
                          : row.usageFrequency === "Weekly" ? 55
                          : row.usageFrequency === "Fortnightly" ? 35
                          : 20
                        }
                        className="h-1.5"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Section D & E: Side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Resource Request Tracker */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeading
              icon={ShoppingCart}
              title="Section D — Resource Request Tracker"
              description="5 pending procurement requests from department teachers"
              iconColor="text-orange-600"
            />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resourceRequests.map((req, i) => (
                <div key={i} className="p-3 rounded-lg border bg-gray-50 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-800 leading-tight">{req.item}</span>
                    <StatusBadge status={req.status} />
                  </div>
                  <div className="text-xs text-muted-foreground">{req.justification}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-600 font-medium">Requested by: {req.requestedBy}</span>
                    <span className="text-gray-500">Qty: {req.qty}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Usage Analytics */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeading
              icon={BarChart3}
              title="Section E — Resource Usage Analytics"
              description="Monthly checkout/usage log for top 5 physical & digital resources (Jan–Mar 2025)"
              iconColor="text-purple-600"
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs min-w-[160px]">Resource</TableHead>
                  <TableHead className="text-xs text-center">Jan</TableHead>
                  <TableHead className="text-xs text-center">Feb</TableHead>
                  <TableHead className="text-xs text-center">Mar</TableHead>
                  <TableHead className="text-xs text-center">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageAnalytics.map((row) => (
                  <TableRow key={row.resource} className="text-xs">
                    <TableCell className="font-medium">{row.resource}</TableCell>
                    <TableCell className="text-center">{row.jan}</TableCell>
                    <TableCell className="text-center">{row.feb}</TableCell>
                    <TableCell className="text-center font-semibold">{row.mar}</TableCell>
                    <TableCell className="text-center">
                      <TrendIcon trend={row.trend} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 p-2.5 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                  GeoGebra usage has grown 50% Jan–Mar. Consider requesting a premium school licence to unlock collaboration and assignment features for Class IX–X.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </Shell>
  )
}

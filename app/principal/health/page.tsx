import {
  Heart,
  Activity,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Stethoscope,
  Utensils,
  Shield,
  Brain,
  Eye,
  Ear,
  ArrowUpRight,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

// ── Mock Data — School Health Module (MoHFW + RBSK + PM POSHAN) ───────────────

const kpis = [
  { label: "Students Health-Screened", value: "1,186", sub: "95.0% of 1,248", icon: Stethoscope, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Health Issues Identified", value: "142", sub: "require follow-up", icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
  { label: "Mid-Day Meal Coverage", value: "100%", sub: "1,143 served today", icon: Utensils, color: "text-green-600", bg: "bg-green-50" },
  { label: "Wellness Ambassadors", value: "24", sub: "2 per class (trained)", icon: Heart, color: "text-pink-600", bg: "bg-pink-50" },
]

const rbskScreening = [
  { condition: "Vision Problems",          screened: 1186, identified: 84,  referred: 84,  resolved: "62 (spectacles provided)",  icon: Eye },
  { condition: "Hearing Issues",           screened: 1186, identified: 18,  referred: 18,  resolved: "14 (hearing aids)",         icon: Ear },
  { condition: "Dental Problems",          screened: 1186, identified: 210, referred: 210, resolved: "148",                       icon: Stethoscope },
  { condition: "Anaemia (Hb < 12 g/dL)",  screened: 1186, identified: 96,  referred: 96,  resolved: "88 (Iron-Folic Acid)",      icon: Activity },
  { condition: "Underweight (BMI < norm)", screened: 1186, identified: 142, referred: 142, resolved: "In Monitoring",             icon: Users },
  { condition: "Skin Conditions",          screened: 1186, identified: 28,  referred: 28,  resolved: "22",                       icon: Shield },
  { condition: "Mental Health Flags",      screened: 1186, identified: 14,  referred: 14,  resolved: "10 (counselling ongoing)",  icon: Brain },
]

const mdmMonthly = [
  { month: "Nov 2024", days: 22, avgServed: 1148, nutrition: 94, menu: 8 },
  { month: "Dec 2024", days: 20, avgServed: 1102, nutrition: 91, menu: 7 },
  { month: "Jan 2025", days: 26, avgServed: 1159, nutrition: 96, menu: 9 },
  { month: "Feb 2025", days: 22, avgServed: 1144, nutrition: 95, menu: 8 },
  { month: "Mar 2025", days: 25, avgServed: 1151, nutrition: 97, menu: 9 },
]

const immunisation = [
  { vaccine: "Td (Tetanus)", target: "Class X girls", covered: 231, total: 238, pct: 97.1, status: "Complete" },
  { vaccine: "HPV Vaccine", target: "Class VI girls", covered: 52,  total: 68,  pct: 76.5, status: "In Progress" },
  { vaccine: "Vitamin A", target: "Grade I–V", covered: 255, total: 261, pct: 97.7, status: "Complete" },
  { vaccine: "Deworming", target: "All students", covered: 1230, total: 1248, pct: 98.6, status: "Complete" },
  { vaccine: "COVID Booster", target: "Staff (42)", covered: 42, total: 42, pct: 100.0, status: "Complete" },
]

const adolescentProgramme = [
  { programme: "Adolescent Health Education Sessions (IX–XII)", done: 8, total: 12, pct: 67 },
  { programme: "Menstrual Health & Hygiene Training (girls)", done: 1, total: 1, pct: 100 },
  { programme: "Anti-Tobacco / Substance Awareness", done: 4, total: 6, pct: 67 },
  { programme: "POCSO Awareness Sessions", done: 2, total: 2, pct: 100 },
  { programme: "Mental Health & Counselling Modules", done: 3, total: 5, pct: 60 },
  { programme: "Yoga & Physical Wellness Sessions", done: 10, total: 12, pct: 83 },
]

const ambassadors = [
  { cls: "IX-A",   name: "Ananya Mishra",  gender: "F", trained: true, active: true },
  { cls: "IX-B",   name: "Rahul Verma",    gender: "M", trained: true, active: true },
  { cls: "X-A",    name: "Deepika Jain",   gender: "F", trained: true, active: true },
  { cls: "X-B",    name: "Arjun Kumar",    gender: "M", trained: true, active: true },
  { cls: "VIII-A", name: "Sunita Devi",    gender: "F", trained: true, active: true },
  { cls: "VIII-B", name: "Vikram Singh",   gender: "M", trained: true, active: true },
  { cls: "VII-A",  name: "Priya Sharma",   gender: "F", trained: true, active: true },
  { cls: "VII-B",  name: "Suresh Kumar",   gender: "M", trained: true, active: false },
]

const pendingActions = [
  { action: "Complete vision screening for 62 remaining students", deadline: "Apr 15", severity: "Medium" },
  { action: "HPV vaccination camp (16 girls pending)", deadline: "Apr 20", severity: "High" },
  { action: "Underweight monitoring review with health team", deadline: "Apr 10", severity: "High" },
  { action: "Mental health counselling follow-up (4 students)", deadline: "Apr 8", severity: "High" },
  { action: "Adolescent health session 9 (Classes XI–XII)", deadline: "Apr 22", severity: "Medium" },
  { action: "Annual school health report submission to DEO", deadline: "Apr 30", severity: "Medium" },
]

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Complete: "bg-green-100 text-green-700",
    "In Progress": "bg-blue-100 text-blue-700",
    "In Monitoring": "bg-yellow-100 text-yellow-700",
    High: "bg-red-100 text-red-700",
    Medium: "bg-yellow-100 text-yellow-700",
    Low: "bg-gray-100 text-gray-600",
  }
  return <Badge className={`${map[status] ?? "bg-gray-100 text-gray-600"} border-0 text-xs`}>{status}</Badge>
}

export default async function SchoolHealthPage() {
  return (
    <Shell>
      <PageHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 w-full">
          <div>
            <PageHeaderHeading>School Health &amp; Wellness</PageHeaderHeading>
            <PageHeaderDescription>
              RBSK Health Screening · Adolescent Health · Mid-Day Meal · School Health &amp; Wellness Programme (Ayushman Bharat)
            </PageHeaderDescription>
          </div>
          <PageHeaderActions>
            <Button variant="outline" size="sm"><ArrowUpRight className="h-4 w-4 mr-1" /> RBSK Report</Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
              <Stethoscope className="h-4 w-4 mr-1" /> Record Screening
            </Button>
          </PageHeaderActions>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${k.bg} mb-2`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
              <div className="text-xs font-medium text-gray-700 mt-0.5">{k.label}</div>
              <div className="text-xs text-muted-foreground">{k.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* RBSK Screening Results */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-blue-600" /> RBSK Health Screening Results
          </CardTitle>
          <CardDescription className="text-xs">
            Rashtriya Bal Swasthya Karyakram · 1,186 of 1,248 students screened (95.0%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Condition</TableHead>
                <TableHead className="text-xs text-center">Screened</TableHead>
                <TableHead className="text-xs text-center">Identified</TableHead>
                <TableHead className="text-xs text-center">Referred</TableHead>
                <TableHead className="text-xs">Treated / Resolved</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rbskScreening.map((r) => (
                <TableRow key={r.condition} className="text-xs">
                  <TableCell className="font-medium flex items-center gap-2">
                    <r.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />{r.condition}
                  </TableCell>
                  <TableCell className="text-center">{r.screened.toLocaleString()}</TableCell>
                  <TableCell className="text-center font-semibold text-orange-600">{r.identified}</TableCell>
                  <TableCell className="text-center">{r.referred}</TableCell>
                  <TableCell className={r.resolved.includes("Monitor") ? "text-yellow-700" : "text-green-700"}>{r.resolved}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mid-Day Meal + Immunisation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Utensils className="h-4 w-4 text-green-600" /> Mid-Day Meal — PM POSHAN
            </CardTitle>
            <CardDescription className="text-xs">
              Today: Rice · Dal · Mixed Vegetables · Chapati · Banana · 700 kcal — Compliant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Month</TableHead>
                  <TableHead className="text-xs text-center">Days</TableHead>
                  <TableHead className="text-xs text-center">Avg Served</TableHead>
                  <TableHead className="text-xs text-center">Nutrition%</TableHead>
                  <TableHead className="text-xs text-center">Menu Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mdmMonthly.map((m) => (
                  <TableRow key={m.month} className="text-xs">
                    <TableCell className="font-medium">{m.month}</TableCell>
                    <TableCell className="text-center">{m.days}</TableCell>
                    <TableCell className="text-center">{m.avgServed.toLocaleString()}</TableCell>
                    <TableCell className={`text-center font-semibold ${m.nutrition >= 95 ? "text-green-600" : "text-yellow-600"}`}>{m.nutrition}%</TableCell>
                    <TableCell className="text-center">{m.menu}/10</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-3 p-2.5 bg-green-50 border border-green-200 rounded text-xs text-green-800">
              Egg/Milk alternate provided on Wednesday &amp; Friday. Fortified rice used since Jan 2025.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" /> Immunisation Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {immunisation.map((imm) => (
              <div key={imm.vaccine} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-gray-800">{imm.vaccine}</span>
                    <span className="text-muted-foreground ml-2">({imm.target})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700">{imm.covered}/{imm.total}</span>
                    <StatusBadge status={imm.status} />
                  </div>
                </div>
                <Progress value={imm.pct} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Adolescent Health Programme */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-600" /> Adolescent Health Programme
          </CardTitle>
          <CardDescription className="text-xs">
            School Health &amp; Wellness Programme (Ayushman Bharat) · Classes IX–XII
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {adolescentProgramme.map((p) => (
              <div key={p.programme} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-gray-700 truncate max-w-[80%]">{p.programme}</span>
                  <span className={`font-bold shrink-0 ${p.pct === 100 ? "text-green-600" : p.pct >= 60 ? "text-blue-600" : "text-yellow-600"}`}>
                    {p.done}/{p.total} ({p.pct}%)
                  </span>
                </div>
                <Progress value={p.pct} className="h-1.5" />
              </div>
            ))}
          </div>
          <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
            38 student-initiated counselling sessions conducted this academic year. 4 students under active mental health follow-up.
          </div>
        </CardContent>
      </Card>

      {/* Wellness Ambassadors + Pending Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-600" /> Wellness Ambassadors
            </CardTitle>
            <CardDescription className="text-xs">2 per class · Trained by school health team</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Class</TableHead>
                  <TableHead className="text-xs">Ambassador</TableHead>
                  <TableHead className="text-xs text-center">Gender</TableHead>
                  <TableHead className="text-xs text-center">Trained</TableHead>
                  <TableHead className="text-xs text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ambassadors.map((a) => (
                  <TableRow key={`${a.cls}-${a.name}`} className="text-xs">
                    <TableCell className="font-medium">{a.cls}</TableCell>
                    <TableCell>{a.name}</TableCell>
                    <TableCell className="text-center">{a.gender}</TableCell>
                    <TableCell className="text-center">
                      {a.trained ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mx-auto" /> : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${a.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"} border-0 text-xs`}>
                        {a.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" /> Pending Health Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingActions.map((a, i) => (
              <div key={i} className={`flex items-start justify-between gap-2 p-2.5 rounded-lg border text-xs ${a.severity === "High" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}`}>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 leading-snug">{a.action}</p>
                  <p className="text-blue-600 font-semibold mt-0.5">Deadline: {a.deadline}</p>
                </div>
                <StatusBadge status={a.severity} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

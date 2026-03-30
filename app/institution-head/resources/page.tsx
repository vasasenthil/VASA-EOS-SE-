import {
  IndianRupee, Building2, Users, TrendingUp, CheckCircle2,
  AlertTriangle, Clock, BarChart3, Layers,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shell } from "@/components/shell"
import { PageHeader } from "@/components/page-header"

const kpiCards = [
  { label: "Total Budget FY 2025-26", value: "₹1,240 Cr", sub: "All Schemes + State", colour: "text-blue-600", icon: IndianRupee },
  { label: "Utilized (68.3%)", value: "₹847 Cr", sub: "As of November 2025", colour: "text-green-600", icon: TrendingUp },
  { label: "Infrastructure Fund", value: "₹280 Cr", sub: "CAPEX — Samagra Shiksha", colour: "text-purple-600", icon: Building2 },
  { label: "Salary & Emoluments", value: "₹620 Cr", sub: "Teaching + Non-teaching staff", colour: "text-orange-600", icon: Users },
]

const schemesBudget = [
  { scheme: "Samagra Shiksha", allocation: 680, utilised: 471, balance: 209, ucSubmitted: "Q1+Q2", tranche: "3rd Pending" },
  { scheme: "PM POSHAN (MDM)", allocation: 148, utilised: 134, balance: 14, ucSubmitted: "Q1+Q2", tranche: "Utilised" },
  { scheme: "PM SHRI Schools", allocation: 82, utilised: 44, balance: 38, ucSubmitted: "Q1 Only", tranche: "Q2 Due" },
  { scheme: "NIPUN Bharat", allocation: 38, utilised: 29, balance: 9, ucSubmitted: "Q1+Q2", tranche: "On Track" },
  { scheme: "KGBV (Girls Hostel)", allocation: 56, utilised: 41, balance: 15, ucSubmitted: "Q1+Q2", tranche: "On Track" },
  { scheme: "Pre-Matric Scholarship (SC/ST)", allocation: 34, utilised: 28, balance: 6, ucSubmitted: "Q1 Only", tranche: "Q2 Due" },
  { scheme: "IEDSS (Inclusive Ed)", allocation: 18, utilised: 12, balance: 6, ucSubmitted: "Q1+Q2", tranche: "On Track" },
  { scheme: "State Own Funds", allocation: 184, utilised: 88, balance: 96, ucSubmitted: "N/A", tranche: "H1 Released" },
]

const physicalResources = [
  { resource: "School Building (Pucca)", total: 248, available: 248, pct: 100 },
  { resource: "Electricity Connection", total: 248, available: 231, pct: 93.1 },
  { resource: "Drinking Water", total: 248, available: 239, pct: 96.4 },
  { resource: "Girls' Toilet (Functional)", total: 248, available: 248, pct: 100 },
  { resource: "Boys' Toilet (Functional)", total: 248, available: 241, pct: 97.2 },
  { resource: "Ramp / Barrier-free Access", total: 248, available: 186, pct: 75.0 },
  { resource: "Library / Reading Corner", total: 248, available: 219, pct: 88.3 },
  { resource: "Computer Lab", total: 248, available: 134, pct: 54.0 },
  { resource: "Smart Classroom", total: 248, available: 98, pct: 39.5 },
  { resource: "Playground", total: 248, available: 202, pct: 81.5 },
]

const humanResources = [
  { category: "PGT (Postgraduate Teacher)", sanctioned: 1240, actual: 1082, vacancy: 158 },
  { category: "TGT (Trained Graduate Teacher)", sanctioned: 2480, actual: 2093, vacancy: 387 },
  { category: "PRT (Primary Teacher)", sanctioned: 3720, actual: 3284, vacancy: 436 },
  { category: "Head Masters / Principals", sanctioned: 248, actual: 231, vacancy: 17 },
  { category: "School Counsellors", sanctioned: 124, actual: 47, vacancy: 77 },
  { category: "Special Educators (RPwD)", sanctioned: 248, actual: 89, vacancy: 159 },
]

const fundFlow = [
  { tranche: "1st Tranche (Samagra)", amount: "₹204 Cr", released: "2025-04-15", status: "Utilised" },
  { tranche: "2nd Tranche (Samagra)", amount: "₹204 Cr", released: "2025-08-10", status: "Partially Utilised" },
  { tranche: "3rd Tranche (Samagra)", amount: "₹272 Cr", released: "Pending UC Submission", status: "Blocked" },
  { tranche: "PM POSHAN Q3-Q4", amount: "₹74 Cr", released: "2025-11-01", status: "Released" },
  { tranche: "State Budget H2", amount: "₹92 Cr", released: "2025-10-31", status: "Released" },
]

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    Utilised: "bg-green-100 text-green-700 border-green-300",
    "Partially Utilised": "bg-blue-100 text-blue-700 border-blue-300",
    Released: "bg-teal-100 text-teal-700 border-teal-300",
    Blocked: "bg-red-100 text-red-700 border-red-300",
    "On Track": "bg-green-100 text-green-700 border-green-300",
    "Q1 Only": "bg-yellow-100 text-yellow-700 border-yellow-300",
    "Q1+Q2": "bg-green-100 text-green-700 border-green-300",
    "N/A": "bg-gray-100 text-gray-600",
    Pending: "bg-orange-100 text-orange-700 border-orange-300",
    "Q2 Due": "bg-orange-100 text-orange-700 border-orange-300",
    "3rd Pending": "bg-red-100 text-red-700 border-red-300",
    "H1 Released": "bg-teal-100 text-teal-700 border-teal-300",
  }
  return <Badge className={`${map[s] ?? "bg-gray-100 text-gray-700"} border text-xs`}>{s}</Badge>
}

export default function InstitutionHeadResourcesPage() {
  return (
    <Shell>
      <PageHeader
        title="Resource Management"
        description="Budget control, physical infrastructure, human resources and fund flow — Module 35.1"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-2xl font-bold ${k.colour}`}>{k.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{k.sub}</p>
                </div>
                <k.icon className={`h-5 w-5 ${k.colour}`} />
              </div>
              <p className="text-xs font-medium text-gray-600 mt-2">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scheme Budget Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><IndianRupee className="h-4 w-4 text-green-600" />Budget Utilisation by Scheme (₹ Crore)</CardTitle>
          <CardDescription>FY 2025-26 fund allocation, utilisation and UC submission status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scheme</TableHead>
                <TableHead className="text-right">Allocation</TableHead>
                <TableHead className="text-right">Utilised</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-center">Utilisation %</TableHead>
                <TableHead>UC Submitted</TableHead>
                <TableHead>Tranche Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schemesBudget.map((s) => {
                const pct = Math.round((s.utilised / s.allocation) * 100)
                return (
                  <TableRow key={s.scheme}>
                    <TableCell className="font-medium text-sm">{s.scheme}</TableCell>
                    <TableCell className="text-right text-sm">₹{s.allocation}Cr</TableCell>
                    <TableCell className="text-right text-sm text-green-700">₹{s.utilised}Cr</TableCell>
                    <TableCell className="text-right text-sm text-orange-700">₹{s.balance}Cr</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-1.5 flex-1" />
                        <span className="text-xs w-8 text-right">{pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge s={s.ucSubmitted} /></TableCell>
                    <TableCell><StatusBadge s={s.tranche} /></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Physical Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-blue-600" />Physical Resource Inventory</CardTitle>
            <CardDescription>School infrastructure across 248 schools (UDISE+ 2025)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {physicalResources.map((r) => (
                <div key={r.resource}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-700">{r.resource}</span>
                    <span className={r.pct < 60 ? "text-red-600 font-medium" : r.pct < 80 ? "text-yellow-600 font-medium" : "text-green-600 font-medium"}>
                      {r.available}/{r.total} ({r.pct}%)
                    </span>
                  </div>
                  <Progress value={r.pct} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Human Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-purple-600" />Human Resource Status</CardTitle>
            <CardDescription>Sanctioned vs actual vs vacancy by category</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Sanctioned</TableHead>
                  <TableHead className="text-center">In Position</TableHead>
                  <TableHead className="text-center">Vacancy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {humanResources.map((h) => (
                  <TableRow key={h.category}>
                    <TableCell className="text-sm">{h.category}</TableCell>
                    <TableCell className="text-center text-sm">{h.sanctioned.toLocaleString()}</TableCell>
                    <TableCell className="text-center text-sm text-green-700">{h.actual.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={`text-xs ${h.vacancy > 100 ? "bg-red-100 text-red-700 border-red-300" : h.vacancy > 30 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"} border`}>
                        {h.vacancy}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-gray-500 mt-3">Total Vacancy: 1,234 posts — Recruitment drive initiated for 800 posts (Nov 2025)</p>
          </CardContent>
        </Card>
      </div>

      {/* Fund Flow */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4 text-orange-600" />Fund Flow Status</CardTitle>
          <CardDescription>Tranche releases and utilisation certificate pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tranche</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Release / Expected Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fundFlow.map((f) => (
                <TableRow key={f.tranche}>
                  <TableCell className="font-medium text-sm">{f.tranche}</TableCell>
                  <TableCell className="text-sm font-medium text-green-700">{f.amount}</TableCell>
                  <TableCell className="text-sm text-gray-600">{f.released}</TableCell>
                  <TableCell><StatusBadge s={f.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>3rd Tranche of Samagra Shiksha (₹272 Cr) is blocked pending submission of Q2 Utilisation Certificates. Submit by December 15, 2025 to avoid fund lapse.</span>
          </div>
        </CardContent>
      </Card>
    </Shell>
  )
}

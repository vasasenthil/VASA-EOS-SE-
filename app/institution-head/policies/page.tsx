"use client"

import {
  FileText,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Building2,
  IndianRupee,
  Heart,
  CheckCircle2,
  Clock,
  XCircle,
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

// --- Module 15.1: Policy Management & Compliance Overview ---

const statCards = [
  {
    label: "Active Policies",
    value: "12",
    sub: "Across 4 categories",
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Avg Compliance",
    value: "87.4%",
    sub: "Weighted across all policies",
    icon: ShieldCheck,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    label: "Due for Review",
    value: "3",
    sub: "Within next 60 days",
    icon: AlertCircle,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    label: "Amendments (FY25)",
    value: "5",
    sub: "Policy changes this year",
    icon: RefreshCw,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
]

type PolicyStatus = "Compliant" | "Partial" | "Non-Compliant" | "Under Review"
type PolicyCategory = "Academic" | "Administrative" | "Financial" | "Social"
type PolicyAuthority = "National" | "State" | "District"

interface Policy {
  name: string
  category: PolicyCategory
  authority: PolicyAuthority
  effectiveDate: string
  reviewDate: string
  compliance: number
  status: PolicyStatus
}

const policies: Policy[] = [
  {
    name: "NEP 2020 Implementation Policy",
    category: "Academic",
    authority: "National",
    effectiveDate: "01 Apr 2021",
    reviewDate: "31 Mar 2026",
    compliance: 79,
    status: "Partial",
  },
  {
    name: "RTE Act Compliance Policy",
    category: "Academic",
    authority: "National",
    effectiveDate: "01 Apr 2010",
    reviewDate: "31 Mar 2025",
    compliance: 94,
    status: "Compliant",
  },
  {
    name: "RPwD Accommodation Policy",
    category: "Social",
    authority: "National",
    effectiveDate: "15 Jun 2017",
    reviewDate: "30 Jun 2025",
    compliance: 82,
    status: "Partial",
  },
  {
    name: "DPDP Data Governance Policy",
    category: "Administrative",
    authority: "National",
    effectiveDate: "01 Jan 2024",
    reviewDate: "31 Dec 2025",
    compliance: 68,
    status: "Under Review",
  },
  {
    name: "Teacher Transfer Policy",
    category: "Administrative",
    authority: "State",
    effectiveDate: "01 Apr 2022",
    reviewDate: "31 Mar 2026",
    compliance: 91,
    status: "Compliant",
  },
  {
    name: "Fee Regulation Policy",
    category: "Financial",
    authority: "State",
    effectiveDate: "01 Apr 2019",
    reviewDate: "31 Mar 2025",
    compliance: 88,
    status: "Compliant",
  },
  {
    name: "Admission Policy (No Detention)",
    category: "Academic",
    authority: "National",
    effectiveDate: "01 Jun 2023",
    reviewDate: "31 May 2026",
    compliance: 96,
    status: "Compliant",
  },
  {
    name: "Anti-Ragging Policy",
    category: "Social",
    authority: "National",
    effectiveDate: "15 Aug 2009",
    reviewDate: "14 Aug 2025",
    compliance: 99,
    status: "Compliant",
  },
  {
    name: "Scholarship Disbursement Policy",
    category: "Financial",
    authority: "State",
    effectiveDate: "01 Apr 2020",
    reviewDate: "31 Mar 2026",
    compliance: 84,
    status: "Partial",
  },
  {
    name: "POCSO Compliance Policy",
    category: "Social",
    authority: "National",
    effectiveDate: "01 Jan 2013",
    reviewDate: "31 Dec 2025",
    compliance: 97,
    status: "Compliant",
  },
  {
    name: "Reservation Policy (OBC/SC/ST)",
    category: "Social",
    authority: "National",
    effectiveDate: "01 Apr 1992",
    reviewDate: "31 Mar 2026",
    compliance: 93,
    status: "Compliant",
  },
  {
    name: "Digital Safety Policy",
    category: "Administrative",
    authority: "District",
    effectiveDate: "01 Sep 2023",
    reviewDate: "31 Aug 2025",
    compliance: 61,
    status: "Non-Compliant",
  },
]

const amendmentLog = [
  {
    date: "14 Mar 2025",
    policy: "Teacher Transfer Policy",
    change: "Added inter-district compassionate transfer clause",
    authority: "State",
    amendedBy: "Secretary, DoE Delhi",
  },
  {
    date: "22 Jan 2025",
    policy: "DPDP Data Governance Policy",
    change: "Updated data retention period from 5 to 7 years for student records",
    authority: "National",
    amendedBy: "MoE Data Cell",
  },
  {
    date: "08 Nov 2024",
    policy: "Scholarship Disbursement Policy",
    change: "Introduced direct DBT transfer mandate for all state scholarships",
    authority: "State",
    amendedBy: "Finance Secretary, GNCT Delhi",
  },
  {
    date: "01 Oct 2024",
    policy: "Admission Policy (No Detention)",
    change: "Extended no-detention provision to Grade 8 per NEP 2020 guidelines",
    authority: "National",
    amendedBy: "MoE (School Education Division)",
  },
  {
    date: "15 Jul 2024",
    policy: "Digital Safety Policy",
    change: "Added AI-generated content usage guidelines for school platforms",
    authority: "District",
    amendedBy: "DE (IT Cell), Delhi NCT",
  },
]

const categoryCompliance = [
  { category: "Academic", compliance: 89.7, count: 3, color: "bg-blue-500", textColor: "text-blue-700", bg: "bg-blue-50", icon: BookOpen },
  { category: "Administrative", compliance: 73.3, count: 3, color: "bg-purple-500", textColor: "text-purple-700", bg: "bg-purple-50", icon: Building2 },
  { category: "Financial", compliance: 86.0, count: 2, color: "bg-amber-500", textColor: "text-amber-700", bg: "bg-amber-50", icon: IndianRupee },
  { category: "Social", compliance: 92.7, count: 4, color: "bg-green-500", textColor: "text-green-700", bg: "bg-green-50", icon: Heart },
]

function StatusBadge({ status }: { status: PolicyStatus }) {
  const map: Record<PolicyStatus, string> = {
    Compliant: "bg-green-100 text-green-700",
    Partial: "bg-yellow-100 text-yellow-700",
    "Non-Compliant": "bg-red-100 text-red-700",
    "Under Review": "bg-blue-100 text-blue-700",
  }
  const iconMap: Record<PolicyStatus, React.ReactNode> = {
    Compliant: <CheckCircle2 className="h-3 w-3 mr-1" />,
    Partial: <Clock className="h-3 w-3 mr-1" />,
    "Non-Compliant": <XCircle className="h-3 w-3 mr-1" />,
    "Under Review": <RefreshCw className="h-3 w-3 mr-1" />,
  }
  return (
    <Badge className={`${map[status]} border-0 text-xs font-medium flex items-center w-fit`}>
      {iconMap[status]}{status}
    </Badge>
  )
}

function CategoryBadge({ cat }: { cat: PolicyCategory }) {
  const map: Record<PolicyCategory, string> = {
    Academic: "bg-blue-50 text-blue-700",
    Administrative: "bg-purple-50 text-purple-700",
    Financial: "bg-amber-50 text-amber-700",
    Social: "bg-green-50 text-green-700",
  }
  return <Badge className={`${map[cat]} border-0 text-xs`}>{cat}</Badge>
}

function AuthorityBadge({ auth }: { auth: PolicyAuthority }) {
  const map: Record<PolicyAuthority, string> = {
    National: "bg-indigo-50 text-indigo-700",
    State: "bg-teal-50 text-teal-700",
    District: "bg-orange-50 text-orange-700",
  }
  return <Badge className={`${map[auth]} border-0 text-xs`}>{auth}</Badge>
}

export default function PoliciesPage() {
  return (
    <Shell>
      <PageHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <PageHeaderHeading>Policy Management &amp; Compliance</PageHeaderHeading>
            <PageHeaderDescription>
              Module 15.1 &mdash; Policy Repository &amp; Implementation Status &mdash; Delhi NCT Directorate of Education
            </PageHeaderDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Sync Policies
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <FileText className="h-4 w-4 mr-1.5" />
              Add Policy
            </Button>
          </div>
        </div>
      </PageHeader>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${k.bg} mb-2`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
              <div className="text-xs font-semibold text-gray-700 mt-0.5">{k.label}</div>
              <div className="text-xs text-muted-foreground">{k.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Policies Table */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Active Policy Repository</CardTitle>
              <CardDescription className="text-xs">12 policies across Academic, Administrative, Financial and Social categories</CardDescription>
            </div>
            <Badge className="bg-blue-50 text-blue-700 border-0 text-xs">12 Active</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-600 pl-6">Policy Name</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Category</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Authority</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Effective Date</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Review Date</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center">Compliance %</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((p) => (
                  <TableRow key={p.name} className="text-sm hover:bg-gray-50">
                    <TableCell className="pl-6 font-medium text-gray-800 max-w-[240px] text-xs leading-tight">{p.name}</TableCell>
                    <TableCell><CategoryBadge cat={p.category} /></TableCell>
                    <TableCell><AuthorityBadge auth={p.authority} /></TableCell>
                    <TableCell className="text-xs text-gray-600">{p.effectiveDate}</TableCell>
                    <TableCell className="text-xs text-gray-600">{p.reviewDate}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-xs font-bold ${p.compliance >= 90 ? "text-green-700" : p.compliance >= 75 ? "text-amber-600" : "text-red-600"}`}>
                          {p.compliance}%
                        </span>
                        <Progress value={p.compliance} className="h-1.5 w-16" />
                      </div>
                    </TableCell>
                    <TableCell className="pr-6"><StatusBadge status={p.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Amendment Log */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Policy Amendments</CardTitle>
            <CardDescription className="text-xs">5 most recent policy changes — FY 2024–25 &amp; 2025–26</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {amendmentLog.map((a, i) => (
              <div key={i} className="flex gap-3 pb-3 border-b last:border-0 last:pb-0">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-gray-800 leading-tight">{a.policy}</p>
                    <AuthorityBadge auth={a.authority as PolicyAuthority} />
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 leading-snug">{a.change}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{a.date}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{a.amendedBy}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Compliance by Category */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Compliance by Category</CardTitle>
            <CardDescription className="text-xs">Weighted average compliance score per policy category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {categoryCompliance.map((c) => (
              <div key={c.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`inline-flex items-center justify-center w-7 h-7 rounded-md ${c.bg}`}>
                      <c.icon className={`h-4 w-4 ${c.textColor}`} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-800">{c.category}</span>
                      <p className="text-xs text-muted-foreground">{c.count} policies active</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${c.textColor}`}>{c.compliance}%</span>
                </div>
                <Progress value={c.compliance} className="h-2" />
              </div>
            ))}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Overall policy compliance: <span className="font-bold text-gray-800">87.4%</span> — Target: 95% by March 2026
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

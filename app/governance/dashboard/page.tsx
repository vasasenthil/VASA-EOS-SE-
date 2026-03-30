import Link from "next/link"
import {
  Building2,
  Users,
  ShieldCheck,
  Lock,
  Layers,
  PlusCircle,
  UserCog,
  ClipboardList,
  History,
  Network,
  Globe,
  MapPin,
  School,
  BookOpen,
  GraduationCap,
  Landmark,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  PageHeaderActions,
} from "@/components/page-header"

// ─── Mock Data ───────────────────────────────────────────────────────────────

const governanceTiers = [
  {
    tier: 1,
    label: "National",
    description: "MoE, NCERT, CBSE, NIOS, KVS, NVS, NCTE",
    institutions: "24",
    users: "1,842",
    activeRoles: 18,
    color: "bg-purple-50 border-purple-200",
    badgeColor: "bg-purple-100 text-purple-700",
    iconColor: "text-purple-600",
    Icon: Landmark,
  },
  {
    tier: 2,
    label: "State / UT",
    description: "36 State/UT Education Depts, SCERTs, State Boards",
    institutions: "108",
    users: "28,440",
    activeRoles: 12,
    color: "bg-blue-50 border-blue-200",
    badgeColor: "bg-blue-100 text-blue-700",
    iconColor: "text-blue-600",
    Icon: Globe,
  },
  {
    tier: 3,
    label: "District",
    description: "748 DEOs, 748 DIETs, District CPUs",
    institutions: "1,496",
    users: "3,74,200",
    activeRoles: 8,
    color: "bg-indigo-50 border-indigo-200",
    badgeColor: "bg-indigo-100 text-indigo-700",
    iconColor: "text-indigo-600",
    Icon: MapPin,
  },
  {
    tier: 4,
    label: "Block",
    description: "6,614 BEOs, 6,614 BRCs",
    institutions: "13,228",
    users: "1,32,280",
    activeRoles: 6,
    color: "bg-teal-50 border-teal-200",
    badgeColor: "bg-teal-100 text-teal-700",
    iconColor: "text-teal-600",
    Icon: Network,
  },
  {
    tier: 5,
    label: "Cluster",
    description: "1,29,000 CRCs",
    institutions: "1,29,000",
    users: "2,58,000",
    activeRoles: 4,
    color: "bg-cyan-50 border-cyan-200",
    badgeColor: "bg-cyan-100 text-cyan-700",
    iconColor: "text-cyan-600",
    Icon: Layers,
  },
  {
    tier: 6,
    label: "School",
    description: "15,00,000 schools",
    institutions: "15,00,000",
    users: "1,40,00,000",
    activeRoles: 14,
    color: "bg-green-50 border-green-200",
    badgeColor: "bg-green-100 text-green-700",
    iconColor: "text-green-600",
    Icon: School,
  },
  {
    tier: 7,
    label: "Learner",
    description: "25,00,00,000 students + parents",
    institutions: null,
    users: "50,00,00,000",
    activeRoles: 2,
    color: "bg-orange-50 border-orange-200",
    badgeColor: "bg-orange-100 text-orange-700",
    iconColor: "text-orange-600",
    Icon: GraduationCap,
  },
]

const rbacRoles = [
  {
    name: "Union Minister Education",
    code: "ROLE_UNION_MINISTER_EDUCATION",
    tier: "Tier 1",
    usersAssigned: "1",
    permissions: 42,
    status: "Active",
  },
  {
    name: "Secretary Education",
    code: "ROLE_SECRETARY_EDUCATION",
    tier: "Tier 1",
    usersAssigned: "3",
    permissions: 38,
    status: "Active",
  },
  {
    name: "NCERT Director",
    code: "ROLE_NCERT_DIRECTOR",
    tier: "Tier 1",
    usersAssigned: "1",
    permissions: 34,
    status: "Active",
  },
  {
    name: "CBSE Chairperson",
    code: "ROLE_CBSE_CHAIRPERSON",
    tier: "Tier 1",
    usersAssigned: "1",
    permissions: 36,
    status: "Active",
  },
  {
    name: "State Minister Education",
    code: "ROLE_STATE_MINISTER_EDUCATION",
    tier: "Tier 2",
    usersAssigned: "36",
    permissions: 28,
    status: "Active",
  },
  {
    name: "Principal Secretary (State)",
    code: "ROLE_PRINCIPAL_SECRETARY_STATE_EDUCATION",
    tier: "Tier 2",
    usersAssigned: "36",
    permissions: 32,
    status: "Active",
  },
  {
    name: "District Education Officer",
    code: "ROLE_DISTRICT_EDUCATION_OFFICER",
    tier: "Tier 3",
    usersAssigned: "748",
    permissions: 24,
    status: "Active",
  },
  {
    name: "Block Education Officer",
    code: "ROLE_BLOCK_RESOURCE_COORDINATOR",
    tier: "Tier 4",
    usersAssigned: "6,614",
    permissions: 18,
    status: "Active",
  },
  {
    name: "Principal",
    code: "ROLE_PRINCIPAL",
    tier: "Tier 6",
    usersAssigned: "15,00,000",
    permissions: 22,
    status: "Active",
  },
  {
    name: "Subject Teacher",
    code: "ROLE_SUBJECT_TEACHER",
    tier: "Tier 6",
    usersAssigned: "85,00,000",
    permissions: 14,
    status: "Active",
  },
  {
    name: "Student",
    code: "ROLE_STUDENT",
    tier: "Tier 7",
    usersAssigned: "25,00,00,000",
    permissions: 8,
    status: "Active",
  },
  {
    name: "Parent / Guardian",
    code: "ROLE_PARENT_GUARDIAN",
    tier: "Tier 7",
    usersAssigned: "25,00,00,000",
    permissions: 6,
    status: "Active",
  },
]

const permissionCategories = [
  {
    label: "Policy Management",
    permissions: 8,
    color: "text-purple-600",
    bg: "bg-purple-50",
    Icon: BookOpen,
  },
  {
    label: "User Management",
    permissions: 6,
    color: "text-blue-600",
    bg: "bg-blue-50",
    Icon: Users,
  },
  {
    label: "Dashboard Access",
    permissions: 12,
    color: "text-teal-600",
    bg: "bg-teal-50",
    Icon: Layers,
  },
  {
    label: "Assessment",
    permissions: 10,
    color: "text-green-600",
    bg: "bg-green-50",
    Icon: ClipboardList,
  },
  {
    label: "Financial",
    permissions: 8,
    color: "text-amber-600",
    bg: "bg-amber-50",
    Icon: Building2,
  },
  {
    label: "Compliance",
    permissions: 6,
    color: "text-rose-600",
    bg: "bg-rose-50",
    Icon: ShieldCheck,
  },
]

const ouSummary = [
  {
    type: "National Bodies",
    total: "24",
    active: "24",
    inactive: "0",
    dataQuality: 98,
    qualityColor: "text-green-700",
  },
  {
    type: "State Education Depts",
    total: "36",
    active: "36",
    inactive: "0",
    dataQuality: 94,
    qualityColor: "text-green-700",
  },
  {
    type: "District Offices",
    total: "748",
    active: "744",
    inactive: "4",
    dataQuality: 87,
    qualityColor: "text-teal-700",
  },
  {
    type: "Block Resource Centres",
    total: "6,614",
    active: "6,480",
    inactive: "134",
    dataQuality: 79,
    qualityColor: "text-yellow-700",
  },
  {
    type: "Cluster Resource Centres",
    total: "1,29,000",
    active: "1,24,200",
    inactive: "4,800",
    dataQuality: 72,
    qualityColor: "text-yellow-700",
  },
  {
    type: "Schools (UDISE+ verified)",
    total: "15,00,000",
    active: "14,22,000",
    inactive: "78,000",
    dataQuality: 68,
    qualityColor: "text-orange-700",
  },
]

const tierBadgeColors: Record<string, string> = {
  "Tier 1": "bg-purple-100 text-purple-700",
  "Tier 2": "bg-blue-100 text-blue-700",
  "Tier 3": "bg-indigo-100 text-indigo-700",
  "Tier 4": "bg-teal-100 text-teal-700",
  "Tier 5": "bg-cyan-100 text-cyan-700",
  "Tier 6": "bg-green-100 text-green-700",
  "Tier 7": "bg-orange-100 text-orange-700",
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function GovernanceDashboardPage() {
  return (
    <Shell>
      {/* Page Header */}
      <PageHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <PageHeaderHeading>Governance &amp; RBAC Overview</PageHeaderHeading>
            <PageHeaderDescription>
              7-Tier Institutional Hierarchy &middot; Role-Based Access Control &middot; Organisational Units
            </PageHeaderDescription>
          </div>
          <PageHeaderActions>
            <Button variant="outline" size="sm" asChild>
              <Link href="/governance/organizational-units">
                <Building2 className="h-4 w-4 mr-1.5" />
                Org Units
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/governance/roles">
                <Lock className="h-4 w-4 mr-1.5" />
                Roles
              </Link>
            </Button>
          </PageHeaderActions>
        </div>
      </PageHeader>

      {/* ── Section 1: Governance Tier Summary ── */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Governance Tier Summary</h2>
        <p className="text-sm text-muted-foreground mb-4">
          7-tier institutional hierarchy of the VASA-EOS governance framework
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {governanceTiers.map((t) => (
            <Card key={t.tier} className={`border ${t.color}`}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.badgeColor}`}>
                      <t.Icon className={`h-4 w-4 ${t.iconColor}`} />
                    </div>
                    <div>
                      <Badge className={`${t.badgeColor} border-0 text-[10px] font-semibold`}>
                        Tier {t.tier}
                      </Badge>
                      <CardTitle className="text-sm font-bold mt-0.5">{t.label}</CardTitle>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-xs mt-1 leading-snug">
                  {t.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {t.institutions !== null && (
                    <div>
                      <div className="text-sm font-bold text-gray-800">{t.institutions}</div>
                      <div className="text-[10px] text-muted-foreground">Institutions</div>
                    </div>
                  )}
                  <div className={t.institutions === null ? "col-span-2" : ""}>
                    <div className="text-sm font-bold text-gray-800">{t.users}</div>
                    <div className="text-[10px] text-muted-foreground">Users</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-800">{t.activeRoles}</div>
                    <div className="text-[10px] text-muted-foreground">Roles</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Section 2: RBAC Status ── */}
      <section className="mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Lock className="h-4 w-4 text-indigo-600" />
                  RBAC Status
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Role-Based Access Control — active role definitions across all tiers
                </CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                12 Roles Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold pl-6">Role Name</TableHead>
                    <TableHead className="text-xs font-semibold">Code</TableHead>
                    <TableHead className="text-xs font-semibold">Tier</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Users Assigned</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Permissions</TableHead>
                    <TableHead className="text-xs font-semibold pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rbacRoles.map((role) => (
                    <TableRow key={role.code} className="text-sm hover:bg-gray-50">
                      <TableCell className="pl-6 font-medium text-gray-800">{role.name}</TableCell>
                      <TableCell className="font-mono text-xs text-gray-500">{role.code}</TableCell>
                      <TableCell>
                        <Badge
                          className={`${tierBadgeColors[role.tier] ?? "bg-gray-100 text-gray-600"} border-0 text-xs`}
                        >
                          {role.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-700">
                        {role.usersAssigned}
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-700">
                        {role.permissions}
                      </TableCell>
                      <TableCell className="pr-6">
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                          {role.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Section 3: Permission Categories ── */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Permission Categories</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Logical groupings of system permissions — 50 permissions total across 6 categories
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {permissionCategories.map((cat) => (
            <Card key={cat.label} className="text-center">
              <CardContent className="pt-5 pb-4 px-3">
                <div
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${cat.bg} mb-3`}
                >
                  <cat.Icon className={`h-5 w-5 ${cat.color}`} />
                </div>
                <div className={`text-2xl font-bold ${cat.color}`}>{cat.permissions}</div>
                <div className="text-[11px] font-medium text-gray-600 mt-1 leading-tight">
                  {cat.label}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">permissions</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Section 4: Organisational Units Summary ── */}
      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Building2 className="h-4 w-4 text-teal-600" />
              Organisational Units Summary
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Active / inactive breakdown and data quality scores by OU type
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold pl-6">OU Type</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Total Count</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Active</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Inactive</TableHead>
                    <TableHead className="text-xs font-semibold pr-6">Data Quality Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ouSummary.map((ou) => (
                    <TableRow key={ou.type} className="text-sm hover:bg-gray-50">
                      <TableCell className="pl-6 font-medium text-gray-800">{ou.type}</TableCell>
                      <TableCell className="text-right text-gray-700">{ou.total}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-green-700 font-semibold">{ou.active}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            ou.inactive === "0"
                              ? "text-gray-400"
                              : "text-red-600 font-semibold"
                          }
                        >
                          {ou.inactive}
                        </span>
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden max-w-[80px]">
                            <div
                              className={`h-full rounded-full ${
                                ou.dataQuality >= 90
                                  ? "bg-green-500"
                                  : ou.dataQuality >= 75
                                  ? "bg-teal-500"
                                  : ou.dataQuality >= 65
                                  ? "bg-yellow-500"
                                  : "bg-orange-500"
                              }`}
                              style={{ width: `${ou.dataQuality}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold ${ou.qualityColor}`}>
                            {ou.dataQuality}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Quick Actions ── */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/governance/organizational-units/create">
              <PlusCircle className="h-4 w-4 mr-1.5" />
              Add Organizational Unit
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/governance/roles">
              <UserCog className="h-4 w-4 mr-1.5" />
              Create Role
            </Link>
          </Button>
          <Button variant="outline">
            <ShieldCheck className="h-4 w-4 mr-1.5" />
            Assign Permissions
          </Button>
          <Button variant="outline">
            <History className="h-4 w-4 mr-1.5" />
            Audit Log
          </Button>
        </div>
      </section>
    </Shell>
  )
}

import type React from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "./components/stat-card"
import { getTrackerDashboardData } from "./actions"
import {
  FileText,
  CheckCircle,
  Activity,
  Target,
  ListChecks,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  ListTodo,
  Users,
  UserSquare,
} from "lucide-react"
import { SeedDataButtons } from "./components/seed-data-buttons"
import { NepThrustChart } from "./components/nep-thrust-chart"
import { InteractiveMapIndia } from "./components/interactive-map-india"

const statusColors: { [key: string]: string } = {
  "In Progress": "bg-blue-100 text-blue-700",
  Implemented: "bg-green-100 text-green-700",
  "Fully Implemented": "bg-green-100 text-green-700",
  Planning: "bg-yellow-100 text-yellow-700",
  Delayed: "bg-red-100 text-red-700",
  "On Hold": "bg-orange-100 text-orange-700",
  "Partially Implemented": "bg-indigo-100 text-indigo-700",
  "Not Started": "bg-gray-100 text-gray-700",
  Cancelled: "bg-gray-200 text-gray-500",
}

const statIcons: { [key: string]: React.ElementType } = {
  "Total Policies Tracked": FileText,
  "Avg. Implementation Rate": CheckCircle,
  "Active Implementations": Activity,
  "States Covered": Target,
  "Open Challenges": ListTodo,
  "Critical/High Challenges": ShieldAlert,
  "Resolved Challenges": ShieldCheck,
  "Total Stakeholders Mapped": Users,
  "Unique Stakeholder Types": UserSquare,
}

export default async function PolicyTrackerDashboardPage() {
  const {
    stats = [],
    policyProgress = [],
    nepThrustAreaProgress = [],
    stateImplementationProgress = [],
    error,
  } = await getTrackerDashboardData()

  if (error) {
    return (
      <main className="container mx-auto p-4 md:p-8">
        <div className="text-center py-10 px-4 bg-red-50 border border-red-200 rounded-md">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-xl font-semibold text-red-800">Dashboard Error</h3>
          <p className="mt-2 text-md text-red-700">{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/policies">Policies</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Implementation Tracker</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Link href="/policies">
          <Button variant="outline" size="sm">
            <ListChecks className="mr-2 h-4 w-4" /> View All Policies
          </Button>
        </Link>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle as="h1" className="text-2xl font-semibold">
            Policy Implementation Tracker
          </CardTitle>
          <CardDescription>Overview of national education policy implementation progress.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <SeedDataButtons />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-6">
            {stats.map((stat) => (
              <StatCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                icon={statIcons[stat.title] || FileText}
                description={stat.description}
              />
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Implementation Hotspots</CardTitle>
                <CardDescription>Geographical overview of policy implementation.</CardDescription>
              </CardHeader>
              <CardContent className="min-h-[400px] flex items-center justify-center">
                <InteractiveMapIndia data={stateImplementationProgress} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Progress by NEP Thrust Area</CardTitle>
                <CardDescription>Average implementation progress per thrust area.</CardDescription>
              </CardHeader>
              <CardContent>
                <NepThrustChart data={nepThrustAreaProgress} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Policy Progress</CardTitle>
              <CardDescription>Status of individual policy implementation efforts.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Policy ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Progress</TableHead>
                      <TableHead className="text-center hidden md:table-cell">States Affected</TableHead>
                      <TableHead className="hidden sm:table-cell">Last Update</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policyProgress.length > 0 ? (
                      policyProgress.map((policy) => (
                        <TableRow key={policy.id}>
                          <TableCell className="font-mono text-xs">{policy.id.substring(0, 8)}...</TableCell>
                          <TableCell className="font-medium max-w-xs truncate">
                            <Link href={`/policies/view/${policy.id}`} className="hover:underline" title={policy.title}>
                              {policy.title}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${statusColors[policy.status] || "bg-gray-100 text-gray-700"} border`}
                            >
                              {policy.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <span className="mr-2 text-sm">{policy.progress}%</span>
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${policy.progress}%` }}></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center hidden md:table-cell">{policy.statesAffected}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {format(new Date(policy.lastUpdate), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            {policy.implementation_status_id ? (
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/tracking/implementations/${policy.implementation_status_id}`}>
                                  Details
                                </Link>
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled
                                title="No specific implementation record ID available"
                              >
                                Details
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center h-24">
                          No implementation data found. Try seeding data.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </main>
  )
}

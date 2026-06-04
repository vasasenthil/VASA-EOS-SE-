import type React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit, MapPin, Percent, CalendarCheck2, Info, AlertTriangle } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { getImplementationStatusByIdAction } from "../../dashboard/actions"
import { ChallengesSection } from "../../challenges/components/challenges-section"
import { StakeholdersSection } from "../../stakeholders/components/stakeholders-section"
import { MilestonesSection } from "../../milestones/components/milestones-section" // Import new component

interface ImplementationDetailPageProps {
  params: Promise<{
    id: string // This will be the implementation_status_id
  }>
}

const statusColors: { [key: string]: string } = {
  "In Progress": "bg-blue-100 text-blue-700 border-blue-300",
  "Fully Implemented": "bg-green-100 text-green-700 border-green-300",
  Planning: "bg-yellow-100 text-yellow-700 border-yellow-300",
  Delayed: "bg-red-100 text-red-700 border-red-300",
  "On Hold": "bg-orange-100 text-orange-700 border-orange-300",
  "Partially Implemented": "bg-indigo-100 text-indigo-700 border-indigo-300",
  "Not Started": "bg-gray-100 text-gray-700 border-gray-300",
  Cancelled: "bg-gray-200 text-gray-500 border-gray-400",
  default: "bg-gray-100 text-gray-700 border-gray-300",
}

const DetailItem: React.FC<{
  label: string
  value?: string | number | null
  icon?: React.ElementType
  children?: React.ReactNode
}> = ({ label, value, icon: Icon, children }) => (
  <div>
    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
      {Icon && <Icon className="w-3.5 h-3.5 mr-1.5" />}
      {label}
    </h4>
    {value !== undefined && value !== null && <p className="mt-0.5 text-sm text-gray-800">{value}</p>}
    {children && <div className="mt-0.5 text-sm text-gray-800">{children}</div>}
  </div>
)

export default async function ImplementationDetailPage({ params }: ImplementationDetailPageProps) {
  const { id: implementationStatusId } = await params
  const { implementationStatus, error } = await getImplementationStatusByIdAction(implementationStatusId)

  if (error && error === "Implementation status not found.") {
    notFound()
  }

  if (error || !implementationStatus) {
    return (
      <main className="container mx-auto p-4 md:p-8">
        <div className="text-center py-10 px-4 bg-red-50 border border-red-200 rounded-md">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-xl font-semibold text-red-800">Error Loading Implementation Details</h3>
          <p className="mt-2 text-md text-red-700">{error || "Could not load implementation details."}</p>
          <Button asChild className="mt-6">
            <Link href="/tracking/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto p-4 md:p-8 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/tracking/dashboard">Tracker Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Implementation Details</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <Badge
                variant="outline"
                className={`${statusColors[implementationStatus.overall_status || "default"] || statusColors.default} mb-2`}
              >
                {implementationStatus.overall_status}
              </Badge>
              <CardTitle as="h1" className="text-2xl font-semibold">
                {implementationStatus.policy_title || `Policy ID: ${implementationStatus.policy_id}`}
              </CardTitle>
              <CardDescription>
                Implementation in: {implementationStatus.region_name} ({implementationStatus.region_type})
                <br />
                Status ID: {implementationStatus.id.substring(0, 13)}...
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" disabled>
              {" "}
              {/* Edit functionality to be added later */}
              <Edit className="mr-2 h-4 w-4" /> Edit Implementation Status
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 pb-6 border-b">
            <DetailItem
              label="Region"
              value={`${implementationStatus.region_name} (${implementationStatus.region_type})`}
              icon={MapPin}
            />
            <DetailItem label="Progress" icon={Percent}>
              <div className="flex items-center">
                <span className="mr-2 text-sm">{implementationStatus.progress_percentage}%</span>
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${implementationStatus.progress_percentage}%` }}
                  ></div>
                </div>
              </div>
            </DetailItem>
            <DetailItem
              label="Target Completion"
              value={
                implementationStatus.target_completion_date
                  ? format(new Date(implementationStatus.target_completion_date), "dd MMM yyyy")
                  : "N/A"
              }
              icon={CalendarCheck2}
            />
            {implementationStatus.actual_completion_date && (
              <DetailItem
                label="Actual Completion"
                value={format(new Date(implementationStatus.actual_completion_date), "dd MMM yyyy")}
                icon={CalendarCheck2}
              />
            )}
            <DetailItem label="Last Updated By" value={implementationStatus.last_updated_by || "N/A"} icon={Info} />
            <DetailItem
              label="Last Update On"
              value={
                implementationStatus.updated_at
                  ? format(new Date(implementationStatus.updated_at), "dd MMM yyyy, HH:mm")
                  : "N/A"
              }
              icon={CalendarCheck2}
            />
          </div>
          {implementationStatus.summary_notes && (
            <div className="mb-6">
              <h4 className="text-md font-semibold mb-1">Summary Notes</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                {implementationStatus.summary_notes}
              </p>
            </div>
          )}
          {implementationStatus.key_indicators && Object.keys(implementationStatus.key_indicators).length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-semibold mb-1">Key Indicators</h4>
              <div className="bg-gray-50 p-3 rounded-md grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(implementationStatus.key_indicators).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium text-gray-600 capitalize">{key.replace(/_/g, " ")}: </span>
                    <span className="text-gray-800">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator className="my-8" />

          <MilestonesSection implementationStatusId={implementationStatus.id} />

          <Separator className="my-8" />

          <ChallengesSection implementationStatusId={implementationStatus.id} />

          <Separator className="my-8" />

          <StakeholdersSection implementationStatusId={implementationStatus.id} />
        </CardContent>
      </Card>
    </main>
  )
}

import { Tabs } from "@/components/ui/tabs"
import type React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Edit3, FileText, CheckCircle, Clock, Users, BookOpen, Target, Tag } from "lucide-react"
import { getPolicyByIdAction } from "../../create/actions"
import type { PolicyDraft } from "../../create/policy-form-constants"
import { format } from "date-fns"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface ViewPolicyPageProps {
  params: {
    id: string
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

const DetailItem: React.FC<{ label: string; value?: string | string[] | null; children?: React.ReactNode }> = ({
  label,
  value,
  children,
}) => (
  <div className="mb-4">
    <h4 className="text-sm font-medium text-gray-500">{label}</h4> {/* Changed from h3 to h4 */}
    {value && typeof value === "string" && <p className="mt-1 text-md text-gray-800 whitespace-pre-wrap">{value}</p>}
    {value && Array.isArray(value) && value.length > 0 && (
      <div className="mt-1 flex flex-wrap gap-2">
        {value.map((item, index) => (
          <Badge key={index} variant="secondary" className="text-sm">
            {item}
          </Badge>
        ))}
      </div>
    )}
    {children}
  </div>
)

export default async function ViewPolicyPage({ params }: ViewPolicyPageProps) {
  const policyId = params.id
  const policy = await getPolicyByIdAction(policyId)

  if (!policy) {
    notFound()
  }

  const getStatusIcon = (status?: PolicyDraft["status"]) => {
    switch (status) {
      case "Draft":
        return <Edit3 className="h-5 w-5 text-yellow-600 mr-2" />
      case "Pending Internal Review":
        return <Clock className="h-5 w-5 text-blue-600 mr-2" />
      case "Under Stakeholder Consultation":
        return <Users className="h-5 w-5 text-purple-600 mr-2" />
      case "Approved":
        return <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
      default:
        return <FileText className="h-5 w-5 text-gray-600 mr-2" />
    }
  }

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/policies">Policies</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{policy.title || `Policy ${policy.id}`}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button variant="default" asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href={`/policies/edit/${policy.id}`}>
            <Edit3 className="mr-2 h-4 w-4" /> Edit Policy
          </Link>
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <div className="flex items-center mb-2">
            {getStatusIcon(policy.status)}
            <Badge
              variant={policy.status === "Approved" ? "default" : "secondary"}
              className={
                policy.status === "Approved"
                  ? "bg-green-100 text-green-700 border-green-300"
                  : policy.status === "Pending Internal Review"
                    ? "bg-blue-100 text-blue-700 border-blue-300"
                    : policy.status === "Draft"
                      ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                      : "bg-purple-100 text-purple-700 border-purple-300"
              }
            >
              {policy.status || "N/A"}
            </Badge>
          </div>
          <CardTitle as="h1" className="text-3xl font-bold text-gray-800">
            {policy.title}
          </CardTitle>{" "}
          {/* Changed to h1 */}
          <CardDescription className="text-md text-gray-600">
            Policy ID: {policy.id} | Version: {policy.version}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="details">
            {" "}
            {/* Tabs component seems unused here, consider removing if not planned */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <DetailItem label="Policy Domain" value={policy.policyDomain} />
              <DetailItem label="Lead Drafter" value={policy.leadDrafter} />
            </div>
            <Separator className="my-6" />
            <section aria-labelledby="abstract-english-heading">
              <h2 id="abstract-english-heading" className="text-xl font-semibold text-gray-700 mb-2">
                Abstract (English)
              </h2>
              <DetailItem label="Summary">
                {" "}
                {/* Label changed for clarity as heading is now separate */}
                <p className="mt-1 text-md text-gray-800 bg-white p-3 rounded-md border border-gray-200 whitespace-pre-wrap">
                  {policy.abstractEN || "N/A"}
                </p>
              </DetailItem>
            </section>
            {policy.abstractHI && (
              <>
                <Separator className="my-6" />
                <section aria-labelledby="abstract-hindi-heading">
                  <h2 id="abstract-hindi-heading" className="text-xl font-semibold text-gray-700 mb-2">
                    Abstract (Hindi)
                  </h2>
                  <DetailItem label="सारांश">
                    {" "}
                    {/* Label changed for clarity */}
                    <p className="mt-1 text-md text-gray-800 bg-white p-3 rounded-md border border-gray-200 whitespace-pre-wrap">
                      {policy.abstractHI}
                    </p>
                  </DetailItem>
                </section>
              </>
            )}
            <Separator className="my-6" />
            <section aria-labelledby="tags-audience-heading">
              <h2 id="tags-audience-heading" className="text-xl font-semibold text-gray-700 mb-3">
                Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <DetailItem label="Keywords/Tags">
                  {policy.keywords && policy.keywords.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {policy.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          <Tag className="h-3 w-3" /> {keyword}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-md text-gray-500">No keywords provided.</p>
                  )}
                </DetailItem>

                <DetailItem label="Target Audience">
                  {policy.targetAudience && policy.targetAudience.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {policy.targetAudience.map((audience, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          <Target className="h-3 w-3" /> {audience}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-md text-gray-500">No target audience specified.</p>
                  )}
                </DetailItem>
              </div>
            </section>
            <Separator className="my-6" />
            <section aria-labelledby="nep-alignment-heading">
              <h2 id="nep-alignment-heading" className="text-xl font-semibold text-gray-700 mb-3 flex items-center">
                <BookOpen className="mr-2 h-5 w-5 text-blue-600" />
                NEP 2020 Alignment
              </h2>
              <DetailItem label="Relevant Thrust Areas">
                {policy.nepThrustAreas && policy.nepThrustAreas.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {policy.nepThrustAreas.map((area, index) => (
                      <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700">
                        {area}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-md text-gray-500">No NEP thrust areas selected.</p>
                )}
              </DetailItem>
              <DetailItem label="Alignment Justification">
                <p className="mt-1 text-md text-gray-800 bg-white p-3 rounded-md border border-gray-200 whitespace-pre-wrap">
                  {policy.nepAlignmentJustification || "N/A"}
                </p>
              </DetailItem>
            </section>
            <Separator className="my-6" />
            <section aria-labelledby="documents-heading">
              <h2 id="documents-heading" className="text-xl font-semibold text-gray-700 mb-3 flex items-center">
                <FileText className="mr-2 h-5 w-5 text-green-600" />
                Documents
              </h2>
              <DetailItem label="Draft Policy Document">
                {policy.draftPolicyDocument &&
                typeof policy.draftPolicyDocument === "object" &&
                "name" in policy.draftPolicyDocument ? (
                  <div className="mt-1 p-3 border rounded-md bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <span className="text-sm text-gray-700">{policy.draftPolicyDocument.name}</span>
                      <Badge variant="outline">{formatFileSize(policy.draftPolicyDocument.size)}</Badge>
                    </div>
                    <a
                      href="#" // TODO: Replace with actual download link/API endpoint
                      download={policy.draftPolicyDocument.name}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 py-2 text-primary underline-offset-4 hover:underline"
                      // This className mimics <Button variant="link" size="sm">
                      // In a real scenario, this might trigger a server action or link to a signed URL
                    >
                      Download Document
                    </a>
                  </div>
                ) : (
                  <p className="mt-1 text-md text-gray-500">No draft document uploaded.</p>
                )}
              </DetailItem>

              <DetailItem label="Annexures/References">
                {policy.annexures && Array.isArray(policy.annexures) && policy.annexures.length > 0 ? (
                  <div className="mt-1 space-y-2">
                    {policy.annexures.map((annex, index) => (
                      <div key={index} className="p-3 border rounded-md bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-gray-600" />
                          <span className="text-sm text-gray-700">{annex.name}</span>
                          <Badge variant="outline">{formatFileSize(annex.size)}</Badge>
                        </div>
                        <a
                          href="#" // TODO: Replace with actual download link/API endpoint for this annex
                          download={annex.name}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 py-2 text-primary underline-offset-4 hover:underline"
                          // This className mimics <Button variant="link" size="sm">
                        >
                          Download Annex
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-md text-gray-500">No annexures uploaded.</p>
                )}
              </DetailItem>
            </section>
            <Separator className="my-6" />
            <section aria-labelledby="consultation-review-heading">
              <h2
                id="consultation-review-heading"
                className="text-xl font-semibold text-gray-700 mb-3 flex items-center"
              >
                <Users className="mr-2 h-5 w-5 text-purple-600" />
                Consultation & Review
              </h2>
              <DetailItem label="Proposed Internal Review Committee">
                {policy.internalReviewCommittee && policy.internalReviewCommittee.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {policy.internalReviewCommittee.map((committee, index) => (
                      <Badge key={index} variant="secondary" className="bg-purple-50 text-purple-700">
                        {committee}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-md text-gray-500">No internal review committee specified.</p>
                )}
              </DetailItem>
            </section>
          </Tabs>
        </CardContent>
        <CardFooter className="border-t pt-6 text-sm text-gray-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div>
              <strong>Created:</strong>{" "}
              {policy.createdAt ? format(new Date(policy.createdAt), "dd MMM yyyy, HH:mm:ss") : "N/A"}
            </div>
            <div className="md:text-right">
              <strong>Last Modified:</strong>{" "}
              {policy.lastModified ? format(new Date(policy.lastModified), "dd MMM yyyy, HH:mm:ss") : "N/A"}
            </div>
          </div>
        </CardFooter>
      </Card>
    </main>
  )
}

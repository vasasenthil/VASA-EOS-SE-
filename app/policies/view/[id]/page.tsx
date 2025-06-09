"use client"

import { Tabs } from "@/components/ui/tabs"
import type React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Edit3, FileText, CheckCircle, Clock, Users, BookOpen, Target, Tag, ShieldCheck } from "lucide-react" // Added ShieldCheck
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
import { PolicyStatusUpdater } from "../../components/policy-status-updater" // Import the new component

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
    <h4 className="text-sm font-medium text-gray-500">{label}</h4>
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
      case "Archived":
        return <ShieldCheck className="h-5 w-5 text-gray-500 mr-2" />
      case "Rejected":
        return <FileText className="h-5 w-5 text-red-500 mr-2" /> // Example, choose appropriate
      default:
        return <FileText className="h-5 w-5 text-gray-600 mr-2" />
    }
  }

  const getStatusBadgeVariant = (status?: PolicyDraft["status"]) => {
    switch (status) {
      case "Draft":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "Pending Internal Review":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "Under Stakeholder Consultation":
        return "bg-purple-100 text-purple-700 border-purple-300"
      case "Approved":
        return "bg-green-100 text-green-700 border-green-300"
      case "Archived":
        return "bg-gray-100 text-gray-700 border-gray-300"
      case "Rejected":
        return "bg-red-100 text-red-700 border-red-300"
      default:
        return "bg-gray-100 text-gray-700 border-gray-300"
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
              className={getStatusBadgeVariant(policy.status)}
            >
              {policy.status || "N/A"}
            </Badge>
          </div>
          <CardTitle as="h1" className="text-3xl font-bold text-gray-800">
            {policy.title}
          </CardTitle>
          <CardDescription className="text-md text-gray-600">
            Policy ID: {policy.id} | Version: {policy.version}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PolicyStatusUpdater integrated here */}
          {policy.id && policy.status && <PolicyStatusUpdater policyId={policy.id} currentStatus={policy.status} />}
          <Separator className="my-6" />

          <Tabs defaultValue="details">
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
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Draft Policy Document</h4>
                  {policy.draftPolicyDocument &&
                  typeof policy.draftPolicyDocument === "object" &&
                  "name" in policy.draftPolicyDocument ? (
                    <Card className="bg-gray-50 p-3">
                      <CardContent className="p-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-6 w-6 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-800">{policy.draftPolicyDocument.name}</p>
                              <p className="text-xs text-gray-500">
                                Type: {policy.draftPolicyDocument.type || "N/A"} | Size:{" "}
                                {formatFileSize(policy.draftPolicyDocument.size)}
                              </p>
                            </div>
                          </div>
                          <Button variant="link" size="sm" asChild>
                            <a
                              href={policy.draftPolicyDocument.url || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={!policy.draftPolicyDocument.isPlaceholder}
                              title={`Download ${policy.draftPolicyDocument.name}${policy.draftPolicyDocument.isPlaceholder ? " (Simulated)" : ""}`}
                              aria-label={`Download ${policy.draftPolicyDocument.name}${policy.draftPolicyDocument.isPlaceholder ? " (Simulated)" : ""}`}
                              onClick={(e) => {
                                if (policy.draftPolicyDocument.isPlaceholder) e.preventDefault()
                              }}
                            >
                              Download
                            </a>
                          </Button>
                        </div>
                        {policy.draftPolicyDocument.isPlaceholder && (
                          <p className="mt-2 text-xs text-gray-400 italic">
                            Note: This is a simulated file. Actual download requires deployment and file storage
                            integration.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">No draft document uploaded.</p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Annexures/References</h4>
                  {policy.annexures && Array.isArray(policy.annexures) && policy.annexures.length > 0 ? (
                    <div className="space-y-3">
                      {policy.annexures.map((annex, index) => (
                        <Card key={index} className="bg-gray-50 p-3">
                          <CardContent className="p-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-6 w-6 text-blue-600" />
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{annex.name}</p>
                                  <p className="text-xs text-gray-500">
                                    Type: {annex.type || "N/A"} | Size: {formatFileSize(annex.size)}
                                  </p>
                                </div>
                              </div>
                              <Button variant="link" size="sm" asChild>
                                <a
                                  href={annex.url || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={!annex.isPlaceholder}
                                  title={`Download ${annex.name}${annex.isPlaceholder ? " (Simulated)" : ""}`}
                                  aria-label={`Download ${annex.name}${annex.isPlaceholder ? " (Simulated)" : ""}`}
                                  onClick={(e) => {
                                    if (annex.isPlaceholder) e.preventDefault()
                                  }}
                                >
                                  Download
                                </a>
                              </Button>
                            </div>
                            {annex.isPlaceholder && (
                              <p className="mt-1 text-xs text-gray-400 italic">Simulated file.</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                      {policy.annexures.some((a) => a.isPlaceholder) && (
                        <p className="mt-2 text-xs text-gray-400 italic">
                          Note: Actual file downloads require deployment and file storage integration.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">No annexures uploaded.</p>
                  )}
                </div>
              </div>
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

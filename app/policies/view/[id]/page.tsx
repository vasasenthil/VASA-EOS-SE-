// Ensure this file uses the correct import path for getPolicyByIdAction
"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Edit3,
  Download,
  FileText,
  AlertTriangle,
  Info,
  History,
  GitCommit,
  CalendarDays,
  Tags,
  Users,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Archive,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getPolicyByIdAction } from "@/app/policies/create/actions" // CORRECTED/VERIFIED IMPORT
import type { PolicyDraft, FileMetadata, PolicyStatus } from "@/app/policies/create/policy-form-constants"
import PolicyStatusUpdater from "@/app/policies/components/policy-status-updater"
import { format } from "date-fns"

// Helper to get status icon and color
const getStatusVisuals = (
  status?: PolicyStatus,
): { Icon: React.ElementType; color: string; badgeVariant: "default" | "secondary" | "destructive" | "outline" } => {
  switch (status) {
    case "Draft":
      return { Icon: Edit3, color: "text-blue-500", badgeVariant: "secondary" }
    case "Pending Internal Review":
      return { Icon: Clock, color: "text-yellow-500", badgeVariant: "outline" }
    case "Under Stakeholder Consultation":
      return { Icon: Users, color: "text-purple-500", badgeVariant: "outline" }
    case "Approved":
      return { Icon: CheckCircle2, color: "text-green-500", badgeVariant: "default" }
    case "Rejected":
      return { Icon: XCircle, color: "text-red-500", badgeVariant: "destructive" }
    case "Archived":
      return { Icon: Archive, color: "text-gray-500", badgeVariant: "secondary" }
    default:
      return { Icon: Info, color: "text-gray-400", badgeVariant: "secondary" }
  }
}

export default function ViewPolicyPage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === "string" ? params.id : ""
  const [policy, setPolicy] = useState<PolicyDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      const fetchPolicy = async () => {
        setLoading(true)
        setError(null)
        try {
          const fetchedPolicy = await getPolicyByIdAction(id)
          if (fetchedPolicy) {
            setPolicy(fetchedPolicy)
          } else {
            setError("Policy not found.")
          }
        } catch (e: any) {
          console.error("Error fetching policy:", e)
          setError(`Failed to load policy: ${e.message}`)
        } finally {
          setLoading(false)
        }
      }
      fetchPolicy()
    } else {
      setError("No policy ID provided.")
      setLoading(false)
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading policy details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <AlertTriangle className="mr-2 h-6 w-6" /> Error Loading Policy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={() => router.push("/policies")} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Policies
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!policy) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="mr-2 h-6 w-6" /> Policy Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested policy could not be found. It might have been deleted or the ID is incorrect.</p>
            <Button onClick={() => router.push("/policies")} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Policies
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { Icon: StatusIcon, color: statusColor, badgeVariant: statusBadgeVariant } = getStatusVisuals(policy.status)

  const renderFileLink = (file: FileMetadata | null, defaultName: string, type: "document" | "annexure") => {
    if (!file) return <span className="text-gray-500 italic">No {type} uploaded.</span>
    const downloadName = file.name || defaultName
    return (
      <div className="flex items-center space-x-2">
        <FileText className="h-5 w-5 text-gray-600" />
        <span className="font-medium">{file.name || "Untitled File"}</span>
        <span className="text-sm text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
        {file.url && (
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            download={!file.isPlaceholder ? downloadName : undefined} // Only add download attribute for actual files
            className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center"
            aria-label={`Download ${type} ${file.name || defaultName}`}
          >
            {file.isPlaceholder ? <Eye className="mr-1 h-4 w-4" /> : <Download className="mr-1 h-4 w-4" />}
            {file.isPlaceholder ? "View Simulated" : "Download"}
          </a>
        )}
      </div>
    )
  }

  const DetailItem: React.FC<{ label: string; icon: React.ElementType; children: React.ReactNode }> = ({
    label,
    icon: Icon,
    children,
  }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-600 flex items-center">
        <Icon className="mr-2 h-5 w-5 text-gray-400" />
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{children}</dd>
    </div>
  )

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-gray-100 border-b">
          <div className="flex justify-between items-start">
            <div>
              <Button variant="outline" size="sm" onClick={() => router.push("/policies")} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Policies List
              </Button>
              <CardTitle className="text-3xl font-bold text-gray-800">{policy.title}</CardTitle>
              <CardDescription className="text-md text-gray-600 mt-1">
                Version: {policy.version} &bull; Last Modified: {format(new Date(policy.lastModified), "PPP p")}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Badge variant={statusBadgeVariant} className={`px-3 py-1 text-sm ${statusColor}`}>
                <StatusIcon className="mr-2 h-4 w-4" />
                {policy.status}
              </Badge>
              <Link href={`/policies/edit/${policy.id}`} passHref>
                <Button variant="default" size="sm">
                  <Edit3 className="mr-2 h-4 w-4" /> Edit Policy
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <PolicyStatusUpdater policyId={policy.id} currentStatus={policy.status} />
          <Separator />

          <section aria-labelledby="policy-details-heading">
            <h2 id="policy-details-heading" className="text-xl font-semibold text-gray-700 mb-3">
              Policy Details
            </h2>
            <div className="divide-y divide-gray-200">
              <DetailItem label="Policy Domain" icon={BookOpen}>
                {policy.policyDomain}
              </DetailItem>
              <DetailItem label="Abstract (English)" icon={Info}>
                <p className="whitespace-pre-wrap">{policy.abstractEN}</p>
              </DetailItem>
              <DetailItem label="Abstract (Hindi)" icon={Info}>
                <p className="whitespace-pre-wrap">{policy.abstractHI || "N/A"}</p>
              </DetailItem>
              <DetailItem label="Keywords" icon={Tags}>
                {policy.keywords && policy.keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {policy.keywords.map((kw) => (
                      <Badge key={kw} variant="secondary">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  "N/A"
                )}
              </DetailItem>
              <DetailItem label="Target Audience" icon={Users}>
                {policy.targetAudience && policy.targetAudience.length > 0 ? policy.targetAudience.join(", ") : "N/A"}
              </DetailItem>
              <DetailItem label="Lead Drafter" icon={Edit3}>
                {policy.leadDrafter || "N/A"}
              </DetailItem>
              <DetailItem label="NEP Thrust Areas" icon={Tags}>
                {policy.nepThrustAreas && policy.nepThrustAreas.length > 0 ? policy.nepThrustAreas.join(", ") : "N/A"}
              </DetailItem>
              <DetailItem label="NEP Alignment Justification" icon={Info}>
                <p className="whitespace-pre-wrap">{policy.nepAlignmentJustification || "N/A"}</p>
              </DetailItem>
              <DetailItem label="Internal Review Committee" icon={Users}>
                {policy.internalReviewCommittee && policy.internalReviewCommittee.length > 0
                  ? policy.internalReviewCommittee.join(", ")
                  : "N/A"}
              </DetailItem>
              <DetailItem label="Created At" icon={CalendarDays}>
                {format(new Date(policy.createdAt), "PPP p")}
              </DetailItem>
            </div>
          </section>

          <Separator />

          <section aria-labelledby="policy-documents-heading">
            <h2 id="policy-documents-heading" className="text-xl font-semibold text-gray-700 mb-3">
              Documents
            </h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-md font-medium text-gray-600 mb-1">Draft Policy Document:</h3>
                {renderFileLink(policy.draftPolicyDocument, `policy_draft_${policy.id}.pdf`, "document")}
              </div>
              <div>
                <h3 className="text-md font-medium text-gray-600 mb-1">Annexures:</h3>
                {policy.annexures && policy.annexures.length > 0 ? (
                  <ul className="list-disc list-inside space-y-2 pl-1">
                    {policy.annexures.map((annex, idx) => (
                      <li key={idx}>{renderFileLink(annex, `annexure_${idx + 1}_${policy.id}`, "annexure")}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-500 italic">No annexures uploaded.</span>
                )}
              </div>
            </div>
          </section>

          {policy.versionHistory && policy.versionHistory.length > 0 && (
            <>
              <Separator />
              <section aria-labelledby="version-history-heading">
                <h2 id="version-history-heading" className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                  <History className="mr-2 h-6 w-6" /> Version History
                </h2>
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <ul className="divide-y divide-gray-200">
                    {policy.versionHistory.map((entry, index) => (
                      <li key={index} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <GitCommit className="h-5 w-5 text-blue-500 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                Version: {entry.version} - Status:{" "}
                                <Badge variant={getStatusVisuals(entry.status).badgeVariant} className="text-xs">
                                  {entry.status}
                                </Badge>
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {format(new Date(entry.modified_at), "MMM d, yyyy, h:mm a")}
                              </p>
                            </div>
                          </div>
                        </div>
                        {entry.summary && <p className="mt-2 text-xs text-gray-600 pl-8">{entry.summary}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

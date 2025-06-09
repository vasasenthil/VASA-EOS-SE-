import type React from "react"
import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getSchemeByIdAction } from "../actions"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Edit3,
  Landmark,
  Tag,
  CalendarDays,
  Users,
  Target,
  FileText,
  LinkIcon,
  Building,
  Layers,
  DollarSign,
} from "lucide-react"
import type { SchemeDocument, OrganizationalUnitSubtype, GovernanceTier } from "../types"
import SchemeDetailLoading from "./loading" // Import the loading component
import { hasPermission } from "@/app/governance/rbac" // Assuming RBAC setup
import { PERMISSIONS } from "@/app/governance/types" // Assuming PERMISSIONS are defined

interface SchemeDetailPageProps {
  params: {
    schemeId: string
  }
}

export default async function SchemeDetailPage({ params }: SchemeDetailPageProps) {
  const canEdit = await hasPermission(PERMISSIONS.MANAGE_SCHEMES) // Define this permission

  return (
    <Shell>
      <PageHeader>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/schemes">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Schemes</span>
            </Link>
          </Button>
          <div className="flex-1">{/* Heading will be loaded by Suspense component */}</div>
        </div>
        <PageHeaderActions>
          {canEdit && (
            <Button variant="outline" asChild>
              <Link href={`/schemes/edit/${params.schemeId}`}>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Scheme
              </Link>
            </Button>
          )}
        </PageHeaderActions>
      </PageHeader>

      <Suspense fallback={<SchemeDetailLoading />}>
        <SchemeDetails schemeId={params.schemeId} />
      </Suspense>
    </Shell>
  )
}

async function SchemeDetails({ schemeId }: { schemeId: string }) {
  const scheme = await getSchemeByIdAction(schemeId)

  if (!scheme) {
    notFound()
  }

  return (
    <>
      {/* Update PageHeader dynamically with scheme name */}
      <PageHeader className="mb-0 pb-0 -mt-8">
        {" "}
        {/* Adjust margins as needed */}
        <div className="flex-1 pt-2">
          {" "}
          {/* Added pt-2 to align with back button */}
          <PageHeaderHeading className="text-2xl">{scheme.name}</PageHeaderHeading>
          {scheme.scheme_code && <PageHeaderDescription>Scheme Code: {scheme.scheme_code}</PageHeaderDescription>}
        </div>
      </PageHeader>

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Scheme Overview</span>
              <Badge
                variant={
                  scheme.status === "Active" ? "default" : scheme.status === "Proposed" ? "outline" : "secondary"
                }
              >
                {scheme.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scheme.description && (
              <div>
                <h3 className="font-semibold text-sm mb-1">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{scheme.description}</p>
              </div>
            )}
            {scheme.objectives && (
              <div>
                <h3 className="font-semibold text-sm mb-1">Objectives</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{scheme.objectives}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {scheme.category && <InfoItem icon={<Tag />} label="Category" value={scheme.category.name} />}
              {scheme.issuing_authority_ou && (
                <InfoItem icon={<Landmark />} label="Issuing Authority" value={scheme.issuing_authority_ou.name} />
              )}
              {scheme.start_date && (
                <InfoItem
                  icon={<CalendarDays />}
                  label="Effective Dates"
                  value={`${new Date(scheme.start_date).toLocaleDateString()}${
                    scheme.end_date ? ` - ${new Date(scheme.end_date).toLocaleDateString()}` : " onwards"
                  }`}
                />
              )}
              {scheme.target_beneficiaries && (
                <InfoItem icon={<Users />} label="Target Beneficiaries" value={scheme.target_beneficiaries} />
              )}
              {scheme.eligibility_criteria && (
                <InfoItem icon={<Target />} label="Eligibility Criteria" value={scheme.eligibility_criteria} />
              )}
              {scheme.funding_pattern && (
                <InfoItem icon={<DollarSign />} label="Funding Pattern" value={scheme.funding_pattern} />
              )}
              {scheme.website_url && (
                <div className="flex items-start space-x-3">
                  <LinkIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Official Website</p>
                    <a
                      href={scheme.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {scheme.website_url}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {scheme.documents && scheme.documents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Official Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {scheme.documents.map((doc: SchemeDocument) => (
                  <li key={doc.id} className="text-sm">
                    <a
                      href={doc.file_path} // Assuming file_path is a direct URL or needs transformation
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      {doc.document_name || "Download Document"} ({doc.document_type || "File"})
                    </a>
                    {doc.description && <p className="text-xs text-muted-foreground ml-6">{doc.description}</p>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scheme.applicable_ou_subtypes && scheme.applicable_ou_subtypes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Applicable To (OU Subtypes)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {scheme.applicable_ou_subtypes.map((subtype: OrganizationalUnitSubtype) => (
                    <li key={subtype.id} className="text-sm flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      {subtype.name}
                      {subtype.governance_tier && (
                        <span className="text-xs text-muted-foreground">({subtype.governance_tier.name})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {scheme.target_governance_tiers && scheme.target_governance_tiers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Target Governance Tiers</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {scheme.target_governance_tiers.map((tier: GovernanceTier) => (
                    <li key={tier.id} className="text-sm flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      {tier.name}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

interface InfoItemProps {
  icon: React.ReactNode
  label: string
  value: string | null | undefined
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  if (!value) return null
  return (
    <div className="flex items-start space-x-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium whitespace-pre-wrap">{value}</p>
      </div>
    </div>
  )
}

import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  PlusCircle,
  Eye,
  Edit3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CalendarDays,
  AlertTriangle,
} from "lucide-react"
import { getPoliciesAction, clearPoliciesAction, type PaginatedPoliciesResponse } from "./create/actions"
import type { PolicyDraft } from "./create/policy-form-constants"
import { DeletePolicyButton } from "./components/delete-policy-button"
import { PolicyFilters } from "./components/policy-filters"
import { PolicyPagination } from "./components/policy-pagination"
import { HighlightedText } from "./components/highlighted-text"
import { safeDate } from "@/lib/format-date"
import { SeedDataButton } from "./components/seed-data-button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const DEFAULT_ITEMS_PER_PAGE_PAGE = 10

interface PoliciesListPageProps {
  searchParams?: Promise<{
    sortBy?: keyof PolicyDraft | "lastModified" | "createdAt"
    sortOrder?: "asc" | "desc"
    filterStatus?: PolicyDraft["status"]
    filterDomain?: string
    q?: string
    page?: string
    limit?: string
    modifiedAfter?: string
    modifiedBefore?: string
    createdAfter?: string
    createdBefore?: string
  }>
}

interface SortableHeaderProps {
  children: React.ReactNode
  columnKey: keyof PolicyDraft | "lastModified" | "createdAt"
  currentSortBy?: keyof PolicyDraft | "lastModified" | "createdAt"
  currentSortOrder?: "asc" | "desc"
  currentFiltersSearchAndDate: {
    filterStatus?: string
    filterDomain?: string
    q?: string
    limit?: string
    modifiedAfter?: string
    modifiedBefore?: string
    createdAfter?: string
    createdBefore?: string
  }
  baseUrl: string
  className?: string
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  children,
  columnKey,
  currentSortBy,
  currentSortOrder,
  currentFiltersSearchAndDate,
  baseUrl,
  className,
}) => {
  const isCurrentSortColumn = currentSortBy === columnKey
  const newSortOrder = isCurrentSortColumn && currentSortOrder === "asc" ? "desc" : "asc"
  const sortIcon = isCurrentSortColumn ? (
    currentSortOrder === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  ) : (
    <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
  )

  const params = new URLSearchParams()
  params.set("sortBy", columnKey)
  params.set("sortOrder", newSortOrder)

  if (currentFiltersSearchAndDate.filterStatus) params.set("filterStatus", currentFiltersSearchAndDate.filterStatus)
  if (currentFiltersSearchAndDate.filterDomain) params.set("filterDomain", currentFiltersSearchAndDate.filterDomain)
  if (currentFiltersSearchAndDate.q) params.set("q", currentFiltersSearchAndDate.q)
  if (currentFiltersSearchAndDate.limit) params.set("limit", currentFiltersSearchAndDate.limit)
  if (currentFiltersSearchAndDate.modifiedAfter) params.set("modifiedAfter", currentFiltersSearchAndDate.modifiedAfter)
  if (currentFiltersSearchAndDate.modifiedBefore)
    params.set("modifiedBefore", currentFiltersSearchAndDate.modifiedBefore)
  if (currentFiltersSearchAndDate.createdAfter) params.set("createdAfter", currentFiltersSearchAndDate.createdAfter)
  if (currentFiltersSearchAndDate.createdBefore) params.set("createdBefore", currentFiltersSearchAndDate.createdBefore)

  const href = `${baseUrl}?${params.toString()}`

  const ariaSortValue = isCurrentSortColumn ? (currentSortOrder === "asc" ? "ascending" : "descending") : "none"

  const linkAriaLabel = `Sort by ${typeof children === "string" ? children : columnKey} in ${newSortOrder === "asc" ? "ascending" : "descending"} order`

  return (
    <TableHead className={className} aria-sort={ariaSortValue}>
      <Link href={href} className="flex items-center hover:text-blue-600 transition-colors" aria-label={linkAriaLabel}>
        {children}
        {sortIcon}
      </Link>
    </TableHead>
  )
}

const statusStyles: Record<string, string> = {
  Draft: "bg-yellow-100 text-yellow-800 border-yellow-400",
  "Pending Internal Review": "bg-blue-100 text-blue-800 border-blue-400",
  "Under Stakeholder Consultation": "bg-purple-100 text-purple-800 border-purple-400",
  Approved: "bg-green-100 text-green-800 border-green-400",
  default: "bg-gray-100 text-gray-800 border-gray-400",
}

export default async function PoliciesListPage({ searchParams }: PoliciesListPageProps) {
  const sp = (await searchParams) ?? {}
  const sortBy = sp.sortBy
  const sortOrder = sp.sortOrder
  const filterStatus = sp.filterStatus
  const filterDomain = sp.filterDomain
  const searchQuery = sp.q || ""
  const currentPage = sp.page ? Number.parseInt(sp.page as string, 10) : 1
  const limit = sp.limit ? Number.parseInt(sp.limit as string, 10) : DEFAULT_ITEMS_PER_PAGE_PAGE
  const modifiedAfter = sp.modifiedAfter
  const modifiedBefore = sp.modifiedBefore
  const createdAfter = sp.createdAfter
  const createdBefore = sp.createdBefore

  const policiesResponse: PaginatedPoliciesResponse = await getPoliciesAction({
    sortBy,
    sortOrder,
    filterByStatus: filterStatus,
    filterByDomain: filterDomain,
    searchQuery: searchQuery,
    page: currentPage,
    itemsPerPage: limit,
    modifiedAfter: modifiedAfter,
    modifiedBefore: modifiedBefore,
    createdAfter: createdAfter,
    createdBefore: createdBefore,
  })

  const {
    policies,
    totalCount,
    totalPages,
    itemsPerPage: effectiveItemsPerPage,
    error: policiesError,
    demo: isDemo,
  } = policiesResponse

  const currentFiltersSearchAndDateForHeader = {
    filterStatus: filterStatus,
    filterDomain: filterDomain,
    q: searchQuery,
    limit: sp.limit,
    modifiedAfter: modifiedAfter,
    modifiedBefore: modifiedBefore,
    createdAfter: createdAfter,
    createdBefore: createdBefore,
  }

  return (
    <TooltipProvider>
      <main className="container mx-auto p-4 md:p-8">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle as="h1" className="text-2xl font-bold text-gray-800">
                National Education Policies
              </CardTitle>
              <CardDescription>
                Manage and review all national education policy drafts and approved documents.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-stretch sm:items-center">
              <SeedDataButton />
              <Link href="/policies/create" className="w-full sm:w-auto block">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                  <PlusCircle className="mr-2 h-5 w-5" /> Create New Policy
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isDemo ? (
              <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                Showing representative <strong>demo policies</strong> — no database is configured. Provision Supabase and
                seed to manage live policy drafts.
              </div>
            ) : null}
            <PolicyFilters />
            {policiesError ? (
              <div className="text-center py-10 px-4 bg-red-50 border border-red-200 rounded-md">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                <h3 className="mt-4 text-xl font-semibold text-red-800">Database Connection Failed</h3>
                <p className="mt-2 text-md text-red-700">
                  The application could not connect to the database due to a configuration issue.
                </p>
                <div className="mt-4 text-left bg-red-100 p-4 rounded-lg max-w-2xl mx-auto">
                  <p className="font-semibold text-gray-800">To fix this, please do the following:</p>
                  <ol className="list-decimal list-inside mt-2 text-sm text-gray-700 space-y-1">
                    <li>
                      Go to your <strong>Vercel Project Settings</strong>.
                    </li>
                    <li>
                      Navigate to the <strong>Environment Variables</strong> section.
                    </li>
                    <li>
                      Ensure the following variables are set correctly for all relevant environments:
                      <ul className="list-disc list-inside pl-6 mt-1 font-mono bg-white py-2 px-3 rounded">
                        <li>NEXT_PUBLIC_SUPABASE_URL</li>
                        <li>SUPABASE_SERVICE_ROLE_KEY</li>
                      </ul>
                    </li>
                    <li>Redeploy the project for the changes to take effect.</li>
                  </ol>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  Once configured, all database features like creating, viewing, and seeding policies will be enabled.
                </p>
              </div>
            ) : policies.length === 0 && totalCount === 0 ? (
              <div className="text-center py-10">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No policies found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  There are no policies created yet, or none match your current filters/search. Try seeding data.
                </p>
                {!filterStatus &&
                  !filterDomain &&
                  !searchQuery &&
                  !modifiedAfter &&
                  !modifiedBefore &&
                  !createdAfter &&
                  !createdBefore && (
                    <Button asChild className="mt-4">
                      <Link href="/policies/create">Create New Policy</Link>
                    </Button>
                  )}
              </div>
            ) : policies.length === 0 && totalCount > 0 ? (
              <div className="text-center py-10">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No policies on this page</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your filters/search or going to a different page.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <caption className="sr-only">
                      List of National Education Policies, including their ID, title, domain, status, version, creation
                      date, last modification date, and available actions. Policies can be sorted by title, domain,
                      status, creation date, and last modification date.
                    </caption>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px] hidden sm:table-cell">Policy ID</TableHead>
                        <SortableHeader
                          columnKey="title"
                          currentSortBy={sortBy}
                          currentSortOrder={sortOrder}
                          currentFiltersSearchAndDate={currentFiltersSearchAndDateForHeader}
                          baseUrl="/policies"
                        >
                          Title
                        </SortableHeader>
                        <SortableHeader
                          columnKey="policyDomain"
                          currentSortBy={sortBy}
                          currentSortOrder={sortOrder}
                          currentFiltersSearchAndDate={currentFiltersSearchAndDateForHeader}
                          baseUrl="/policies"
                          className="hidden lg:table-cell"
                        >
                          Domain
                        </SortableHeader>
                        <SortableHeader
                          columnKey="status"
                          currentSortBy={sortBy}
                          currentSortOrder={sortOrder}
                          currentFiltersSearchAndDate={currentFiltersSearchAndDateForHeader}
                          baseUrl="/policies"
                        >
                          Status
                        </SortableHeader>
                        <TableHead className="hidden md:table-cell">Version</TableHead>
                        <SortableHeader
                          columnKey="createdAt"
                          currentSortBy={sortBy}
                          currentSortOrder={sortOrder}
                          currentFiltersSearchAndDate={currentFiltersSearchAndDateForHeader}
                          baseUrl="/policies"
                          className="hidden lg:table-cell"
                        >
                          <div className="flex items-center">
                            <CalendarDays className="mr-1.5 h-4 w-4 text-gray-500" /> Created At
                          </div>
                        </SortableHeader>
                        <SortableHeader
                          columnKey="lastModified"
                          currentSortBy={sortBy}
                          currentSortOrder={sortOrder}
                          currentFiltersSearchAndDate={currentFiltersSearchAndDateForHeader}
                          baseUrl="/policies"
                          className="hidden md:table-cell"
                        >
                          <div className="flex items-center">
                            <CalendarDays className="mr-1.5 h-4 w-4 text-gray-500" /> Last Modified
                          </div>
                        </SortableHeader>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {policies.map((policy) => (
                        <TableRow key={policy.id}>
                          <TableCell className="font-medium hidden sm:table-cell">
                            <HighlightedText text={policy.id!} highlight={searchQuery} />
                          </TableCell>
                          <TableCell>
                            <HighlightedText text={policy.title} highlight={searchQuery} />
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <HighlightedText text={policy.policyDomain} highlight={searchQuery} />
                          </TableCell>
                          <TableCell>
                            <Badge className={statusStyles[policy.status || "default"] || statusStyles.default}>
                              {policy.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{policy.version}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {safeDate(policy.createdAt, "dd MMM yyyy, HH:mm")}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {safeDate(policy.lastModified, "dd MMM yyyy, HH:mm")}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" asChild>
                                  <Link href={`/policies/view/${policy.id}`} aria-label={`View policy ${policy.title}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Policy</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" asChild>
                                  <Link href={`/policies/edit/${policy.id}`} aria-label={`Edit policy ${policy.title}`}>
                                    <Edit3 className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit Policy</p>
                              </TooltipContent>
                            </Tooltip>
                            <DeletePolicyButton policyId={policy.id!} policyTitle={policy.title} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <PolicyPagination currentPage={currentPage} totalPages={totalPages} searchParams={sp} />
                  </div>
                )}
              </>
            )}
          </CardContent>
          <CardFooter className="text-sm text-gray-500 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-2 border-t pt-4">
            <span className="text-center sm:text-left">
              Showing {policies.length} of {totalCount} polic{totalCount === 1 ? "y" : "ies"}.
              {totalPages > 1 && ` Page ${currentPage} of ${totalPages}.`} (Displaying {effectiveItemsPerPage} per page)
            </span>
            <form action={async () => { await clearPoliciesAction() }} className="w-full sm:w-auto sm:ml-auto">
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-xs text-red-500 hover:bg-red-100 w-full sm:w-auto"
              >
                Clear All Policies (Dev)
              </Button>
            </form>
          </CardFooter>
        </Card>
      </main>
    </TooltipProvider>
  )
}

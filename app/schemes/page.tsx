import { Suspense } from "react"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { getSchemesAction, type GetSchemesParams } from "./actions"
import { SchemeListItem } from "./components/scheme-list-item"
import PaginationControls from "@/components/pagination-controls" // Assuming this component exists
import SchemesLoading from "./loading" // Import the loading component
import { SchemeFilters } from "./components/scheme-filters"

interface SchemesPageProps {
  searchParams: GetSchemesParams
}

export default async function SchemesPage({ searchParams }: SchemesPageProps) {
  // Basic permission check - can be enhanced in a layout or middleware
  // For now, assuming if they reach this page, they have basic view rights handled by actions.

  return (
    <Shell>
      <PageHeader>
        <div className="flex-1">
          <PageHeaderHeading>Government Schemes</PageHeaderHeading>
          <PageHeaderDescription>
            Browse and manage central and state government schemes for the education sector.
          </PageHeaderDescription>
        </div>
        <PageHeaderActions>
          <Link href="/schemes/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Scheme
            </Button>
          </Link>
        </PageHeaderActions>
      </PageHeader>

      <SchemeFilters />

      <Suspense fallback={<SchemesLoading />}>
        <SchemesList searchParams={searchParams} />
      </Suspense>
    </Shell>
  )
}

async function SchemesList({ searchParams }: { searchParams: GetSchemesParams }) {
  const { schemes, totalPages, currentPage, totalCount } = await getSchemesAction(searchParams)

  if (totalCount === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-semibold">No Schemes Found</h3>
        <p className="text-muted-foreground">
          There are currently no schemes matching your criteria. Try adjusting filters or add a new scheme.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {schemes.map((scheme) => (
          <SchemeListItem key={scheme.id} scheme={scheme} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-8">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            // basePath="/schemes" // Assuming PaginationControls can take a basePath
          />
        </div>
      )}
    </>
  )
}

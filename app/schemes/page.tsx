import { Suspense } from "react"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { PlusCircle, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { getSchemesAction } from "./actions"
import type { GetSchemesParams } from "./types"
import { SchemeListItem } from "./components/scheme-list-item"
import PaginationControls from "@/components/pagination-controls"
import SchemesLoading from "./loading"
import { SchemeFilters } from "./components/scheme-filters"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { constructSortUrl } from "@/lib/utils" // Assuming a utility function

interface SchemesPageProps {
  searchParams: Promise<GetSchemesParams>
}

export default async function SchemesPage({ searchParams }: SchemesPageProps) {
  const sp = await searchParams
  const currentSortBy = sp.sortBy || "created_at"
  const currentSortDirection = sp.sortDirection || "desc"

  const sortOptions = [
    { label: "Creation Date", value: "created_at" },
    { label: "Scheme Name", value: "name" },
    { label: "Start Date", value: "start_date" },
  ]

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

      <div className="flex justify-end mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Sort by: {sortOptions.find((o) => o.value === currentSortBy)?.label}{" "}
              {currentSortDirection === "asc" ? "(Asc)" : "(Desc)"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort Schemes By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {sortOptions.map((option) => (
              <div key={option.value}>
                <DropdownMenuItem asChild>
                  <Link href={constructSortUrl(sp, option.value, "desc")}>{option.label} (Desc)</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={constructSortUrl(sp, option.value, "asc")}>{option.label} (Asc)</Link>
                </DropdownMenuItem>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Suspense fallback={<SchemesLoading />}>
        <SchemesList searchParams={sp} />
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
          <PaginationControls currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} />
        </div>
      )}
    </>
  )
}

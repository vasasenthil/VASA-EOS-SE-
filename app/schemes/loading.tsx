import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Shell } from "@/components/shell"

export default function SchemesLoading() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Government Schemes</PageHeaderHeading>
        <PageHeaderDescription>
          Browse and manage central and state government schemes for the education sector.
        </PageHeaderDescription>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
            <div className="space-y-1 pt-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-5 w-1/3 mt-2" />
          </div>
        ))}
      </div>
    </Shell>
  )
}

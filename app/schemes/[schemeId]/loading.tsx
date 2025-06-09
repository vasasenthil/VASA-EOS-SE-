import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderActions } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ArrowLeft, Edit3 } from "lucide-react"

export default function SchemeDetailLoading() {
  return (
    <Shell>
      <PageHeader>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </div>
        </div>
        <PageHeaderActions>
          <Button variant="outline" disabled>
            <Edit3 className="mr-2 h-4 w-4" />
            Edit Scheme
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-6 w-20" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Skeleton className="h-4 w-1/4 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-1/4 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="w-full">
                    <Skeleton className="h-3 w-1/3 mb-1" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>{" "}
                  {/* Stray backslash removed from here */}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2 mt-1 ml-6" />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-1">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-5 w-3/4" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-1">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-5 w-3/4" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  )
}

"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"

interface DashboardFiltersProps {
  distinctStatuses: string[]
  distinctRegionTypes: string[]
  currentFilters: {
    status?: string
    regionType?: string
  }
}

export function DashboardFilters({ distinctStatuses, distinctRegionTypes, currentFilters }: DashboardFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleFilterChange = (filterName: string, value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()))

    if (value && value !== "all") {
      current.set(filterName, value)
    } else {
      current.delete(filterName)
    }

    const search = current.toString()
    const query = search ? `?${search}` : ""
    router.push(`${pathname}${query}`)
  }

  const handleResetFilters = () => {
    router.push(pathname)
  }

  const hasActiveFilters = !!currentFilters.status || !!currentFilters.regionType

  return (
    <div className="p-4 border rounded-lg bg-gray-50/50 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-auto">
          <Select value={currentFilters.status || "all"} onValueChange={(value) => handleFilterChange("status", value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {distinctStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-auto">
          <Select
            value={currentFilters.regionType || "all"}
            onValueChange={(value) => handleFilterChange("regionType", value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by Region Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Region Types</SelectItem>
              {distinctRegionTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={handleResetFilters} className="w-full sm:w-auto">
            <RotateCcw className="mr-2 h-4 w-4" /> Reset Filters
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Note: Challenge and Stakeholder statistics are currently not affected by these filters.
      </p>
    </div>
  )
}

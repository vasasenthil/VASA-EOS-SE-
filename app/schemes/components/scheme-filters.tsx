"use client"
import { useEffect, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getSchemeCategoriesAction } from "../actions" // Assuming this action exists
import type { SchemeCategory, Scheme } from "../types"
import { XCircle, ChevronDown } from "lucide-react"

const schemeStatuses: Scheme["status"][] = ["Active", "Proposed", "Completed", "Discontinued", "Archived"]

export function SchemeFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Component state for filter inputs
  const [query, setQuery] = useState(searchParams.get("query") || "")
  const [selectedCategories, setSelectedCategories] = useState<string[]>(searchParams.getAll("categoryIds") || [])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(searchParams.getAll("status") || [])

  // Data for filters
  const [categories, setCategories] = useState<SchemeCategory[]>([])

  useEffect(() => {
    async function fetchFilterData() {
      const fetchedCategories = await getSchemeCategoriesAction()
      setCategories(fetchedCategories)
    }
    fetchFilterData()
  }, [])

  // Update URL search params when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (query) {
      params.set("query", query)
    } else {
      params.delete("query")
    }

    params.delete("categoryIds") // Clear existing before setting new ones
    selectedCategories.forEach((catId) => params.append("categoryIds", catId))

    params.delete("status") // Clear existing before setting new ones
    selectedStatuses.forEach((stat) => params.append("status", stat))

    params.set("page", "1") // Reset to first page on filter change

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }, [query, selectedCategories, selectedStatuses, pathname, router, searchParams])

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setSelectedCategories((prev) => (checked ? [...prev, categoryId] : prev.filter((id) => id !== categoryId)))
  }

  const handleStatusChange = (statusValue: string, checked: boolean) => {
    setSelectedStatuses((prev) => (checked ? [...prev, statusValue] : prev.filter((val) => val !== statusValue)))
  }

  const clearFilters = () => {
    setQuery("")
    setSelectedCategories([])
    setSelectedStatuses([])
    // The useEffect will handle updating the URL
  }

  const hasActiveFilters = query || selectedCategories.length > 0 || selectedStatuses.length > 0

  return (
    <div className="mb-6 p-4 border rounded-lg bg-background shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="lg:col-span-2">
          <label htmlFor="search-query" className="block text-sm font-medium text-muted-foreground mb-1">
            Search Schemes
          </label>
          <Input
            id="search-query"
            placeholder="Search by name, code, description..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Category</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {selectedCategories.length > 0 ? `${selectedCategories.length} selected` : "Select Categories"}
                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
              <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {categories.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category.id}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={(checked) => handleCategoryChange(category.id, Boolean(checked))}
                >
                  {category.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {selectedStatuses.length > 0 ? `${selectedStatuses.length} selected` : "Select Statuses"}
                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {schemeStatuses.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={selectedStatuses.includes(status)}
                  onCheckedChange={(checked) => handleStatusChange(status, Boolean(checked))}
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {hasActiveFilters && (
          <div className="lg:col-start-4 flex justify-end">
            <Button variant="ghost" onClick={clearFilters} disabled={isPending}>
              <XCircle className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

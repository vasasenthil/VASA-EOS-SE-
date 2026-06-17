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
import { getSchemeCategoriesAction, getIssuingAuthoritiesAction } from "../actions" // Add getIssuingAuthoritiesAction
import type { SchemeCategory, Scheme } from "../types"
import type { OrganizationalUnit } from "@/app/governance/types"
import { XCircle, ChevronDown } from "lucide-react"

const schemeStatuses: Scheme["status"][] = ["Active", "Proposed", "Completed", "Discontinued", "Archived", "Inactive"]

export function SchemeFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Component state for filter inputs
  const [query, setQuery] = useState(searchParams.get("query") || "")
  const [selectedCategories, setSelectedCategories] = useState<string[]>(searchParams.getAll("categoryIds") || [])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(searchParams.getAll("status") || [])
  const [selectedAuthorities, setSelectedAuthorities] = useState<string[]>(
    searchParams.getAll("issuingAuthorityOuIds") || [],
  ) // New state

  // Data for filters
  const [categories, setCategories] = useState<SchemeCategory[]>([])
  const [authorities, setAuthorities] = useState<OrganizationalUnit[]>([]) // New state

  useEffect(() => {
    async function fetchFilterData() {
      try {
        const [fetchedCategories, fetchedAuthorities] = await Promise.all([
          getSchemeCategoriesAction(),
          getIssuingAuthoritiesAction(), // Fetch authorities
        ])
        setCategories(Array.isArray(fetchedCategories) ? fetchedCategories : [])
        setAuthorities(Array.isArray(fetchedAuthorities) ? fetchedAuthorities : [])
      } catch {
        // Never let a filter-data fetch crash the page; keep empty option lists.
        setCategories([])
        setAuthorities([])
      }
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

    params.delete("categoryIds")
    selectedCategories.forEach((catId) => params.append("categoryIds", catId))

    params.delete("status")
    selectedStatuses.forEach((stat) => params.append("status", stat))

    params.delete("issuingAuthorityOuIds") // New
    selectedAuthorities.forEach((authId) => params.append("issuingAuthorityOuIds", authId)) // New

    params.set("page", "1")

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }, [query, selectedCategories, selectedStatuses, selectedAuthorities, pathname, router, searchParams]) // Add selectedAuthorities

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setSelectedCategories((prev) => (checked ? [...prev, categoryId] : prev.filter((id) => id !== categoryId)))
  }

  const handleStatusChange = (statusValue: string, checked: boolean) => {
    setSelectedStatuses((prev) => (checked ? [...prev, statusValue] : prev.filter((val) => val !== statusValue)))
  }

  const handleAuthorityChange = (authorityId: string, checked: boolean) => {
    // New handler
    setSelectedAuthorities((prev) => (checked ? [...prev, authorityId] : prev.filter((id) => id !== authorityId)))
  }

  const clearFilters = () => {
    setQuery("")
    setSelectedCategories([])
    setSelectedStatuses([])
    setSelectedAuthorities([]) // New
  }

  const hasActiveFilters =
    query || selectedCategories.length > 0 || selectedStatuses.length > 0 || selectedAuthorities.length > 0 // New

  return (
    <div className="mb-6 p-4 border rounded-lg bg-background shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="lg:col-span-4">
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
          <label className="block text-sm font-medium text-muted-foreground mb-1">Issuing Authority</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {selectedAuthorities.length > 0 ? `${selectedAuthorities.length} selected` : "Select Authorities"}
                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
              <DropdownMenuLabel>Filter by Authority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {authorities.map((authority) => (
                <DropdownMenuCheckboxItem
                  key={authority.id}
                  checked={selectedAuthorities.includes(authority.id)}
                  onCheckedChange={(checked) => handleAuthorityChange(authority.id, Boolean(checked))}
                >
                  {authority.name}
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
          <div className="flex justify-end">
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

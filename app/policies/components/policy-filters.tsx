"use client"

import type React from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { POLICY_DOMAINS, type PolicyDraft } from "../create/policy-form-constants"
import { FilterX, Search, ChevronDown, XCircle, Check } from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"
import { DatePickerPopover } from "./date-picker-popover"
import {
  subDays,
  startOfDay,
  endOfDay,
  format as formatDateFns,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip" // Added Tooltip components

const POLICY_STATUSES: PolicyDraft["status"][] = [
  "Draft",
  "Pending Internal Review",
  "Under Stakeholder Consultation",
  "Approved",
]
const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100]
const DEFAULT_ITEMS_PER_PAGE = 10
const DEBOUNCE_DELAY = 500 // milliseconds

interface DatePreset {
  label: string
  getRange: () => { start: string; end: string }
}

const commonDatePresets: DatePreset[] = [
  {
    label: "Today",
    getRange: () => {
      const today = new Date()
      return {
        start: formatDateFns(startOfDay(today), "yyyy-MM-dd"),
        end: formatDateFns(endOfDay(today), "yyyy-MM-dd"),
      }
    },
  },
  {
    label: "Yesterday",
    getRange: () => {
      const yesterday = subDays(new Date(), 1)
      return {
        start: formatDateFns(startOfDay(yesterday), "yyyy-MM-dd"),
        end: formatDateFns(endOfDay(yesterday), "yyyy-MM-dd"),
      }
    },
  },
  {
    label: "This Week",
    getRange: () => {
      const today = new Date()
      return {
        start: formatDateFns(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        end: formatDateFns(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      }
    },
  },
  {
    label: "Last 7 Days",
    getRange: () => {
      const today = new Date()
      return {
        start: formatDateFns(startOfDay(subDays(today, 6)), "yyyy-MM-dd"),
        end: formatDateFns(endOfDay(today), "yyyy-MM-dd"),
      }
    },
  },
  {
    label: "Last Week",
    getRange: () => {
      const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })
      const lastWeekEnd = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })
      return {
        start: formatDateFns(lastWeekStart, "yyyy-MM-dd"),
        end: formatDateFns(lastWeekEnd, "yyyy-MM-dd"),
      }
    },
  },
  {
    label: "This Month",
    getRange: () => {
      const today = new Date()
      return {
        start: formatDateFns(startOfMonth(today), "yyyy-MM-dd"),
        end: formatDateFns(endOfMonth(today), "yyyy-MM-dd"),
      }
    },
  },
  {
    label: "Last 30 Days",
    getRange: () => {
      const today = new Date()
      return {
        start: formatDateFns(startOfDay(subDays(today, 29)), "yyyy-MM-dd"),
        end: formatDateFns(endOfDay(today), "yyyy-MM-dd"),
      }
    },
  },
  {
    label: "Last Month",
    getRange: () => {
      const lastMonthStart = startOfMonth(subMonths(new Date(), 1))
      const lastMonthEnd = endOfMonth(subMonths(new Date(), 1))
      return {
        start: formatDateFns(lastMonthStart, "yyyy-MM-dd"),
        end: formatDateFns(lastMonthEnd, "yyyy-MM-dd"),
      }
    },
  },
]

export function PolicyFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentStatus = searchParams.get("filterStatus") || ""
  const currentDomain = searchParams.get("filterDomain") || ""
  const currentSearchQuery = searchParams.get("q") || ""
  const currentLimit = searchParams.get("limit")
    ? Number.parseInt(searchParams.get("limit")!, 10)
    : DEFAULT_ITEMS_PER_PAGE

  const [modifiedAfter, setModifiedAfter] = useState(searchParams.get("modifiedAfter") || undefined)
  const [modifiedBefore, setModifiedBefore] = useState(searchParams.get("modifiedBefore") || undefined)
  const [createdAfter, setCreatedAfter] = useState(searchParams.get("createdAfter") || undefined)
  const [createdBefore, setCreatedBefore] = useState(searchParams.get("createdBefore") || undefined)

  const [searchInputValue, setSearchInputValue] = useState(currentSearchQuery)

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setSearchInputValue(currentSearchQuery)
    setModifiedAfter(searchParams.get("modifiedAfter") || undefined)
    setModifiedBefore(searchParams.get("modifiedBefore") || undefined)
    setCreatedAfter(searchParams.get("createdAfter") || undefined)
    setCreatedBefore(searchParams.get("createdBefore") || undefined)
  }, [searchParams])

  const createQueryStringAndPush = useCallback(
    (paramsToUpdate: Record<string, string | number | null | undefined>, immediate = false) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()))

      Object.entries(paramsToUpdate).forEach(([name, value]) => {
        const stringValue = value !== undefined && value !== null ? String(value) : ""
        if (value === null || value === undefined || stringValue === "all" || stringValue === "") {
          current.delete(name)
        } else {
          current.set(name, stringValue)
        }
      })

      if (
        paramsToUpdate.hasOwnProperty("q") ||
        paramsToUpdate.hasOwnProperty("filterStatus") ||
        paramsToUpdate.hasOwnProperty("filterDomain") ||
        paramsToUpdate.hasOwnProperty("limit") ||
        paramsToUpdate.hasOwnProperty("modifiedAfter") ||
        paramsToUpdate.hasOwnProperty("modifiedBefore") ||
        paramsToUpdate.hasOwnProperty("createdAfter") ||
        paramsToUpdate.hasOwnProperty("createdBefore")
      ) {
        current.delete("page")
      }

      const newQueryString = current.toString()

      if (immediate) {
        router.push(`${pathname}?${newQueryString}`)
      } else {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current)
        }
        debounceTimeoutRef.current = setTimeout(() => {
          router.push(`${pathname}?${newQueryString}`)
        }, DEBOUNCE_DELAY)
      }
    },
    [searchParams, router, pathname],
  )

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  const handleItemsPerPageChange = (value: string) => {
    createQueryStringAndPush({ limit: Number.parseInt(value, 10) }, true)
  }

  const handleFilterChange = (filterType: "status" | "domain", value: string) => {
    createQueryStringAndPush({ [filterType === "status" ? "filterStatus" : "filterDomain"]: value }, true)
  }

  const handleDateChange = (
    filterType: "modifiedAfter" | "modifiedBefore" | "createdAfter" | "createdBefore",
    dateString: string | undefined,
  ) => {
    if (filterType === "modifiedAfter") setModifiedAfter(dateString)
    if (filterType === "modifiedBefore") setModifiedBefore(dateString)
    if (filterType === "createdAfter") setCreatedAfter(dateString)
    if (filterType === "createdBefore") setCreatedBefore(dateString)

    createQueryStringAndPush({ [filterType]: dateString || null }, true)
  }

  const applyDatePreset = (dateType: "created" | "modified", preset: DatePreset) => {
    const { start, end } = preset.getRange()
    if (dateType === "created") {
      setCreatedAfter(start)
      setCreatedBefore(end)
      createQueryStringAndPush({ createdAfter: start, createdBefore: end }, true)
    } else {
      setModifiedAfter(start)
      setModifiedBefore(end)
      createQueryStringAndPush({ modifiedAfter: start, modifiedBefore: end }, true)
    }
  }

  const clearDateRange = (dateType: "created" | "modified") => {
    if (dateType === "created") {
      setCreatedAfter(undefined)
      setCreatedBefore(undefined)
      createQueryStringAndPush({ createdAfter: null, createdBefore: null }, true)
    } else {
      setModifiedAfter(undefined)
      setModifiedBefore(undefined)
      createQueryStringAndPush({ modifiedAfter: null, modifiedBefore: null }, true)
    }
  }

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    setSearchInputValue(newValue)
    createQueryStringAndPush({ q: newValue }, false)
  }

  const handleSearchSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault()
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    createQueryStringAndPush({ q: searchInputValue }, true)
  }

  const clearFilters = () => {
    setSearchInputValue("")
    setModifiedAfter(undefined)
    setModifiedBefore(undefined)
    setCreatedAfter(undefined)
    setCreatedBefore(undefined)

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    const current = new URLSearchParams()
    const sortBy = searchParams.get("sortBy")
    const sortOrder = searchParams.get("sortOrder")
    const limitVal = searchParams.get("limit")

    if (sortBy) current.set("sortBy", sortBy)
    if (sortOrder) current.set("sortOrder", sortOrder)
    if (limitVal) current.set("limit", limitVal)

    router.push(`${pathname}?${current.toString()}`)
  }

  const hasActiveFilters =
    !!currentStatus ||
    !!currentDomain ||
    !!currentSearchQuery ||
    !!modifiedAfter ||
    !!modifiedBefore ||
    !!createdAfter ||
    !!createdBefore

  const DatePresetPicker: React.FC<{ dateType: "created" | "modified" }> = ({ dateType }) => {
    const currentAfterDate = dateType === "created" ? createdAfter : modifiedAfter
    const currentBeforeDate = dateType === "created" ? createdBefore : modifiedBefore

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs px-2 h-8">
            Presets <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {commonDatePresets.map((preset) => {
            const { start, end } = preset.getRange()
            const isActive = currentAfterDate === start && currentBeforeDate === end
            return (
              <DropdownMenuItem
                key={`${dateType}-${preset.label}`}
                onClick={() => applyDatePreset(dateType, preset)}
                className={cn("flex items-center", isActive && "bg-accent text-accent-foreground")}
              >
                {isActive ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <span className="mr-2 h-4 w-4" /> /* Placeholder for alignment */
                )}
                {preset.label}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <TooltipProvider>
      <div className="mb-6 p-4 border rounded-lg bg-gray-50/50 space-y-6">
        {/* Search and Items per Page Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <Label htmlFor="searchQuery" className="text-sm font-medium text-gray-700">
              Search Policies (Title, Abstract, Keywords)
            </Label>
            <div className="flex items-center mt-1">
              <Input
                id="searchQuery"
                type="text"
                placeholder="Enter keywords..."
                value={searchInputValue}
                onChange={handleSearchInputChange}
                className="rounded-r-none"
              />
              <Button type="submit" onClick={handleSearchSubmit} className="rounded-l-none">
                <Search className="h-4 w-4 mr-2 md:hidden" />
                <span className="hidden md:inline">Search</span>
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="itemsPerPage" className="text-sm font-medium text-gray-700">
              Items per Page
            </Label>
            <Select value={String(currentLimit)} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger id="itemsPerPage" className="w-full mt-1">
                <SelectValue placeholder="Select items per page" />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status and Domain Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <Label htmlFor="filterStatus" className="text-sm font-medium text-gray-700">
              Filter by Status
            </Label>
            <Select value={currentStatus || "all"} onValueChange={(value) => handleFilterChange("status", value)}>
              <SelectTrigger id="filterStatus" className="w-full mt-1">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {POLICY_STATUSES.map((status) => (
                  <SelectItem key={status} value={status!}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filterDomain" className="text-sm font-medium text-gray-700">
              Filter by Policy Domain
            </Label>
            <Select value={currentDomain || "all"} onValueChange={(value) => handleFilterChange("domain", value)}>
              <SelectTrigger id="filterDomain" className="w-full mt-1">
                <SelectValue placeholder="All Domains" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {POLICY_DOMAINS.map((domain) => (
                  <SelectItem key={domain} value={domain}>
                    {domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div> {/* Placeholder for alignment */} </div>
          <div> {/* Placeholder for alignment */} </div>
        </div>

        {/* Date Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4 items-start">
          {/* Created At Range */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="createdAfter" className="text-sm font-medium text-gray-700">
                Created At Range
              </Label>
              <div className="flex items-center space-x-2">
                <DatePresetPicker dateType="created" />
                {(createdAfter || createdBefore) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon_xs"
                        onClick={() => clearDateRange("created")}
                        className="h-8 w-8 p-1.5"
                        aria-label="Clear Created At date range"
                      >
                        <XCircle className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear Created At range</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <DatePickerPopover
                date={createdAfter}
                onSelectDate={(date) => handleDateChange("createdAfter", date)}
                placeholder="Start date"
              />
              <DatePickerPopover
                date={createdBefore}
                onSelectDate={(date) => handleDateChange("createdBefore", date)}
                placeholder="End date"
              />
            </div>
          </div>

          {/* Modified At Range */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="modifiedAfter" className="text-sm font-medium text-gray-700">
                Modified At Range
              </Label>
              <div className="flex items-center space-x-2">
                <DatePresetPicker dateType="modified" />
                {(modifiedAfter || modifiedBefore) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon_xs"
                        onClick={() => clearDateRange("modified")}
                        className="h-8 w-8 p-1.5"
                        aria-label="Clear Modified At date range"
                      >
                        <XCircle className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear Modified At range</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <DatePickerPopover
                date={modifiedAfter}
                onSelectDate={(date) => handleDateChange("modifiedAfter", date)}
                placeholder="Start date"
              />
              <DatePickerPopover
                date={modifiedBefore}
                onSelectDate={(date) => handleDateChange("modifiedBefore", date)}
                placeholder="End date"
              />
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-6 flex justify-end">
            <Button onClick={clearFilters} variant="outline">
              <FilterX className="mr-2 h-4 w-4" /> Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

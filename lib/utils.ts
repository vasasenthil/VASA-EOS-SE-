import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { GetSchemesParams } from "@/app/schemes/types" // Adjust path if needed

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function constructSortUrl(
  searchParams: GetSchemesParams,
  sortBy: string,
  sortDirection: "asc" | "desc",
): string {
  const params = new URLSearchParams()

  // Preserve existing filters
  if (searchParams.query) params.set("query", searchParams.query)
  searchParams.categoryIds?.forEach((id) => params.append("categoryIds", id))
  searchParams.status?.forEach((s) => params.append("status", s))
  // Add other filters here as they are implemented

  // Set new sort parameters
  params.set("sortBy", sortBy)
  params.set("sortDirection", sortDirection)

  // Preserve page number if you want, or reset to 1
  // params.set("page", searchParams.page?.toString() || "1");

  return `/schemes?${params.toString()}`
}

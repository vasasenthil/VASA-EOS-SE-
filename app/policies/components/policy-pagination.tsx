"use client"

import { usePathname } from "next/navigation"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface PolicyPaginationProps {
  currentPage: number
  totalPages: number
  searchParams?: {
    sortBy?: string
    sortOrder?: string
    filterStatus?: string
    filterDomain?: string
    q?: string
    page?: string
    limit?: string
    modifiedAfter?: string
    modifiedBefore?: string
    createdAfter?: string // Added createdAfter
    createdBefore?: string // Added createdBefore
  }
}

export function PolicyPagination({ currentPage, totalPages, searchParams }: PolicyPaginationProps) {
  const pathname = usePathname()

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams as any) // Cast to any to simplify
    params.set("page", String(pageNumber))
    return `${pathname}?${params.toString()}`
  }

  if (totalPages <= 1) {
    return null
  }

  const pageNumbers = []
  const maxPagesToShow = 5
  const halfMaxPages = Math.floor(maxPagesToShow / 2)

  if (totalPages <= maxPagesToShow) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i)
    }
  } else {
    pageNumbers.push(1)

    let startPage = Math.max(
      2,
      currentPage - halfMaxPages + (currentPage === totalPages ? 2 : currentPage === totalPages - 1 ? 1 : 0),
    )
    let endPage = Math.min(
      totalPages - 1,
      currentPage + halfMaxPages - (currentPage === 1 ? 2 : currentPage === 2 ? 1 : 0),
    )

    if (currentPage - 1 <= halfMaxPages) {
      endPage = Math.min(totalPages - 1, maxPagesToShow - 1)
    }
    if (totalPages - currentPage <= halfMaxPages) {
      startPage = Math.max(2, totalPages - maxPagesToShow + 2)
    }

    if (startPage > 2) {
      pageNumbers.push("ellipsis_start")
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    if (endPage < totalPages - 1) {
      pageNumbers.push("ellipsis_end")
    }

    pageNumbers.push(totalPages)
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={currentPage > 1 ? createPageURL(currentPage - 1) : "#"}
            aria-disabled={currentPage <= 1}
            tabIndex={currentPage <= 1 ? -1 : undefined}
            className={currentPage <= 1 ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>

        {pageNumbers.map((page, index) => (
          <PaginationItem key={index}>
            {typeof page === "string" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink href={createPageURL(page)} isActive={currentPage === page}>
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href={currentPage < totalPages ? createPageURL(currentPage + 1) : "#"}
            aria-disabled={currentPage >= totalPages}
            tabIndex={currentPage >= totalPages ? -1 : undefined}
            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

"use client"

import { Fragment, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home } from "lucide-react"
import { dashboardNavConfig } from "@/config/dashboard-nav"
import { breadcrumbsFor } from "@/lib/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// Routes where breadcrumbs add no value.
const HIDE = new Set(["/", "/login"])

export function Breadcrumbs() {
  const pathname = usePathname() || "/"
  const titleMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const nav of Object.values(dashboardNavConfig)) for (const n of nav) if (n.href) map[n.href] = n.title
    return map
  }, [])

  if (HIDE.has(pathname)) return null
  const crumbs = breadcrumbsFor(pathname, titleMap)
  if (crumbs.length === 0) return null

  return (
    <div className="container mx-auto px-4 pt-4 sm:px-6 md:px-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/" aria-label="Home">
                <Home className="h-3.5 w-3.5" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {crumbs.map((c, i) => (
            <Fragment key={c.href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {i === crumbs.length - 1 ? (
                  <BreadcrumbPage>{c.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={c.href}>{c.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}

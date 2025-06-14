"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { dashboardNavConfig } from "@/config/dashboard-nav"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip" // Assuming TooltipProvider is in a higher layout

interface SidebarProps {
  userRole: string
  isCollapsed?: boolean // For potential future mini-sidebar
}

export function Sidebar({ userRole, isCollapsed = false }: SidebarProps) {
  const pathname = usePathname()
  const navItems = dashboardNavConfig[userRole.toUpperCase()] || []

  if (!navItems.length) {
    return null // Or some fallback UI
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r bg-background transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <ScrollArea className="h-full py-4">
        <nav className="grid items-start gap-1 px-2">
          {navItems.map((item) =>
            item.href ? (
              <Link key={item.title} href={item.href} passHref legacyBehavior>
                <a
                  className={cn(
                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                      ? "bg-accent text-accent-foreground"
                      : "transparent",
                    item.disabled && "cursor-not-allowed opacity-80",
                  )}
                  aria-disabled={item.disabled}
                  tabIndex={item.disabled ? -1 : undefined}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <item.icon className={cn("h-5 w-5", isCollapsed ? "mx-auto" : "mr-3")} />
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
                  </Tooltip>
                  {!isCollapsed && <span className="truncate">{item.title}</span>}
                </a>
              </Link>
            ) : (
              !isCollapsed && (
                <span
                  key={item.title}
                  className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground"
                >
                  {item.title}
                </span>
              )
            ),
          )}
        </nav>
      </ScrollArea>
    </aside>
  )
}

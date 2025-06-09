import type * as React from "react"
import { cn } from "@/lib/utils"

interface ShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Shell({ children, className, ...props }: ShellProps) {
  return (
    <div className={cn("container mx-auto p-4 sm:p-6 md:p-8", className)} {...props}>
      {children}
    </div>
  )
}

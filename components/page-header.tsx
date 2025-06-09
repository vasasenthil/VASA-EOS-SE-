import type React from "react"
import { cn } from "@/lib/utils"

function PageHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section className={cn("flex flex-col gap-2 pb-4 pt-2 md:pb-6 md:pt-4 border-b mb-6", className)} {...props}>
      {children}
    </section>
  )
}

function PageHeaderHeading({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn("text-2xl font-bold leading-tight tracking-tighter md:text-3xl lg:leading-[1.1]", className)}
      {...props}
    />
  )
}

function PageHeaderText({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("max-w-[750px] text-base text-muted-foreground", className)} {...props} />
}

export { PageHeader, PageHeaderHeading, PageHeaderText }

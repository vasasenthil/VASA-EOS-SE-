import type React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Convenience prop: renders a PageHeaderHeading. Children are still supported. */
  title?: React.ReactNode
  /** Convenience prop: renders a PageHeaderDescription. */
  description?: React.ReactNode
}

function PageHeader({ className, children, title, description, ...props }: PageHeaderProps) {
  return (
    <section className={cn("flex flex-col gap-2 pb-4 pt-2 md:pb-6 md:pt-4 border-b mb-6", className)} {...props}>
      {title ? <PageHeaderHeading>{title}</PageHeaderHeading> : null}
      {description ? <PageHeaderDescriptionComponent>{description}</PageHeaderDescriptionComponent> : null}
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

function PageHeaderDescriptionComponent({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("max-w-[750px] text-base text-muted-foreground", className)} {...props} />
}

// Exporting as PageHeaderDescription as per the error message
export { PageHeaderDescriptionComponent as PageHeaderDescription }

// Also exporting as PageHeaderText to satisfy all potential dependencies in your codebase
export { PageHeaderDescriptionComponent as PageHeaderText }

function PageHeaderActions({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  )
}

export { PageHeader, PageHeaderHeading, PageHeaderActions }

import { BarChart } from "lucide-react"

interface ChartPlaceholderProps {
  title: string
  className?: string
}

export function ChartPlaceholder({ title, className }: ChartPlaceholderProps) {
  return (
    <div className={`w-full bg-muted rounded-lg flex flex-col items-center justify-center p-6 ${className}`}>
      <BarChart className="h-12 w-12 text-muted-foreground/50 mb-3" />
      <p className="text-muted-foreground text-sm">{title}</p>
      <p className="text-xs text-muted-foreground/70">Chart visualization will appear here.</p>
    </div>
  )
}

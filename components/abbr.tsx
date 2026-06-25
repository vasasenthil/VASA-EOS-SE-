"use client"

import Link from "next/link"
import { lookup } from "@/lib/glossary"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

// Inline acronym helper: <Abbr a="APAAR" /> renders the abbreviation with a tooltip
// carrying its expansion (and any context note), linking through to the full glossary.
// Unknown abbreviations degrade to plain text so it is always safe to drop in.
export function Abbr({ a, className }: { a: string; className?: string }) {
  const entry = lookup(a)
  if (!entry) return <span className={className}>{a}</span>

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={`/glossary?q=${encodeURIComponent(entry.abbr)}`}
            className={
              "cursor-help underline decoration-dotted underline-offset-4 " + (className ?? "")
            }
          >
            <abbr title={entry.expansion} className="no-underline">
              {entry.abbr}
            </abbr>
          </Link>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-medium">{entry.expansion}</p>
          {entry.note ? <p className="mt-1 text-xs text-muted-foreground">{entry.note}</p> : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

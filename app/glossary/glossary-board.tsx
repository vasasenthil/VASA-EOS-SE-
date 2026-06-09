"use client"

import { useMemo, useState } from "react"
import {
  GLOSSARY,
  GLOSSARY_CATEGORIES,
  searchGlossary,
  filterByCategory,
  groupByCategory,
  sortByAbbr,
  type GlossaryCategory,
} from "@/lib/glossary"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export function GlossaryBoard() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<GlossaryCategory | "">("")

  const groups = useMemo(() => {
    const byCat = filterByCategory(category, GLOSSARY)
    const matched = sortByAbbr(searchGlossary(query, byCat))
    return groupByCategory(matched)
  }, [query, category])

  const resultCount = groups.reduce((s, g) => s + g.entries.length, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search abbreviation or expansion (e.g. APAAR, mid-day meal)…"
            className="pl-9"
            aria-label="Search the glossary"
          />
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {resultCount} {resultCount === 1 ? "term" : "terms"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={category === "" ? "default" : "outline"}
          onClick={() => setCategory("")}
        >
          All
        </Button>
        {GLOSSARY_CATEGORIES.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={category === c ? "default" : "outline"}
            onClick={() => setCategory(c)}
          >
            {c}
          </Button>
        ))}
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No terms match “{query}”.
          </CardContent>
        </Card>
      ) : (
        groups.map((g) => (
          <section key={g.category} className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{g.category}</h2>
              <Badge variant="secondary">{g.entries.length}</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {g.entries.map((e) => (
                <Card key={e.abbr}>
                  <CardContent className="space-y-1 py-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono font-semibold">{e.abbr}</span>
                      <span className="text-muted-foreground">—</span>
                      <span className="font-medium">{e.expansion}</span>
                    </div>
                    {e.note ? <p className="text-sm text-muted-foreground">{e.note}</p> : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

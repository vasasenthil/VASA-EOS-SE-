"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { dashboardNavConfig } from "@/config/dashboard-nav"
import { dedupeByHref, filterCommandItems, type CommandItem } from "@/lib/command"

interface CommandPaletteContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null)

export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext)
  if (!ctx) throw new Error("useCommandPalette must be used within CommandPaletteProvider")
  return ctx
}

// Global navigation palette + provider. Open with Cmd/Ctrl+K or the header trigger.
export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandPaletteDialog open={open} setOpen={setOpen} />
    </CommandPaletteContext.Provider>
  )
}

/** Header affordance that opens the palette and shows the keyboard hint. */
export function CommandPaletteTrigger() {
  const { setOpen } = useCommandPalette()
  const [meta, setMeta] = useState("⌘")

  useEffect(() => {
    if (typeof navigator !== "undefined" && !/mac/i.test(navigator.userAgent)) setMeta("Ctrl ")
  }, [])

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setOpen(true)}
      aria-label="Open command palette"
      className="h-9 gap-2 text-muted-foreground"
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search…</span>
      <kbd
        suppressHydrationWarning
        className="hidden rounded border bg-muted px-1.5 font-mono text-[10px] leading-5 sm:inline"
      >
        {meta}K
      </kbd>
    </Button>
  )
}

function CommandPaletteDialog({ open, setOpen }: { open: boolean; setOpen: (o: boolean) => void }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)

  const items = useMemo<CommandItem[]>(() => {
    const flat = Object.values(dashboardNavConfig).flatMap((nav) => nav.map((n) => ({ title: n.title, href: n.href })))
    return dedupeByHref(flat)
  }, [])

  const filtered = useMemo(() => filterCommandItems(items, query), [items, query])

  useEffect(() => {
    setActive(0)
  }, [query, open])

  function go(href: string) {
    setOpen(false)
    setQuery("")
    router.push(href)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg overflow-hidden p-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Input
          autoFocus
          placeholder="Jump to…  (type to filter)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setActive((a) => Math.min(a + 1, filtered.length - 1))
            } else if (e.key === "ArrowUp") {
              e.preventDefault()
              setActive((a) => Math.max(a - 1, 0))
            } else if (e.key === "Enter") {
              e.preventDefault()
              const it = filtered[active]
              if (it) go(it.href)
            }
          }}
          className="h-12 rounded-none border-0 border-b focus-visible:ring-0"
        />
        <ul className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No matches</li>
          ) : (
            filtered.map((it, i) => (
              <li key={it.href}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(it.href)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                    i === active ? "bg-accent" : "hover:bg-accent/50"
                  }`}
                >
                  <span>{it.title}</span>
                  <span className="font-mono text-xs text-muted-foreground">{it.href}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  )
}

import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Eye, Pencil, ArrowLeft, ArrowRight, Package, AlertTriangle } from "lucide-react"
import { listAssetsAction } from "./actions"
import { AssetFilters } from "./components/asset-filters"
import { DeleteAssetButton, SeedAssetsButton } from "./components/asset-actions"
import { totalValue, bookValue, isLowStock, inr, type AssetStatus } from "@/lib/assetmgmt"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const STATUS_STYLE: Record<AssetStatus, string> = {
  "In Stock": "bg-green-100 text-green-700",
  Assigned: "bg-blue-100 text-blue-700",
  "Under Repair": "bg-amber-100 text-amber-700",
  Disposed: "bg-gray-100 text-gray-600",
}

interface SP { q?: string; category?: string; condition?: string; status?: string; lowStock?: string; sort?: "name" | "value" | "assetTag"; page?: string }

export default async function AssetRegisterPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listAssetsAction({ query: sp.q, category: sp.category, condition: sp.condition, status: sp.status, lowStock: sp.lowStock === "1", sortBy: sp.sort, sortDir: sp.sort === "value" ? "desc" : "asc", page })
  const demo = !isSupabaseAdminConfigured()
  const s = result.summary

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, category: sp.category, condition: sp.condition, status: sp.status, lowStock: sp.lowStock, sort: sp.sort })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/asset-register?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Asset Register & Inventory</PageHeaderHeading>
        <PageHeaderDescription>School assets and stock — category, location, quantity, condition and lifecycle status, with procurement (cost, funding, useful life), straight-line depreciation/book value and reorder/low-stock alerts. Filter, search, assign and value assets.</PageHeaderDescription>
        <PageHeaderActions>
          <SeedAssetsButton />
          <Button asChild><Link href="/asset-register/new"><PlusCircle className="mr-2 h-4 w-4" />New asset</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing representative <strong>demo assets</strong> — no database is configured. Provision Supabase and seed to manage live inventory.
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Items", String(s.items), "text-foreground"],
          ["Total qty", String(s.quantity), "text-foreground"],
          ["Purchase value", inr(s.purchaseValue), "text-blue-700"],
          ["Book value", inr(s.bookValue), "text-green-700"],
          ["Low stock", String(s.lowStock), s.lowStock > 0 ? "text-red-700" : "text-foreground"],
        ].map(([label, value, color]) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <AssetFilters />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Location</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Book value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground"><Package className="mx-auto mb-2 h-8 w-8" />No assets found. Adjust filters, seed demo data, or add a new asset.</TableCell></TableRow>
              ) : (
                result.items.map((a) => {
                  const low = isLowStock(a)
                  return (
                    <TableRow key={a.id} className={low ? "bg-red-50/40" : undefined}>
                      <TableCell className="font-medium">{a.name}<div className="text-xs text-muted-foreground font-mono">{a.assetTag} · {a.condition}{low ? " · low stock" : ""}</div></TableCell>
                      <TableCell className="hidden md:table-cell">{a.category}</TableCell>
                      <TableCell className="hidden lg:table-cell">{a.location}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.quantity} {a.unit}{low ? <AlertTriangle className="ml-1 inline h-3.5 w-3.5 text-red-600" /> : null}</TableCell>
                      <TableCell className="text-right tabular-nums">{inr(totalValue(a))}</TableCell>
                      <TableCell className="text-right tabular-nums hidden lg:table-cell">{inr(bookValue(a))}</TableCell>
                      <TableCell><Badge className={`${STATUS_STYLE[a.status]} border-0`}>{a.status}</Badge></TableCell>
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        <Button asChild variant="outline" size="icon"><Link href={`/asset-register/${a.id}`} aria-label="View"><Eye className="h-4 w-4" /></Link></Button>
                        <Button asChild variant="outline" size="icon"><Link href={`/asset-register/${a.id}/edit`} aria-label="Edit"><Pencil className="h-4 w-4" /></Link></Button>
                        <DeleteAssetButton id={a.id} name={a.name} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {result.items.length} of {result.total} asset{result.total === 1 ? "" : "s"} · page {result.page} of {result.totalPages}</span>
        {result.totalPages > 1 ? (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" disabled={result.page <= 1}><Link href={pageHref(result.page - 1)}><ArrowLeft className="mr-1 h-4 w-4" />Prev</Link></Button>
            <Button asChild variant="outline" size="sm" disabled={result.page >= result.totalPages}><Link href={pageHref(result.page + 1)}>Next<ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
        ) : null}
      </div>
    </Shell>
  )
}

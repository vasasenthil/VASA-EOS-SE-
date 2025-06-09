import type { GovernanceTier } from "@/app/governance/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface TierTableProps {
  tiers: { success: boolean; data?: GovernanceTier[]; error?: string }
}

export function TierTable({ tiers }: TierTableProps) {
  if (!tiers.success) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Governance Tiers</AlertTitle>
        <AlertDescription>{tiers.error || "An unknown error occurred."}</AlertDescription>
      </Alert>
    )
  }
  if (!tiers.data || tiers.data.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Governance Tiers</AlertTitle>
        <AlertDescription>No governance tiers found in the database.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-center">Level Order</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tiers.data.map((tier) => (
            <TableRow key={tier.id}>
              <TableCell className="font-medium">{tier.name}</TableCell>
              <TableCell>{tier.description || <span className="text-muted-foreground">-</span>}</TableCell>
              <TableCell className="text-center">{tier.level_order}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

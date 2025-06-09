import type { OrganizationalUnit } from "@/app/governance/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface OrganizationalUnitTableProps {
  ous: { success: boolean; data?: OrganizationalUnit[]; error?: string }
}

export function OrganizationalUnitTable({ ous }: OrganizationalUnitTableProps) {
  if (!ous.success) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Organizational Units</AlertTitle>
        <AlertDescription>{ous.error || "An unknown error occurred."}</AlertDescription>
      </Alert>
    )
  }

  if (!ous.data || ous.data.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Organizational Units</AlertTitle>
        <AlertDescription>No organizational units have been created yet.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>Parent OU</TableHead>
            <TableHead>Region Code</TableHead>
            <TableHead className="text-center">Users</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ous.data.map((ou) => (
            <TableRow key={ou.id}>
              <TableCell className="font-medium">{ou.name}</TableCell>
              <TableCell>{ou.tier?.name || <span className="text-muted-foreground">N/A</span>}</TableCell>
              <TableCell>{ou.parent_ou?.name || <span className="text-muted-foreground">-</span>}</TableCell>
              <TableCell>{ou.region_code || <span className="text-muted-foreground">-</span>}</TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary">{ou.user_count || 0}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

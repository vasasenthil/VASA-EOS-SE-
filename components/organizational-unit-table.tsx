import type { OrganizationalUnit } from "@/app/governance/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Pencil } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { DeleteOUButton } from "@/app/governance/organizational-units/components/delete-ou-button" // Import the new component

interface OrganizationalUnitTableProps {
  ous: { success: boolean; data?: OrganizationalUnit[]; error?: string }
  canManageOUs: boolean // Add prop to control edit/delete actions
}

export function OrganizationalUnitTable({ ous, canManageOUs }: OrganizationalUnitTableProps) {
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
            {canManageOUs && <TableHead className="text-right">Actions</TableHead>}
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
              {canManageOUs && (
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/governance/organizational-units/edit/${ou.id}`}>
                      <Pencil className="mr-1 h-3 w-3" />
                      Edit
                    </Link>
                  </Button>
                  <DeleteOUButton ouId={ou.id} ouName={ou.name} canManageOUs={canManageOUs} />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

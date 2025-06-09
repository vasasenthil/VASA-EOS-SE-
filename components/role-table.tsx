import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Pencil, ShieldCheck, Users, KeyRound } from "lucide-react"
import type { RoleActionState } from "@/app/governance/roles/actions"
import { DeleteRoleButton } from "@/app/governance/roles/components/delete-role-button"

interface RoleTableProps {
  rolesResult: RoleActionState<any[]> // Using any[] to be flexible with the data shape from the action
  canManageRoles: boolean
}

export function RoleTable({ rolesResult, canManageRoles }: RoleTableProps) {
  if (!rolesResult.success) {
    return <div className="text-destructive">Error: {rolesResult.message}</div>
  }

  const roles = rolesResult.data || []

  if (roles.length === 0) {
    return <div className="text-muted-foreground">No roles found.</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-center">System Role</TableHead>
            <TableHead className="text-center">Permissions</TableHead>
            <TableHead className="text-center">Users</TableHead>
            {canManageRoles && <TableHead className="w-[100px] text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell className="font-medium">{role.name}</TableCell>
              <TableCell className="text-muted-foreground">{role.description || "-"}</TableCell>
              <TableCell className="text-center">
                {role.is_system_role && (
                  <Badge variant="secondary">
                    <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                    System
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  {role.permissions_count ?? 0}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {role.assigned_user_count ?? 0}
                </div>
              </TableCell>
              {canManageRoles && (
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/governance/roles/edit/${role.id}`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                    {!role.is_system_role && (
                      <DeleteRoleButton roleId={role.id} roleName={role.name} canManageRoles={canManageRoles} />
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

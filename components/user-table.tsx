import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ShieldPlus } from "lucide-react"
import type { AuthUser } from "@/app/governance/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

interface UserTableProps {
  usersResult: { success: boolean; message: string; data: AuthUser[]; total?: number }
  canManageUsers: boolean
  basePath?: string // e.g., /admin/governance/users
}

export function UserTable({ usersResult, canManageUsers, basePath = "/admin/governance/users" }: UserTableProps) {
  if (!usersResult.success) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Users</AlertTitle>
        <AlertDescription>{usersResult.message}</AlertDescription>
      </Alert>
    )
  }

  const users = usersResult.data || []

  if (users.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Users Found</AlertTitle>
        <AlertDescription>There are no users in the system yet, or none match your search criteria.</AlertDescription>
      </Alert>
    )
  }

  const getInitials = (name?: string | null, email?: string | null): string => {
    if (name) {
      const parts = name.split(" ")
      if (parts.length > 1) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      }
      return name.substring(0, 2).toUpperCase()
    }
    if (email) {
      return email.substring(0, 2).toUpperCase()
    }
    return "U"
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Avatar</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            {canManageUsers && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={user.raw_user_meta_data?.avatar_url || undefined}
                    alt={user.raw_user_meta_data?.name || user.email || "User"}
                  />
                  <AvatarFallback>{getInitials(user.raw_user_meta_data?.name, user.email)}</AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="font-medium">
                {user.raw_user_meta_data?.name || <span className="text-muted-foreground">N/A</span>}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              {canManageUsers && (
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`${basePath}/${user.id}/assignments`}>
                      <ShieldPlus className="mr-2 h-4 w-4" />
                      Manage Assignments
                    </Link>
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

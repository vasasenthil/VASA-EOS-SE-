"use client"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { deleteRoleAction } from "@/app/governance/roles/actions"

interface DeleteRoleButtonProps {
  roleId: string
  roleName: string
  canManageRoles: boolean
}

export function DeleteRoleButton({ roleId, roleName, canManageRoles }: DeleteRoleButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (!canManageRoles) {
    return null
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteRoleAction(roleId)
      if (result.success) {
        toast.success(`Role "${roleName}" deleted successfully.`)
        router.refresh()
      } else {
        toast.error(result.message || "Failed to delete role.")
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete Role</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the role <strong>{`"${roleName}"`}</strong> and
            revoke it from all users.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            {isPending ? "Deleting..." : "Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { deleteOrganizationalUnitAction } from "@/app/governance/organizational-units/actions"

interface DeleteOUButtonProps {
  ouId: string
  ouName: string
  canManageOUs: boolean
  onSuccess?: () => void // Optional callback after successful deletion
}

export function DeleteOUButton({ ouId, ouName, canManageOUs, onSuccess }: DeleteOUButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    if (!canManageOUs) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to delete organizational units.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      const result = await deleteOrganizationalUnitAction(ouId)
      if (result.success) {
        toast({
          title: "Success",
          description: `Organizational Unit "${ouName}" deleted successfully.`,
        })
        setIsOpen(false)
        if (onSuccess) {
          onSuccess()
        } else {
          router.refresh() // Refresh the current route to update the list
        }
      } else {
        toast({
          title: "Error Deleting OU",
          description: result.message || "An unexpected error occurred.",
          variant: "destructive",
        })
      }
    })
  }

  if (!canManageOUs) {
    return null // Or a disabled button: <Button variant="ghost" size="icon" disabled><Trash2 className="h-4 w-4" /></Button>
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive-foreground hover:bg-destructive/90"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete {ouName}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the Organizational Unit: <strong>{ouName}</strong>?
            <br />
            This action cannot be undone. Ensure no users or child OUs are still assigned. The system will prevent
            deletion if dependencies exist.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete OU"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

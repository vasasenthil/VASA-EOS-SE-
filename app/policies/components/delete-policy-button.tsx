"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2, AlertTriangle } from "lucide-react"
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
import { deletePolicyAction, type DeletePolicyActionState } from "../create/actions"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DeletePolicyButtonProps {
  policyId: string
  policyTitle: string
  onDelete?: (policyId: string) => void
}

export function DeletePolicyButton({ policyId, policyTitle, onDelete }: DeletePolicyButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleDelete = async () => {
    setError(null)
    startTransition(async () => {
      const result: DeletePolicyActionState = await deletePolicyAction(policyId)
      if (result.success) {
        toast({
          title: "Policy Deleted",
          description: `Policy "${policyTitle}" (ID: ${policyId}) has been successfully deleted.`,
          variant: "default",
        })
        setIsDialogOpen(false)
        if (onDelete) {
          onDelete(policyId)
        } else {
          router.refresh()
        }
      } else {
        setError(result.message || "Failed to delete policy.")
        toast({
          title: "Error Deleting Policy",
          description: result.message || "An unexpected error occurred.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <TooltipProvider>
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" aria-label={`Delete policy ${policyTitle}`}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete Policy "{policyTitle}"</p>
          </TooltipContent>
        </Tooltip>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the policy titled "<strong>{policyTitle}</strong>" (ID: {policyId})? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-red-600 py-2">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} onClick={() => setIsDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Policy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { POLICY_STATUSES, type PolicyStatus } from "../create/policy-form-constants"
import { updatePolicyStatusAction, type UpdatePolicyStatusActionState } from "../create/actions"

interface PolicyStatusUpdaterProps {
  policyId: string
  currentStatus: PolicyStatus
}

export function PolicyStatusUpdater({ policyId, currentStatus }: PolicyStatusUpdaterProps) {
  const [selectedStatus, setSelectedStatus] = useState<PolicyStatus>(currentStatus)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  const handleStatusUpdate = () => {
    if (selectedStatus === currentStatus) {
      toast({
        title: "No Change",
        description: "The selected status is the same as the current status.",
        variant: "default",
      })
      return
    }

    startTransition(async () => {
      const result: UpdatePolicyStatusActionState = await updatePolicyStatusAction(policyId, selectedStatus)
      if (result.success) {
        toast({
          title: "Status Updated",
          description: result.message,
        })
        // No need to manually refresh router.refresh() here as revalidatePath in action should handle it.
        // If dynamic updates on the same page are needed without full reload, consider passing a callback or using global state.
      } else {
        toast({
          title: "Update Failed",
          description: result.message || result.error || "An unknown error occurred.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Card className="mt-6 border-blue-200 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg text-blue-700">Manage Policy Status</CardTitle>
        <CardDescription>Update the current status of this policy.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="policyStatus" className="font-medium text-gray-700">
            New Status
          </Label>
          <Select value={selectedStatus} onValueChange={(value: PolicyStatus) => setSelectedStatus(value)}>
            <SelectTrigger id="policyStatus" className="w-full mt-1">
              <SelectValue placeholder="Select new status" />
            </SelectTrigger>
            <SelectContent>
              {POLICY_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleStatusUpdate}
          disabled={isPending || selectedStatus === currentStatus}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
        >
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isPending ? "Updating..." : "Update Status"}
        </Button>
      </CardContent>
    </Card>
  )
}

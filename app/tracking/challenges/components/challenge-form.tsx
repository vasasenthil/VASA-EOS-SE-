"use client"

import { useTransition, useEffect } from "react"
import { useForm, Controller, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, PlusCircle, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  type ImplementationChallenge,
  type ImplementationChallengeInput,
  CHALLENGE_CATEGORIES,
  CHALLENGE_SEVERITIES,
  CHALLENGE_STATUSES,
} from "../types"
import { addChallengeAction, updateChallengeAction, type ChallengeActionState } from "../../dashboard/actions"
import { DatePickerPopover } from "@/app/policies/components/date-picker-popover" // Reusing existing component

const challengeFormSchema = z.object({
  challenge_title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title is too long"),
  description: z.string().optional().nullable(),
  category: z
    .enum(CHALLENGE_CATEGORIES as [string, ...string[]])
    .optional()
    .nullable(),
  severity: z.enum(CHALLENGE_SEVERITIES as [string, ...string[]]),
  status: z.enum(CHALLENGE_STATUSES as [string, ...string[]]),
  reported_date: z.string().optional().nullable(),
  resolved_date: z.string().optional().nullable(),
  resolution_details: z.string().optional().nullable(),
  reported_by: z.string().optional().nullable(),
  assigned_to: z.string().optional().nullable(),
})

type ChallengeFormData = z.infer<typeof challengeFormSchema>

interface ChallengeFormProps {
  implementationStatusId: string
  challenge?: ImplementationChallenge // For editing
  onSuccess?: (challengeId: string) => void
  onCancel?: () => void
}

export function ChallengeForm({ implementationStatusId, challenge, onSuccess, onCancel }: ChallengeFormProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChallengeFormData>({
    resolver: zodResolver(challengeFormSchema),
    defaultValues: {
      challenge_title: challenge?.challenge_title || "",
      description: challenge?.description || "",
      category: challenge?.category || null,
      severity: challenge?.severity || "Medium",
      status: challenge?.status || "Open",
      reported_date: challenge?.reported_date || null,
      resolved_date: challenge?.resolved_date || null,
      resolution_details: challenge?.resolution_details || "",
      reported_by: challenge?.reported_by || "",
      assigned_to: challenge?.assigned_to || "",
    },
  })

  useEffect(() => {
    if (challenge) {
      reset({
        challenge_title: challenge.challenge_title,
        description: challenge.description || "",
        category: challenge.category || null,
        severity: challenge.severity,
        status: challenge.status,
        reported_date: challenge.reported_date || null,
        resolved_date: challenge.resolved_date || null,
        resolution_details: challenge.resolution_details || "",
        reported_by: challenge.reported_by || "",
        assigned_to: challenge.assigned_to || "",
      })
    } else {
      reset({
        // Default for new challenge
        challenge_title: "",
        description: "",
        category: null,
        severity: "Medium",
        status: "Open",
        reported_date: new Date().toISOString().split("T")[0], // Default to today
        resolved_date: null,
        resolution_details: "",
        reported_by: "",
        assigned_to: "",
      })
    }
  }, [challenge, reset])

  const onSubmit: SubmitHandler<ChallengeFormData> = (formData) => {
    startTransition(async () => {
      let result: ChallengeActionState
      const challengeInputData: Omit<ImplementationChallengeInput, "implementation_status_id"> = {
        ...formData,
        // Ensure nulls are passed correctly if optional fields are empty
        description: formData.description || null,
        category: formData.category || null,
        reported_date: formData.reported_date || null,
        resolved_date: formData.resolved_date || null,
        resolution_details: formData.resolution_details || null,
        reported_by: formData.reported_by || null,
        assigned_to: formData.assigned_to || null,
      }

      if (challenge?.id) {
        result = await updateChallengeAction(challenge.id, challengeInputData)
      } else {
        result = await addChallengeAction(implementationStatusId, challengeInputData)
      }

      if (result.success && result.challengeId) {
        toast({ title: challenge?.id ? "Challenge Updated" : "Challenge Added", description: result.message })
        if (onSuccess) onSuccess(result.challengeId)
        if (!challenge?.id) reset() // Reset form only if adding new
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
        if (result.errors?._general) {
          // Handle general error display if needed
        }
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {challenge?.id ? <Edit className="mr-2 h-5 w-5" /> : <PlusCircle className="mr-2 h-5 w-5" />}
          {challenge?.id ? "Edit Challenge" : "Add New Challenge"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="challenge_title">Title (Required)</Label>
            <Input id="challenge_title" {...register("challenge_title")} disabled={isPending} />
            {errors.challenge_title && <p className="text-sm text-red-500 mt-1">{errors.challenge_title.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} disabled={isPending} rows={3} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={isPending}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {CHALLENGE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat!} value={cat!}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="severity">Severity (Required)</Label>
              <Controller
                name="severity"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isPending} required>
                    <SelectTrigger id="severity">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      {CHALLENGE_SEVERITIES.map((sev) => (
                        <SelectItem key={sev} value={sev}>
                          {sev}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.severity && <p className="text-sm text-red-500 mt-1">{errors.severity.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status (Required)</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isPending} required>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {CHALLENGE_STATUSES.map((stat) => (
                        <SelectItem key={stat} value={stat}>
                          {stat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && <p className="text-sm text-red-500 mt-1">{errors.status.message}</p>}
            </div>
            <div>
              <Label htmlFor="reported_date">Reported Date</Label>
              <Controller
                name="reported_date"
                control={control}
                render={({ field }) => (
                  <DatePickerPopover
                    date={field.value || undefined}
                    onSelectDate={(date) => field.onChange(date)}
                    placeholder="Select reported date"
                    disabled={isPending}
                  />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reported_by">Reported By</Label>
              <Input id="reported_by" {...register("reported_by")} disabled={isPending} />
            </div>
            <div>
              <Label htmlFor="assigned_to">Assigned To</Label>
              <Input id="assigned_to" {...register("assigned_to")} disabled={isPending} />
            </div>
          </div>

          {control._formValues.status === "Resolved" || control._formValues.status === "Closed" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="resolved_date">Resolved Date</Label>
                <Controller
                  name="resolved_date"
                  control={control}
                  render={({ field }) => (
                    <DatePickerPopover
                      date={field.value || undefined}
                      onSelectDate={(date) => field.onChange(date)}
                      placeholder="Select resolved date"
                      disabled={isPending}
                    />
                  )}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="resolution_details">Resolution Details</Label>
                <Textarea id="resolution_details" {...register("resolution_details")} disabled={isPending} rows={3} />
              </div>
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isPending || isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending || isSubmitting}>
            {isPending || isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {challenge?.id ? "Update Challenge" : "Add Challenge"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

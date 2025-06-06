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
  type ImplementationStakeholder,
  type ImplementationStakeholderInput,
  STAKEHOLDER_TYPES,
  STAKEHOLDER_ROLES,
  ENGAGEMENT_LEVELS,
  INFLUENCE_INTEREST_LEVELS,
} from "../types"
import { addStakeholderAction, updateStakeholderAction, type StakeholderActionState } from "../../dashboard/actions"

const stakeholderFormSchema = z.object({
  stakeholder_name: z.string().min(3, "Name must be at least 3 characters").max(200, "Name is too long"),
  stakeholder_type: z.enum(STAKEHOLDER_TYPES).optional().nullable(),
  role_in_implementation: z.enum(STAKEHOLDER_ROLES).optional().nullable(),
  contact_person: z.string().optional().nullable(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")).nullable(),
  phone: z.string().optional().nullable(),
  engagement_level: z.enum(ENGAGEMENT_LEVELS).optional().nullable(),
  influence_level: z.enum(INFLUENCE_INTEREST_LEVELS).optional().nullable(),
  interest_level: z.enum(INFLUENCE_INTEREST_LEVELS).optional().nullable(),
  contribution_summary: z.string().optional().nullable(),
  challenges_anticipated: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

type StakeholderFormData = z.infer<typeof stakeholderFormSchema>

interface StakeholderFormProps {
  implementationStatusId: string
  stakeholder?: ImplementationStakeholder
  onSuccess?: (stakeholderId: string) => void
  onCancel?: () => void
}

export function StakeholderForm({ implementationStatusId, stakeholder, onSuccess, onCancel }: StakeholderFormProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StakeholderFormData>({
    resolver: zodResolver(stakeholderFormSchema),
    defaultValues: {},
  })

  useEffect(() => {
    reset({
      stakeholder_name: stakeholder?.stakeholder_name || "",
      stakeholder_type: stakeholder?.stakeholder_type || null,
      role_in_implementation: stakeholder?.role_in_implementation || null,
      contact_person: stakeholder?.contact_person || "",
      email: stakeholder?.email || "",
      phone: stakeholder?.phone || "",
      engagement_level: stakeholder?.engagement_level || null,
      influence_level: stakeholder?.influence_level || null,
      interest_level: stakeholder?.interest_level || null,
      contribution_summary: stakeholder?.contribution_summary || "",
      challenges_anticipated: stakeholder?.challenges_anticipated || "",
      notes: stakeholder?.notes || "",
    })
  }, [stakeholder, reset])

  const onSubmit: SubmitHandler<StakeholderFormData> = (formData) => {
    startTransition(async () => {
      let result: StakeholderActionState
      const stakeholderInputData: Omit<ImplementationStakeholderInput, "implementation_status_id"> = {
        ...formData,
        // Ensure empty strings become nulls for optional fields
        stakeholder_type: formData.stakeholder_type || null,
        role_in_implementation: formData.role_in_implementation || null,
        contact_person: formData.contact_person || null,
        email: formData.email || null,
        phone: formData.phone || null,
        engagement_level: formData.engagement_level || null,
        influence_level: formData.influence_level || null,
        interest_level: formData.interest_level || null,
        contribution_summary: formData.contribution_summary || null,
        challenges_anticipated: formData.challenges_anticipated || null,
        notes: formData.notes || null,
      }

      if (stakeholder?.id) {
        result = await updateStakeholderAction(stakeholder.id, stakeholderInputData)
      } else {
        result = await addStakeholderAction(implementationStatusId, stakeholderInputData)
      }

      if (result.success && result.stakeholderId) {
        toast({ title: stakeholder?.id ? "Stakeholder Updated" : "Stakeholder Added", description: result.message })
        if (onSuccess) onSuccess(result.stakeholderId)
        if (!stakeholder?.id) reset()
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {stakeholder?.id ? <Edit className="mr-2 h-5 w-5" /> : <PlusCircle className="mr-2 h-5 w-5" />}
          {stakeholder?.id ? "Edit Stakeholder" : "Add New Stakeholder"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stakeholder_name">Name (Required)</Label>
              <Input id="stakeholder_name" {...register("stakeholder_name")} disabled={isPending} />
              {errors.stakeholder_name && (
                <p className="text-sm text-red-500 mt-1">{errors.stakeholder_name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="stakeholder_type">Type</Label>
              <Controller
                name="stakeholder_type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={isPending}>
                    <SelectTrigger id="stakeholder_type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAKEHOLDER_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role_in_implementation">Role in Implementation</Label>
              <Controller
                name="role_in_implementation"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={isPending}>
                    <SelectTrigger id="role_in_implementation">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAKEHOLDER_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="engagement_level">Engagement Level</Label>
              <Controller
                name="engagement_level"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={isPending}>
                    <SelectTrigger id="engagement_level">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENGAGEMENT_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input id="contact_person" {...register("contact_person")} disabled={isPending} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} disabled={isPending} />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} disabled={isPending} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="influence_level">Influence Level</Label>
              <Controller
                name="influence_level"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={isPending}>
                    <SelectTrigger id="influence_level">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {INFLUENCE_INTEREST_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="interest_level">Interest Level</Label>
              <Controller
                name="interest_level"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={isPending}>
                    <SelectTrigger id="interest_level">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {INFLUENCE_INTEREST_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="contribution_summary">Contribution Summary</Label>
            <Textarea id="contribution_summary" {...register("contribution_summary")} disabled={isPending} rows={2} />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} disabled={isPending} rows={2} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isPending || isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending || isSubmitting}>
            {isPending || isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {stakeholder?.id ? "Update Stakeholder" : "Add Stakeholder"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

"use client"

import { useTransition, useEffect, useState } from "react"
import { useForm, Controller, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, PlusCircle, Edit, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  type ImplementationStakeholder,
  type ImplementationStakeholderInput,
  type StakeholderCategory, // New type
  type StakeholderImplementationRole, // New type
  // STAKEHOLDER_TYPES, // Deprecated: No longer used for schema/options
  // STAKEHOLDER_ROLES, // Deprecated: No longer used for schema/options
  ENGAGEMENT_LEVELS,
  INFLUENCE_INTEREST_LEVELS,
} from "../types"
import {
  addStakeholderAction,
  updateStakeholderAction,
  type StakeholderActionState,
  getActiveStakeholderCategoriesAction, // New action
  getActiveImplementationRolesAction, // New action
} from "../../dashboard/actions"

const stakeholderFormSchema = z.object({
  stakeholder_name: z.string().min(3, "Name must be at least 3 characters").max(200, "Name is too long"),
  // Updated fields to use IDs
  stakeholder_category_id: z.string().uuid("Invalid category ID").optional().nullable(),
  implementation_role_id: z.string().uuid("Invalid role ID").optional().nullable(),

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

  const [categories, setCategories] = useState<StakeholderCategory[]>([])
  const [roles, setRoles] = useState<StakeholderImplementationRole[]>([])
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true)
  const [dropdownError, setDropdownError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StakeholderFormData>({
    resolver: zodResolver(stakeholderFormSchema),
    defaultValues: {
      // Initialize with empty strings or null for controlled components
      stakeholder_name: "",
      stakeholder_category_id: null,
      implementation_role_id: null,
      contact_person: "",
      email: "",
      phone: "",
      engagement_level: null,
      influence_level: null,
      interest_level: null,
      contribution_summary: "",
      challenges_anticipated: "",
      notes: "",
    },
  })

  useEffect(() => {
    async function fetchDropdownData() {
      setIsLoadingDropdowns(true)
      setDropdownError(null)
      try {
        const [categoriesResult, rolesResult] = await Promise.all([
          getActiveStakeholderCategoriesAction(),
          getActiveImplementationRolesAction(),
        ])

        if (categoriesResult.error) throw new Error(`Categories: ${categoriesResult.error}`)
        setCategories(categoriesResult.categories || [])

        if (rolesResult.error) throw new Error(`Roles: ${rolesResult.error}`)
        setRoles(rolesResult.roles || [])
      } catch (error: any) {
        console.error("Failed to load dropdown data:", error)
        setDropdownError(`Failed to load options: ${error.message}`)
        toast({ title: "Error Loading Options", description: error.message, variant: "destructive" })
      } finally {
        setIsLoadingDropdowns(false)
      }
    }
    fetchDropdownData()
  }, [toast])

  useEffect(() => {
    // Reset form when stakeholder data changes or after initial load
    reset({
      stakeholder_name: stakeholder?.stakeholder_name || "",
      stakeholder_category_id: stakeholder?.stakeholder_category_id || null,
      implementation_role_id: stakeholder?.implementation_role_id || null,
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
      // Prepare data for the action, ensuring correct field names
      const stakeholderInputData: Omit<ImplementationStakeholderInput, "implementation_status_id"> = {
        stakeholder_name: formData.stakeholder_name,
        stakeholder_category_id: formData.stakeholder_category_id || null,
        implementation_role_id: formData.implementation_role_id || null,
        contact_person: formData.contact_person || null,
        email: formData.email || null,
        phone: formData.phone || null,
        engagement_level: formData.engagement_level || null,
        influence_level: formData.influence_level || null,
        interest_level: formData.interest_level || null,
        contribution_summary: formData.contribution_summary || null,
        challenges_anticipated: formData.challenges_anticipated || null,
        notes: formData.notes || null,
        // Ensure old fields are not sent if they are not part of ImplementationStakeholderInput
        // stakeholder_type: undefined, // Explicitly undefined if necessary
        // role_in_implementation: undefined, // Explicitly undefined if necessary
      }

      if (stakeholder?.id) {
        result = await updateStakeholderAction(stakeholder.id, stakeholderInputData)
      } else {
        result = await addStakeholderAction(implementationStatusId, stakeholderInputData)
      }

      if (result.success && result.stakeholderId) {
        toast({ title: stakeholder?.id ? "Stakeholder Updated" : "Stakeholder Added", description: result.message })
        if (onSuccess) onSuccess(result.stakeholderId)
        if (!stakeholder?.id) {
          // Only reset fully for new entries
          reset({
            // Reset to initial empty/null state
            stakeholder_name: "",
            stakeholder_category_id: null,
            implementation_role_id: null,
            contact_person: "",
            email: "",
            phone: "",
            engagement_level: null,
            influence_level: null,
            interest_level: null,
            contribution_summary: "",
            challenges_anticipated: "",
            notes: "",
          })
        }
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    })
  }

  const currentLoading = isPending || isSubmitting || isLoadingDropdowns

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
          {dropdownError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p>{dropdownError}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stakeholder_name">Name (Required)</Label>
              <Input id="stakeholder_name" {...register("stakeholder_name")} disabled={currentLoading} />
              {errors.stakeholder_name && (
                <p className="text-sm text-red-500 mt-1">{errors.stakeholder_name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="stakeholder_category_id">Category</Label>
              <Controller
                name="stakeholder_category_id"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                    disabled={currentLoading || categories.length === 0}
                  >
                    <SelectTrigger id="stakeholder_category_id">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.stakeholder_category_id && (
                <p className="text-sm text-red-500 mt-1">{errors.stakeholder_category_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="implementation_role_id">Role in Implementation</Label>
              <Controller
                name="implementation_role_id"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                    disabled={currentLoading || roles.length === 0}
                  >
                    <SelectTrigger id="implementation_role_id">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.implementation_role_id && (
                <p className="text-sm text-red-500 mt-1">{errors.implementation_role_id.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="engagement_level">Engagement Level</Label>
              <Controller
                name="engagement_level"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={currentLoading}>
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
              <Input id="contact_person" {...register("contact_person")} disabled={currentLoading} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} disabled={currentLoading} />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} disabled={currentLoading} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="influence_level">Influence Level</Label>
              <Controller
                name="influence_level"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={currentLoading}>
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
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={currentLoading}>
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
            <Textarea
              id="contribution_summary"
              {...register("contribution_summary")}
              disabled={currentLoading}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="challenges_anticipated">Challenges Anticipated</Label>
            <Textarea
              id="challenges_anticipated"
              {...register("challenges_anticipated")}
              disabled={currentLoading}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} disabled={currentLoading} rows={2} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={currentLoading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={currentLoading}>
            {currentLoading && !isLoadingDropdowns ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isLoadingDropdowns ? "Loading Options..." : stakeholder?.id ? "Update Stakeholder" : "Add Stakeholder"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

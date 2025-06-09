"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { useTransition } from "react"
import type { OrganizationalUnit, GovernanceTier, OrganizationalUnitInput } from "@/app/governance/types"
import {
  createOrganizationalUnitAction,
  updateOrganizationalUnitAction,
} from "@/app/governance/organizational-units/actions"
import { PERMISSIONS } from "@/app/governance/types"
import { hasPermission } from "@/app/governance/rbac"

const ouFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters.").max(255),
  tier_id: z.coerce.number().int().positive("Governance Tier is required."),
  parent_ou_id: z.string().uuid("Invalid Parent OU ID.").nullable().optional(),
  region_code: z.string().max(50).optional().nullable(),
  contact_email: z.string().email("Invalid email address.").optional().nullable(),
  contact_phone: z.string().max(50).optional().nullable(),
  address: z.string().max(1000).optional().nullable(),
  // metadata: z.record(z.any()).optional().nullable(), // For simplicity, metadata is not in the form yet
})

export type OUFormValues = z.infer<typeof ouFormSchema>

interface OUFormProps {
  tiers: GovernanceTier[]
  allOUs: OrganizationalUnit[] // For parent OU selection
  initialData?: OrganizationalUnit | null
  onSuccess: () => void
  onCancel: () => void
  userId: string | null // For permission check
}

export function OUForm({ tiers, allOUs, initialData, onSuccess, onCancel, userId }: OUFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<OUFormValues>({
    resolver: zodResolver(ouFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      tier_id: initialData?.tier_id || undefined,
      parent_ou_id: initialData?.parent_ou_id || null,
      region_code: initialData?.region_code || "",
      contact_email: initialData?.contact_email || "",
      contact_phone: initialData?.contact_phone || "",
      address: initialData?.address || "",
    },
  })

  const onSubmit = async (values: OUFormValues) => {
    if (!userId) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" })
      return
    }

    const canManage = await hasPermission({ userId, permissionString: PERMISSIONS.OUS_MANAGE })
    if (!canManage) {
      toast({ title: "Permission Denied", description: "You cannot create or update OUs.", variant: "destructive" })
      return
    }

    const ouInput: OrganizationalUnitInput = {
      name: values.name,
      tier_id: values.tier_id,
      parent_ou_id: values.parent_ou_id || null, // Ensure null if empty string
      region_code: values.region_code || null,
      contact_email: values.contact_email || null,
      contact_phone: values.contact_phone || null,
      address: values.address || null,
      metadata: initialData?.metadata || null, // Preserve existing metadata if any
    }

    startTransition(async () => {
      let result
      if (initialData) {
        result = await updateOrganizationalUnitAction(initialData.id, ouInput)
      } else {
        result = await createOrganizationalUnitAction(ouInput)
      }

      if (result.success) {
        toast({ title: "Success", description: result.message })
        onSuccess()
      } else {
        toast({
          title: "Error",
          description: result.error || (initialData ? "Failed to update OU." : "Failed to create OU."),
          variant: "destructive",
        })
      }
    })
  }

  const selectedTierId = form.watch("tier_id")
  const selectedTier = tiers.find((t) => t.id === selectedTierId)

  // Filter potential parent OUs: must be from a tier with a lower level_order (i.e., higher in hierarchy)
  // than the currently selected tier for the OU being created/edited.
  const potentialParentOUs = selectedTier
    ? allOUs.filter((ou) => {
        const parentTier = tiers.find((t) => t.id === ou.tier_id)
        return parentTier && parentTier.level_order < selectedTier.level_order
      })
    : []

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>OU Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Ministry of Education, State Dept. of School Education" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tier_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Governance Tier</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tier" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tiers.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id.toString()}>
                      {tier.name} (Level {tier.level_order})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedTierId && (
          <FormField
            control={form.control}
            name="parent_ou_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent OU (Optional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || ""}
                  disabled={potentialParentOUs.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          potentialParentOUs.length > 0 ? "Select a parent OU" : "No eligible parent OUs for this tier"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">
                      <em>None (Root for its hierarchy within this tier or global root)</em>
                    </SelectItem>
                    {potentialParentOUs.map((ou) => (
                      <SelectItem key={ou.id} value={ou.id}>
                        {ou.name} ({tiers.find((t) => t.id === ou.tier_id)?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Select a parent OU from a higher governance tier.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="region_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Region Code (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., State Code, District Code" {...field} value={field.value || ""} />
              </FormControl>
              <FormDescription>
                Unique code for the region if applicable (e.g., state code, district LGD code).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Email (Optional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="ou-contact@example.com" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Phone (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="+91-XXX-XXXXXXX" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Full address of the OU office" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (initialData ? "Saving..." : "Creating...") : initialData ? "Save Changes" : "Create OU"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

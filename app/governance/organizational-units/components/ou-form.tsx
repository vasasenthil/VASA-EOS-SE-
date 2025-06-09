"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation" // For client-side navigation if needed
import { useEffect, useState, useTransition } from "react"

import type { OrganizationalUnit, GovernanceTier, OrganizationalUnitInput } from "../../types"
import { createOrganizationalUnitAction, updateOrganizationalUnitAction } from "../actions"

const ouFormSchema = z.object({
  name: z.string().min(3, { message: "OU Name must be at least 3 characters." }).max(100),
  tier_id: z.coerce.number({ required_error: "Governance Tier is required." }),
  parent_ou_id: z.string().uuid().nullable().optional(),
  region_code: z.string().max(50).optional().nullable(),
  contact_email: z.string().email({ message: "Invalid email address." }).optional().nullable(),
  contact_phone: z.string().max(20).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  // metadata: z.record(z.any()).optional().nullable(), // For simplicity, handling metadata as JSON string for now
  metadata_json: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true
        try {
          JSON.parse(val)
          return true
        } catch (e) {
          return false
        }
      },
      { message: "Invalid JSON format for metadata." },
    )
    .nullable(),
})

type OUFormValues = z.infer<typeof ouFormSchema>

interface OUFormProps {
  initialData?: OrganizationalUnit | null
  tiers: GovernanceTier[]
  allOUs: OrganizationalUnit[] // For parent OU selection
  userId: string // For client-side permission check (UX)
  canManage: boolean // Pre-checked permission from server
}

export function OUForm({ initialData, tiers, allOUs, userId, canManage }: OUFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedTierId, setSelectedTierId] = useState<number | undefined>(initialData?.tier_id)
  const [filteredParentOUs, setFilteredParentOUs] = useState<OrganizationalUnit[]>([])

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
      metadata_json: initialData?.metadata ? JSON.stringify(initialData.metadata, null, 2) : "",
    },
  })

  useEffect(() => {
    if (selectedTierId) {
      const currentTier = tiers.find((t) => t.id === selectedTierId)
      if (currentTier) {
        // Parent OUs should be from a tier with a lower level_order (i.e., higher in hierarchy)
        const parentTiers = tiers.filter((t) => t.level_order < currentTier.level_order)
        const parentTierIds = parentTiers.map((t) => t.id)
        setFilteredParentOUs(allOUs.filter((ou) => parentTierIds.includes(ou.tier_id)))
      } else {
        setFilteredParentOUs([])
      }
    } else {
      setFilteredParentOUs([])
    }
  }, [selectedTierId, tiers, allOUs])

  const onSubmit = async (values: OUFormValues) => {
    if (!canManage) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to perform this action.",
        variant: "destructive",
      })
      return
    }

    // Client-side check (UX enhancement, server is authoritative)
    // const hasManagePermission = await hasPermission({ userId, permissionString: PERMISSIONS.OUS_MANAGE });
    // if (!hasManagePermission) {
    //   toast({ title: "Permission Denied", description: "You do not have permission to manage OUs.", variant: "destructive" });
    //   return;
    // }

    const ouInputData: OrganizationalUnitInput = {
      name: values.name,
      tier_id: values.tier_id,
      parent_ou_id: values.parent_ou_id || null,
      region_code: values.region_code || null,
      contact_email: values.contact_email || null,
      contact_phone: values.contact_phone || null,
      address: values.address || null,
      metadata: values.metadata_json ? JSON.parse(values.metadata_json) : null,
    }

    startTransition(async () => {
      let result
      if (initialData) {
        result = await updateOrganizationalUnitAction(initialData.id, ouInputData)
      } else {
        result = await createOrganizationalUnitAction(ouInputData)
      }

      if (result.success) {
        toast({
          title: initialData ? "OU Updated" : "OU Created",
          description: result.message,
        })
        // Server action should handle redirection. If not, uncomment and use:
        // router.push("/governance/organizational-units");
        // router.refresh(); // To ensure fresh data on the list page
      } else {
        toast({
          title: "Error",
          description: result.message || "An unexpected error occurred.",
          variant: "destructive",
        })
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, message]) => {
            form.setError(field as keyof OUFormValues, { type: "manual", message })
          })
        }
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organizational Unit Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., National Ministry of Education" {...field} />
              </FormControl>
              <FormDescription>The official name of the organizational unit.</FormDescription>
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
              <Select
                onValueChange={(value) => {
                  field.onChange(Number(value))
                  setSelectedTierId(Number(value))
                }}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a governance tier" />
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
              <FormDescription>Assign this OU to a governance tier.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parent_ou_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent Organizational Unit (Optional)</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "null" ? null : value)}
                defaultValue={field.value || "null"}
                disabled={!selectedTierId || filteredParentOUs.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parent OU" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="null">No Parent (Root Level for this branch)</SelectItem>
                  {filteredParentOUs.map((ou) => (
                    <SelectItem key={ou.id} value={ou.id}>
                      {ou.name} ({ou.tier?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select a parent OU if this unit reports to another. Parents must be from a higher tier.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="region_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Region Code (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., NDL, MH, UP" {...field} value={field.value || ""} />
              </FormControl>
              <FormDescription>A code for the region, if applicable (e.g., state code, district code).</FormDescription>
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
                <Input type="email" placeholder="e.g., contact@education.gov.in" {...field} value={field.value || ""} />
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
                <Input placeholder="e.g., +91-11-12345678" {...field} value={field.value || ""} />
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
                <Textarea placeholder="Full address of the organizational unit" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="metadata_json"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Metadata (JSON format, Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='e.g., { "established_year": 1980, "head_office": "New Delhi" }'
                  {...field}
                  value={field.value || ""}
                  rows={5}
                />
              </FormControl>
              <FormDescription>Enter any additional structured data as a valid JSON object.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending || !canManage}>
          {isPending ? (initialData ? "Updating..." : "Creating...") : initialData ? "Save Changes" : "Create OU"}
        </Button>
        {!canManage && <p className="text-sm text-destructive mt-2">You do not have permission to manage OUs.</p>}
      </form>
    </Form>
  )
}

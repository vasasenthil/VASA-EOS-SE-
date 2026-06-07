// VASA-EOS(SE) — cook-cum-helper management (PM POSHAN kitchen staff).
// Register MDM kitchen staff, mark daily presence, total honoraria. Pure logic.

export type CookRole = "Cook" | "Helper" | "Cook-cum-Helper"

export const COOK_ROLES: CookRole[] = ["Cook", "Helper", "Cook-cum-Helper"]

export interface Cook {
  id: string
  name: string
  role: CookRole
  honorarium: number
  present: boolean
  /** Tenant node this cook-cum-helper belongs to — drives per-role data scoping. */
  tenantId: string
}

export interface CookSummary {
  total: number
  present: number
  absent: number
  honorariumTotal: number
}

export function cookSummary(cooks: Cook[]): CookSummary {
  return {
    total: cooks.length,
    present: cooks.filter((c) => c.present).length,
    absent: cooks.filter((c) => !c.present).length,
    honorariumTotal: cooks.reduce((sum, c) => sum + c.honorarium, 0),
  }
}

export function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`
}

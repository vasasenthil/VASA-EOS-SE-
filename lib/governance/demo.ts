// VASA-EOS(SE) — representative demo data for the governance admin pages, shown in the
// walkthrough (no database, or NEXT_PUBLIC_DEMO_MODE=true with an empty database) so the
// Organizational Units, Governance Tiers and Roles pages are never blank. Pure, typed.

import type { GovernanceTier, OrganizationalUnit, Role } from "@/app/governance/types"

const NOW = "2026-04-01T00:00:00.000Z"

export function demoTiers(): GovernanceTier[] {
  const names = ["National", "State", "Directorate", "District", "Block", "Cluster", "School"]
  return names.map((name, i) => ({ id: i + 1, name, level_order: i + 1, description: `${name} tier`, created_at: NOW, updated_at: NOW }))
}

export function demoOrganizationalUnits(): OrganizationalUnit[] {
  const tiers = demoTiers()
  const tierId = (name: string) => tiers.find((t) => t.name === name)?.id ?? 1
  const mk = (id: string, name: string, tier: string, parent: string | null, region: string): OrganizationalUnit => ({
    id, name, tier_id: tierId(tier), parent_ou_id: parent, region_code: region, created_at: NOW, updated_at: NOW,
    tier: tiers.find((t) => t.id === tierId(tier)),
  })
  return [
    mk("ou-tn", "Tamil Nadu", "State", null, "TN"),
    mk("ou-dse", "Directorate of School Education", "Directorate", "ou-tn", "TN-DSE"),
    mk("ou-chn", "Chennai", "District", "ou-dse", "TN-CHN"),
    mk("ou-cbe", "Coimbatore", "District", "ou-dse", "TN-CBE"),
    mk("ou-chn-b1", "Egmore Block", "Block", "ou-chn", "TN-CHN-B1"),
    mk("ou-chn-b1-c1", "Egmore Cluster 1", "Cluster", "ou-chn-b1", "TN-CHN-B1-C1"),
    mk("ou-chn-b1-s1", "GHSS Egmore", "School", "ou-chn-b1-c1", "TN-CHN-B1-S1"),
    mk("ou-chn-b1-s2", "GGHSS Egmore", "School", "ou-chn-b1-c1", "TN-CHN-B1-S2"),
  ]
}

export function demoRoles(): Role[] {
  const mk = (id: string, name: string, desc: string, system: boolean, perms: number, users: number): Role => ({
    id, name, description: desc, is_system_role: system, created_at: NOW, updated_at: NOW, permissions_count: perms, assigned_user_count: users,
  })
  return [
    mk("role-admin", "ADMIN", "Platform administrator (full access)", true, 48, 3),
    mk("role-secretary", "SECRETARY", "Secretary, School Education (State)", true, 22, 1),
    mk("role-director", "DIRECTOR", "State Director (Directorate)", true, 20, 7),
    mk("role-deo", "DEO", "District Education Officer", true, 16, 38),
    mk("role-beo", "BEO", "Block Education Officer", true, 14, 385),
    mk("role-principal", "PRINCIPAL", "Headmaster / Principal", true, 18, 12000),
    mk("role-teacher", "TEACHER", "Teacher", true, 8, 240000),
    mk("role-parent", "PARENT", "Parent / Guardian", true, 4, 1270000),
  ]
}

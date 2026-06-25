// VASA-EOS(SE) — WCAG 2.1 conformance register (brochure: "WCAG 2.1 AAA across all routes").
//
// An honest, per-success-criterion map of WCAG 2.1 (A · AA · AAA) to HOW the platform meets
// it and by what METHOD it is assured:
//   - "automated"  — machine-verified by the in-repo a11y audit (scanA11y, CI-enforced)
//   - "design"     — guaranteed by the design system / component primitives (tokens, shadcn/ui)
//   - "audit"      — requires manual / assistive-technology verification a static check cannot do
// Status is recorded truthfully: "pass" only for automated/design criteria genuinely met;
// AAA criteria that need human/AT verification are "audit-required", NOT claimed as passing.
// This is the honest answer to the AAA claim — the conformance map, with the gap disclosed.

import { csvField } from "@/lib/csv"

export type WcagLevel = "A" | "AA" | "AAA"
export type WcagPrinciple = "Perceivable" | "Operable" | "Understandable" | "Robust"
export type ConformanceMethod = "automated" | "design" | "audit"
export type ConformanceStatus = "pass" | "partial" | "audit-required"

export interface WcagCriterion {
  sc: string
  level: WcagLevel
  principle: WcagPrinciple
  name: string
  /** How the platform addresses it. */
  how: string
  method: ConformanceMethod
  status: ConformanceStatus
}

export const WCAG_CRITERIA: WcagCriterion[] = [
  // Perceivable
  { sc: "1.1.1", level: "A", principle: "Perceivable", name: "Non-text Content", how: "Images require alt text; icons are decorative/aria-hidden or labelled.", method: "automated", status: "pass" },
  { sc: "1.3.1", level: "A", principle: "Perceivable", name: "Info and Relationships", how: "Semantic HTML + shadcn/ui primitives (Table, Label, headings).", method: "design", status: "pass" },
  { sc: "1.3.5", level: "AA", principle: "Perceivable", name: "Identify Input Purpose", how: "Inputs use type/autoComplete-friendly fields.", method: "design", status: "pass" },
  { sc: "1.4.3", level: "AA", principle: "Perceivable", name: "Contrast (Minimum) 4.5:1", how: "Theme tokens target ≥ 4.5:1 in light and dark.", method: "design", status: "pass" },
  { sc: "1.4.6", level: "AAA", principle: "Perceivable", name: "Contrast (Enhanced) 7:1", how: "Foreground/background tokens aim for 7:1; needs measured verification per route.", method: "audit", status: "audit-required" },
  { sc: "1.4.8", level: "AAA", principle: "Perceivable", name: "Visual Presentation", how: "Readable line-length/spacing; user can override via system zoom.", method: "audit", status: "audit-required" },
  { sc: "1.4.10", level: "AA", principle: "Perceivable", name: "Reflow", how: "Responsive Tailwind layouts reflow to 320px.", method: "design", status: "pass" },
  { sc: "1.4.12", level: "AA", principle: "Perceivable", name: "Text Spacing", how: "Relative units; no fixed-height text containers.", method: "design", status: "pass" },

  // Operable
  { sc: "2.1.1", level: "A", principle: "Operable", name: "Keyboard", how: "Interactive elements are native buttons/links/inputs — keyboard-operable.", method: "design", status: "pass" },
  { sc: "2.4.3", level: "A", principle: "Operable", name: "Focus Order", how: "No positive tabIndex; DOM order matches reading order.", method: "automated", status: "pass" },
  { sc: "2.4.4", level: "A", principle: "Operable", name: "Link Purpose (In Context)", how: "Links carry descriptive text, not bare “click here”.", method: "design", status: "pass" },
  { sc: "2.4.7", level: "AA", principle: "Operable", name: "Focus Visible", how: "Focus-visible rings via the design system.", method: "design", status: "pass" },
  { sc: "2.4.9", level: "AAA", principle: "Operable", name: "Link Purpose (Link Only)", how: "Most links self-describe; a few rely on context — needs review.", method: "audit", status: "audit-required" },
  { sc: "2.4.10", level: "AAA", principle: "Operable", name: "Section Headings", how: "Pages use heading structure; full heading-outline review pending.", method: "audit", status: "audit-required" },
  { sc: "2.5.3", level: "A", principle: "Operable", name: "Label in Name", how: "Visible labels match accessible names on controls.", method: "design", status: "pass" },
  { sc: "2.5.5", level: "AAA", principle: "Operable", name: "Target Size", how: "Buttons use ≥ 44px touch targets by default; needs per-control verification.", method: "audit", status: "audit-required" },

  // Understandable
  { sc: "3.1.1", level: "A", principle: "Understandable", name: "Language of Page", how: "html lang is set; i18n drives per-language content.", method: "design", status: "pass" },
  { sc: "3.1.2", level: "AA", principle: "Understandable", name: "Language of Parts", how: "Multilingual content carries language metadata via i18n.", method: "design", status: "partial" },
  { sc: "3.1.5", level: "AAA", principle: "Understandable", name: "Reading Level", how: "Plain-language intent; lower-secondary reading level not yet measured.", method: "audit", status: "audit-required" },
  { sc: "3.2.3", level: "AA", principle: "Understandable", name: "Consistent Navigation", how: "Shared Shell + portal nav across routes.", method: "design", status: "pass" },
  { sc: "3.2.4", level: "AA", principle: "Understandable", name: "Consistent Identification", how: "Reused components keep consistent labels/icons.", method: "design", status: "pass" },
  { sc: "3.2.5", level: "AAA", principle: "Understandable", name: "Change on Request", how: "No auto new-windows without rel; no surprise context changes.", method: "automated", status: "pass" },
  { sc: "3.3.1", level: "A", principle: "Understandable", name: "Error Identification", how: "Forms show inline, text error messages (not colour alone).", method: "design", status: "pass" },
  { sc: "3.3.2", level: "A", principle: "Understandable", name: "Labels or Instructions", how: "Every input has a Label; placeholders are not sole labels.", method: "design", status: "pass" },

  // Robust
  { sc: "4.1.2", level: "A", principle: "Robust", name: "Name, Role, Value", how: "Native elements + shadcn/ui (Radix) expose correct roles/states.", method: "design", status: "pass" },
  { sc: "4.1.3", level: "AA", principle: "Robust", name: "Status Messages", how: "Live/“Live” badges and toasts convey status; full aria-live sweep pending.", method: "audit", status: "audit-required" },
]

export const WCAG_LEVELS: WcagLevel[] = ["A", "AA", "AAA"]
export const WCAG_PRINCIPLES: WcagPrinciple[] = ["Perceivable", "Operable", "Understandable", "Robust"]

export function byLevel(level: WcagLevel, items: WcagCriterion[] = WCAG_CRITERIA): WcagCriterion[] {
  return items.filter((c) => c.level === level)
}

export function byPrinciple(principle: WcagPrinciple, items: WcagCriterion[] = WCAG_CRITERIA): WcagCriterion[] {
  return items.filter((c) => c.principle === principle)
}

export interface LevelConformance {
  level: WcagLevel
  total: number
  pass: number
  auditRequired: number
  /** % of this level's criteria met automatically or by design (not audit-pending). */
  metPct: number
}

export function levelConformance(items: WcagCriterion[] = WCAG_CRITERIA): LevelConformance[] {
  return WCAG_LEVELS.map((level) => {
    const at = items.filter((c) => c.level === level)
    const pass = at.filter((c) => c.status === "pass").length
    const auditRequired = at.filter((c) => c.status === "audit-required").length
    return { level, total: at.length, pass, auditRequired, metPct: at.length ? Math.round((pass / at.length) * 100) : 0 }
  })
}

export function toCSV(items: WcagCriterion[] = WCAG_CRITERIA): string {
  const header = ["SC", "Level", "Principle", "Name", "How addressed", "Method", "Status"]
  const rows = items.map((c) => [c.sc, c.level, c.principle, c.name, c.how, c.method, c.status].map(csvField).join(","))
  return [header.map(csvField).join(","), ...rows].join("\n")
}

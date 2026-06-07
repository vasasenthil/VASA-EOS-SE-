// Glossary — Abbreviations & Expansions used across the VASA-EOS(SE) Tamil Nadu
// platform. Pure, client-safe data + helpers (no imports, no side effects) so it can
// be consumed by both server pages and client boards.

export type GlossaryCategory =
  | "Policy & Governance"
  | "Identity & Data"
  | "Schemes & Welfare"
  | "Roles & Hierarchy"
  | "Academic & Assessment"
  | "Health, Safety & Welfare"
  | "Technology & Platform"
  | "Infrastructure & Records"

export interface GlossaryEntry {
  /** The abbreviation / acronym as displayed (e.g. "APAAR"). */
  abbr: string
  /** The full expansion. */
  expansion: string
  category: GlossaryCategory
  /** Optional one-line clarification of what it means in context. */
  note?: string
}

// Curated, ordered alphabetically within each category for auditability. Every acronym
// surfaced anywhere in the platform UI should have an entry here.
export const GLOSSARY: GlossaryEntry[] = [
  // Policy & Governance
  { abbr: "CBSE", expansion: "Central Board of Secondary Education", category: "Policy & Governance" },
  { abbr: "DEE", expansion: "Directorate of Elementary Education", category: "Policy & Governance" },
  { abbr: "DSE", expansion: "Directorate of School Education", category: "Policy & Governance" },
  { abbr: "NCERT", expansion: "National Council of Educational Research and Training", category: "Policy & Governance" },
  { abbr: "NEP", expansion: "National Education Policy 2020", category: "Policy & Governance", note: "The reform framework this platform operationalises." },
  { abbr: "PAB", expansion: "Project Approval Board", category: "Policy & Governance" },
  { abbr: "RTE", expansion: "Right of Children to Free and Compulsory Education Act, 2009", category: "Policy & Governance", note: "Commonly 'Right to Education'." },
  { abbr: "RTI", expansion: "Right to Information Act, 2005", category: "Policy & Governance" },
  { abbr: "SCERT", expansion: "State Council of Educational Research and Training", category: "Policy & Governance" },
  { abbr: "SDP", expansion: "School Development Plan", category: "Policy & Governance" },
  { abbr: "SMC", expansion: "School Management Committee", category: "Policy & Governance", note: "Statutory community oversight body per the RTE Act." },
  { abbr: "SSA", expansion: "Samagra Shiksha Abhiyan", category: "Policy & Governance" },

  // Identity & Data
  { abbr: "ABC", expansion: "Academic Bank of Credits", category: "Identity & Data" },
  { abbr: "Aadhaar", expansion: "Aadhaar — 12-digit unique identity number (UIDAI)", category: "Identity & Data" },
  { abbr: "APAAR", expansion: "Automated Permanent Academic Account Registry", category: "Identity & Data", note: "The 'One Nation, One Student ID' lifelong learner identity." },
  { abbr: "DBT", expansion: "Direct Benefit Transfer", category: "Identity & Data" },
  { abbr: "EMIS", expansion: "Education Management Information System", category: "Identity & Data" },
  { abbr: "HPC", expansion: "Holistic Progress Card", category: "Identity & Data", note: "NEP competency-based 360° learner report." },
  { abbr: "KYC", expansion: "Know Your Customer", category: "Identity & Data" },
  { abbr: "PEN", expansion: "Permanent Education Number", category: "Identity & Data" },
  { abbr: "SIS", expansion: "Student Information System", category: "Identity & Data" },
  { abbr: "UDISE+", expansion: "Unified District Information System for Education Plus", category: "Identity & Data" },

  // Schemes & Welfare
  { abbr: "CMBS", expansion: "Chief Minister's Breakfast Scheme", category: "Schemes & Welfare" },
  { abbr: "MDM", expansion: "Mid-Day Meal Scheme", category: "Schemes & Welfare" },
  { abbr: "NM", expansion: "Naan Mudhalvan", category: "Schemes & Welfare", note: "Tamil Nadu skilling & career-readiness initiative." },
  { abbr: "PM POSHAN", expansion: "Pradhan Mantri Poshan Shakti Nirman", category: "Schemes & Welfare", note: "Centrally-sponsored school nutrition scheme (formerly Mid-Day Meal)." },

  // Roles & Hierarchy
  { abbr: "AEO", expansion: "Assistant Educational Officer", category: "Roles & Hierarchy" },
  { abbr: "BEO", expansion: "Block Educational Officer", category: "Roles & Hierarchy" },
  { abbr: "BRC", expansion: "Block Resource Centre", category: "Roles & Hierarchy" },
  { abbr: "CEO", expansion: "Chief Educational Officer (District)", category: "Roles & Hierarchy" },
  { abbr: "CRC", expansion: "Cluster Resource Centre", category: "Roles & Hierarchy" },
  { abbr: "CRCC", expansion: "Cluster Resource Centre Coordinator", category: "Roles & Hierarchy" },
  { abbr: "DEO", expansion: "District Educational Officer", category: "Roles & Hierarchy" },
  { abbr: "HM", expansion: "Head Master / Head Mistress", category: "Roles & Hierarchy" },

  // Academic & Assessment
  { abbr: "CCE", expansion: "Continuous and Comprehensive Evaluation", category: "Academic & Assessment" },
  { abbr: "CPD", expansion: "Continuous Professional Development", category: "Academic & Assessment" },
  { abbr: "ECCE", expansion: "Early Childhood Care and Education", category: "Academic & Assessment" },
  { abbr: "FLN", expansion: "Foundational Literacy and Numeracy", category: "Academic & Assessment", note: "Target of the NIPUN Bharat mission." },
  { abbr: "NAS", expansion: "National Achievement Survey", category: "Academic & Assessment" },
  { abbr: "OMR", expansion: "Optical Mark Recognition", category: "Academic & Assessment" },
  { abbr: "PTM", expansion: "Parent-Teacher Meeting", category: "Academic & Assessment" },
  { abbr: "SLAS", expansion: "State Learning Achievement Survey", category: "Academic & Assessment" },

  // Health, Safety & Welfare
  { abbr: "CCTV", expansion: "Closed-Circuit Television", category: "Health, Safety & Welfare" },
  { abbr: "CWSN", expansion: "Children With Special Needs", category: "Health, Safety & Welfare" },
  { abbr: "NCC", expansion: "National Cadet Corps", category: "Health, Safety & Welfare" },
  { abbr: "NSS", expansion: "National Service Scheme", category: "Health, Safety & Welfare" },
  { abbr: "OoSC", expansion: "Out-of-School Children", category: "Health, Safety & Welfare" },
  { abbr: "POCSO", expansion: "Protection of Children from Sexual Offences Act, 2012", category: "Health, Safety & Welfare" },
  { abbr: "RBSK", expansion: "Rashtriya Bal Swasthya Karyakram", category: "Health, Safety & Welfare", note: "Child health screening & early intervention." },
  { abbr: "WASH", expansion: "Water, Sanitation and Hygiene", category: "Health, Safety & Welfare" },

  // Technology & Platform
  { abbr: "ABAC", expansion: "Attribute-Based Access Control", category: "Technology & Platform" },
  { abbr: "AI", expansion: "Artificial Intelligence", category: "Technology & Platform" },
  { abbr: "API", expansion: "Application Programming Interface", category: "Technology & Platform" },
  { abbr: "EOS", expansion: "Education Operating System", category: "Technology & Platform", note: "The 'EOS' in VASA-EOS(SE)." },
  { abbr: "ESG", expansion: "Environmental, Social and Governance", category: "Technology & Platform" },
  { abbr: "ICT", expansion: "Information and Communication Technology", category: "Technology & Platform" },
  { abbr: "IVR", expansion: "Interactive Voice Response", category: "Technology & Platform" },
  { abbr: "KPI", expansion: "Key Performance Indicator", category: "Technology & Platform" },
  { abbr: "MFA", expansion: "Multi-Factor Authentication", category: "Technology & Platform" },
  { abbr: "ML", expansion: "Machine Learning", category: "Technology & Platform" },
  { abbr: "OTel", expansion: "OpenTelemetry", category: "Technology & Platform" },
  { abbr: "PDP", expansion: "Policy Decision Point", category: "Technology & Platform", note: "The access-control engine that authorises every guarded write." },
  { abbr: "RBAC", expansion: "Role-Based Access Control", category: "Technology & Platform" },
  { abbr: "SIEM", expansion: "Security Information and Event Management", category: "Technology & Platform" },
  { abbr: "SLA", expansion: "Service Level Agreement", category: "Technology & Platform" },
  { abbr: "SSO", expansion: "Single Sign-On", category: "Technology & Platform" },
  { abbr: "VASA-EOS(SE)", expansion: "VASA Education Operating System (School Education)", category: "Technology & Platform", note: "This platform." },

  // Infrastructure & Records
  { abbr: "DR", expansion: "Disaster Recovery", category: "Infrastructure & Records" },
  { abbr: "SDC", expansion: "State Data Centre", category: "Infrastructure & Records" },
  { abbr: "TC", expansion: "Transfer Certificate", category: "Infrastructure & Records" },
  { abbr: "TN", expansion: "Tamil Nadu", category: "Infrastructure & Records" },
]

// All categories in display order (derived once from the dataset, order-preserving).
export const GLOSSARY_CATEGORIES: GlossaryCategory[] = (() => {
  const seen: GlossaryCategory[] = []
  for (const e of GLOSSARY) if (!seen.includes(e.category)) seen.push(e.category)
  return seen
})()

/** Case-insensitive search across abbreviation, expansion and note. */
export function searchGlossary(query: string, entries: GlossaryEntry[] = GLOSSARY): GlossaryEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return entries
  return entries.filter(
    (e) =>
      e.abbr.toLowerCase().includes(q) ||
      e.expansion.toLowerCase().includes(q) ||
      (e.note?.toLowerCase().includes(q) ?? false),
  )
}

/** Filter to a single category (or all when category is falsy). */
export function filterByCategory(
  category: GlossaryCategory | "" | undefined,
  entries: GlossaryEntry[] = GLOSSARY,
): GlossaryEntry[] {
  if (!category) return entries
  return entries.filter((e) => e.category === category)
}

/** Group entries by category, preserving category display order. */
export function groupByCategory(entries: GlossaryEntry[] = GLOSSARY): Array<{ category: GlossaryCategory; entries: GlossaryEntry[] }> {
  return GLOSSARY_CATEGORIES.map((category) => ({
    category,
    entries: entries.filter((e) => e.category === category),
  })).filter((g) => g.entries.length > 0)
}

/** Entries sorted alphabetically by abbreviation (case-insensitive). */
export function sortByAbbr(entries: GlossaryEntry[] = GLOSSARY): GlossaryEntry[] {
  return [...entries].sort((a, b) => a.abbr.toLowerCase().localeCompare(b.abbr.toLowerCase()))
}

/** Look up a single entry by its abbreviation (case-insensitive). */
export function lookup(abbr: string, entries: GlossaryEntry[] = GLOSSARY): GlossaryEntry | undefined {
  const q = abbr.trim().toLowerCase()
  return entries.find((e) => e.abbr.toLowerCase() === q)
}

export interface GlossaryQuery {
  q?: string
  category?: GlossaryCategory | ""
}

/** Compose category filter then text search — the backing logic for the JSON API. */
export function queryGlossary(params: GlossaryQuery = {}, entries: GlossaryEntry[] = GLOSSARY): GlossaryEntry[] {
  return sortByAbbr(searchGlossary(params.q ?? "", filterByCategory(params.category, entries)))
}

/** Escape a single CSV field per RFC 4180 (quote when it contains ," or newline). */
function csvField(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** Render entries as RFC 4180 CSV with a header row — for offline/field-office use. */
export function toCSV(entries: GlossaryEntry[] = GLOSSARY): string {
  const header = ["Abbreviation", "Expansion", "Category", "Note"]
  const rows = entries.map((e) => [e.abbr, e.expansion, e.category, e.note ?? ""].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}

export interface GlossarySummary {
  total: number
  categories: number
  withNotes: number
}

export function glossarySummary(entries: GlossaryEntry[] = GLOSSARY): GlossarySummary {
  return {
    total: entries.length,
    categories: new Set(entries.map((e) => e.category)).size,
    withNotes: entries.filter((e) => e.note).length,
  }
}

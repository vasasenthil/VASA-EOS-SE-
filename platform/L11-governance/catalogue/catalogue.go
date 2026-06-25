// Package modulecatalogue is the L11 register of the 391 functional modules (Cover Brief: "391 modules — 329
// core + 62 TN-specific"). Like the TS Unified Module Catalogue it represents, this is an honest *catalogue*:
// the modules are grouped into families across the seven operational tiers (National → School) plus a
// cross-cutting Platform tier, each family carrying its module count, scope (core vs TN-specific) and an
// honest build status. The headline figures are COMPUTED from the families (core=329, TN=62, total=391) and
// asserted by the test, so the register cannot drift from its own claim. Pure + stdlib-only.
package modulecatalogue

// Headline figures (Cover Brief).
const (
	CoreTotal  = 329
	TNTotal    = 62
	GrandTotal = 391
)

// Status is a family's honest build posture.
type Status string

const (
	Built   Status = "built"
	Partial Status = "partial"
	Pending Status = "pending"
)

// Scope distinguishes core (pan-platform) from TN-specific modules.
type Scope string

const (
	Core Scope = "core"
	TN   Scope = "tn"
)

// Family is a group of related functional modules at one operational tier.
type Family struct {
	Tier   string `json:"tier"`
	Name   string `json:"name"`
	Count  int    `json:"count"`
	Scope  Scope  `json:"scope"`
	Status Status `json:"status"`
}

// Families returns the catalogue grouped into module families. Counts sum to 329 core + 62 TN = 391.
func Families() []Family {
	return []Family{
		// ── Platform (cross-cutting, core) — 64 ──
		{"Platform", "Identity & Access", 8, Core, Built},
		{"Platform", "Workflow & BPMN", 6, Core, Built},
		{"Platform", "Notification & Comms", 6, Core, Built},
		{"Platform", "Content & Search", 6, Core, Built},
		{"Platform", "Audit & Compliance", 8, Core, Built},
		{"Platform", "Config & Feature Flags", 4, Core, Partial},
		{"Platform", "i18n & Localisation", 4, Core, Built},
		{"Platform", "Observability & SRE", 6, Core, Built},
		{"Platform", "Data Fabric & MDM", 8, Core, Built},
		{"Platform", "Security & Policy", 8, Core, Built},
		// ── National / India-Stack (core) — 12 ──
		{"National", "India-Stack DPI adapters", 12, Core, Partial},
		// ── State (core) — 54 ──
		{"State", "Governance & Secretariat", 18, Core, Built},
		{"State", "Welfare & Schemes", 14, Core, Built},
		{"State", "Finance & Procurement", 12, Core, Built},
		{"State", "Analytics & Dashboards", 10, Core, Built},
		// ── Directorate (core) — 40 ──
		{"Directorate", "Academic Standards (SCERT)", 12, Core, Built},
		{"Directorate", "Examinations (DGE)", 10, Core, Built},
		{"Directorate", "Teacher Education (DTERT)", 10, Core, Built},
		{"Directorate", "Private/Matriculation Regulation", 8, Core, Partial},
		// ── District (core) — 36 ──
		{"District", "District Administration", 14, Core, Built},
		{"District", "Monitoring & Inspection", 12, Core, Built},
		{"District", "Grievance & Field Ops", 10, Core, Built},
		// ── Block (core) — 30 ──
		{"Block", "Block Operations", 12, Core, Built},
		{"Block", "School Support", 10, Core, Built},
		{"Block", "Field Visits", 8, Core, Built},
		// ── Cluster (core) — 18 ──
		{"Cluster", "Cluster Coordination", 10, Core, Built},
		{"Cluster", "Peer Support", 8, Core, Built},
		// ── School (core) — 75 ──
		{"School", "Student Lifecycle", 16, Core, Built},
		{"School", "Teaching & Learning", 14, Core, Built},
		{"School", "Assessment & Exams", 12, Core, Built},
		{"School", "Co-curricular & Sports", 8, Core, Built},
		{"School", "Infrastructure & Assets", 8, Core, Built},
		{"School", "Library & Labs", 6, Core, Built},
		{"School", "Safety & Wellbeing", 11, Core, Built},

		// ── TN-specific — 62 ──
		{"State", "TN Welfare Schemes (Pudhumai Penn, MMSN, CMBS…)", 12, TN, Built},
		{"State", "TN Government-Order Engine", 10, TN, Built},
		{"State", "TN Language & Culture (Samacheer Kalvi)", 8, TN, Partial},
		{"Directorate", "TN State Board Examinations", 8, TN, Built},
		{"Directorate", "TN Textbook Corporation", 6, TN, Built},
		{"District", "TN-specific Analytics & Indices", 8, TN, Built},
		{"Block", "TN Field Structures (CEO/DEO/BEO)", 10, TN, Built},
	}
}

// Counts is the catalogue roll-up.
type Counts struct {
	Core          int            `json:"core"`
	TN            int            `json:"tn"`
	Total         int            `json:"total"`
	Families      int            `json:"families"`
	ByTier        map[string]int `json:"by_tier"`
	ByStatus      map[Status]int `json:"by_status"`
	HeadlineMatch bool           `json:"headline_match"` // computed totals match the published 329/62/391
}

// Tally computes the catalogue counts from the families.
func Tally() Counts {
	c := Counts{ByTier: map[string]int{}, ByStatus: map[Status]int{}}
	for _, f := range Families() {
		c.Families++
		c.Total += f.Count
		c.ByTier[f.Tier] += f.Count
		c.ByStatus[f.Status] += f.Count
		if f.Scope == Core {
			c.Core += f.Count
		} else {
			c.TN += f.Count
		}
	}
	c.HeadlineMatch = c.Core == CoreTotal && c.TN == TNTotal && c.Total == GrandTotal
	return c
}

// ByTier returns the families at a given tier.
func ByTier(tier string) []Family {
	var out []Family
	for _, f := range Families() {
		if f.Tier == tier {
			out = append(out, f)
		}
	}
	return out
}

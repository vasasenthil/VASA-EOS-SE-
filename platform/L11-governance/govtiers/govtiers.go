// Package govtiers is the L11 Governance & Oversight register: the seven governance tiers (G1–G7) and the
// three permanent AI Control Tower bodies that hold the State's authority over the platform (CC-SPEC-001 §L11;
// Synthesis Brief "Seven governance tiers … culminating in independent external audit by CAG"). Each tier is a
// named body with a mandate, composition and decision authority; every decision is auditable and reversible,
// and high-stakes actions escalate upward to the accountable human tier. Pure + stdlib-only.
package govtiers

import "sort"

// Tier is one of the seven governance bodies G1–G7.
type Tier struct {
	Code        string `json:"code"` // G1..G7
	Name        string `json:"name"`
	Mandate     string `json:"mandate"`
	Composition string `json:"composition"`
	Authority   string `json:"authority"` // what this tier can finally decide
}

// Tiers returns the seven governance tiers, top (G1) to independent audit (G7).
func Tiers() []Tier {
	return []Tier{
		{"G1", "State Cabinet", "Ultimate political authority; policy + budget sanction", "Hon'ble CM + Cabinet", "Approves State education policy, the budget and the off-switch custody"},
		{"G2", "Empowered Committee", "Cross-government execution authority", "Chief Secretary (chair) + Secretaries", "Sanctions schemes, inter-departmental funds and major change"},
		{"G3", "Inter-Directorate Council", "Operational coordination across the 7 directorates", "Directorate heads (DSE/DEE/DGE/DMS/DTERT/DPSE/DNFE)", "Resolves cross-directorate operations and standards"},
		{"G4", "Programme Management Unit (PMU)", "Delivery management + monitoring", "PMU Director + programme leads", "Runs delivery, tracks indicators, escalates risk"},
		{"G5", "Technology Architecture Board", "Technical + AI architecture authority", "Chief AI Architect + platform leads", "Owns architecture, model governance and tech standards"},
		{"G6", "Ethics, Equity & RPwD-21 Review", "AI ethics, fairness, accessibility and child safety", "Ethics Chair + equity + RPwD + child-safety experts", "Reviews bias, fairness, accessibility; can block a model/feature"},
		{"G7", "External Audit (CAG & independent)", "Independent assurance over everything", "CAG liaison + independent auditors", "Audits the evidence chain; findings are public and binding"},
	}
}

// Body is one of the three permanent AI Control Tower institutions (the State's instruments of authority).
type Body struct {
	Name       string `json:"name"`
	Role       string `json:"role"`
	Instrument string `json:"instrument"`
}

// ControlTower returns the three permanent bodies that operate as instruments, not advisory committees.
func ControlTower() []Body {
	return []Body{
		{"Sovereignty Console", "State data residency, state-held keys, off-switch, source-code escrow", "The off-switch + key custody + escrow manifest"},
		{"AI Ethics Board", "Continuous human authority over bias, fairness, explainability and model-card discipline", "The model-card deploy gate + drift/bias review"},
		{"AI Leadership Council", "State AI policy, model governance, red-teaming, drift review, RPwD/DPDP/IT-Act compliance", "The model registry + policy plane"},
	}
}

// TierFor returns a tier by its code (G1..G7).
func TierFor(code string) (Tier, bool) {
	for _, t := range Tiers() {
		if t.Code == code {
			return t, true
		}
	}
	return Tier{}, false
}

// EscalationPath returns the chain of tiers a decision of a given stakes level must pass, lowest acting tier
// first up to its accountable authority. Higher stakes escalate to a higher (lower-numbered) tier.
func EscalationPath(highStakes bool) []string {
	if highStakes {
		// a high-stakes decision (policy/sanction/model-block) rises to the Cabinet via the empowered committee.
		return []string{"G4", "G3", "G2", "G1"}
	}
	// routine delivery decisions are owned at PMU with architecture/ethics review.
	return []string{"G4", "G5", "G6"}
}

// Summary is the L11 governance roll-up.
type Summary struct {
	Tiers         int      `json:"tiers"`
	ControlBodies int      `json:"control_bodies"`
	TierCodes     []string `json:"tier_codes"`
}

// Summarise rolls up the governance register.
func Summarise() Summary {
	ts := Tiers()
	codes := make([]string, len(ts))
	for i, t := range ts {
		codes[i] = t.Code
	}
	sort.Strings(codes)
	return Summary{Tiers: len(ts), ControlBodies: len(ControlTower()), TierCodes: codes}
}

package integration

import (
	"github.com/vasa-eos-se-tn/platform/alignments"
	"github.com/vasa-eos-se-tn/platform/civic"
	"github.com/vasa-eos-se-tn/platform/govtiers"
	"github.com/vasa-eos-se-tn/platform/modulecatalogue"
	"github.com/vasa-eos-se-tn/platform/ndears"
	"github.com/vasa-eos-se-tn/platform/portals"
)

// This file wires the L11 governance / L12 civic / experience / federation registers — previously only in the
// TS app — into the Go composition root, closing the conformance-diff gap. Each is a first-class, tested Go
// module; the platform surfaces them and the civic register holds live RTI + grievance state.

// ── L11 Governance & Oversight (G1–G7 + AI Control Tower) ──

// GovernanceTiers returns the seven governance tiers G1–G7.
func (p *Platform) GovernanceTiers() []govtiers.Tier { return govtiers.Tiers() }

// ControlTower returns the three permanent AI Control Tower bodies.
func (p *Platform) ControlTower() []govtiers.Body { return govtiers.ControlTower() }

// GovernanceSummary returns the L11 governance roll-up.
func (p *Platform) GovernanceSummary() govtiers.Summary { return govtiers.Summarise() }

// ── L10 Experience — the 13 stakeholder portals ──

// Portals returns the thirteen role-tailored stakeholder portals.
func (p *Platform) Portals() []portals.Portal { return portals.Portals() }

// ── L4 Federation — NDEAR-S 29/29 ──

// NDEARSummary returns the NDEAR-S conformance roll-up (the headline N/29 addressed).
func (p *Platform) NDEARSummary() ndears.Summary { return ndears.Summarise() }

// NDEARBlocks returns the 29 NDEAR-S building blocks and their conformance posture.
func (p *Platform) NDEARBlocks() []ndears.Block { return ndears.Blocks() }

// ── L11 International alignments (GLO-TN-001) ──

// Alignments returns the international-framework alignment register.
func (p *Platform) Alignments() []alignments.Alignment { return alignments.Alignments() }

// AlignmentSummary returns the alignment roll-up.
func (p *Platform) AlignmentSummary() alignments.Summary { return alignments.Summarise() }

// ── The 391 functional-module catalogue ──

// ModuleCatalogue returns the 391-module catalogue counts (329 core + 62 TN, computed from the families).
func (p *Platform) ModuleCatalogue() modulecatalogue.Counts { return modulecatalogue.Tally() }

// ModuleFamilies returns the catalogue's module families across the seven tiers + Platform.
func (p *Platform) ModuleFamilies() []modulecatalogue.Family { return modulecatalogue.Families() }

// ── L12 Citizen & Civic ──

// PublicDashboard returns the PII-suppressed public institutional dashboard built from the real estate.
func (p *Platform) PublicDashboard() civic.PublicDashboard { return civic.Dashboard(tree()) }

// OpenDatasets returns the open-data (CKAN-style) dataset catalogue (non-personal only).
func (p *Platform) OpenDatasets() []civic.Dataset { return civic.OpenDatasets() }

// FileRTI files a citizen RTI request (it is audited; the 30-day statutory clock starts now).
func (p *Platform) FileRTI(id, subject, by string) civic.RTIRequest {
	r := p.Civic.FileRTI(id, subject, by)
	p.appendAudit("citizen:"+by, "rti.file", id, string(r.Status), "rti")
	return r
}

// AcknowledgeRTI records the PIO acknowledging an RTI (the statutory clock keeps running).
func (p *Platform) AcknowledgeRTI(id string) (civic.RTIRequest, bool) {
	r, ok := p.Civic.AcknowledgeRTI(id)
	if ok {
		p.appendAudit("role:PIO", "rti.acknowledge", id, string(r.Status), "rti")
	}
	return r, ok
}

// AnswerRTI records the PIO's answer to an RTI (stops the statutory clock).
func (p *Platform) AnswerRTI(id, answer string) (civic.RTIRequest, bool) {
	r, ok := p.Civic.AnswerRTI(id, answer)
	if ok {
		p.appendAudit("role:PIO", "rti.answer", id, string(r.Status), "rti")
	}
	return r, ok
}

// RTIRequests returns every RTI request in the register.
func (p *Platform) RTIRequests() []civic.RTIRequest { return p.Civic.RTIRequests() }

// RTIStatus returns one RTI request and whether it is past the 30-day statutory window.
func (p *Platform) RTIStatus(id string) (civic.RTIRequest, bool, bool) { return p.Civic.GetRTI(id) }

// FileGrievance files a citizen grievance at a governance tier.
func (p *Platform) FileGrievance(id, subject, by, tier string) civic.Grievance {
	return p.Civic.FileGrievance(id, subject, by, tier)
}

// CivicSummary returns the L12 civic roll-up (RTI + grievance state + open datasets).
func (p *Platform) CivicSummary() civic.Summary { return p.Civic.Summarise() }

// ExportDataset renders an open-data dataset as a downloadable CSV (CKAN-style). Only non-personal datasets
// are exportable: "schools-by-district" (institutional aggregates) and "enrolment-aggregates" (k-anonymity
// suppressed). Returns the CSV body, a filename, and ok=false for an unknown/non-exportable dataset.
func (p *Platform) ExportDataset(id string, cohort, k int) (body, filename string, ok bool) {
	switch id {
	case "schools-by-district":
		return civic.SchoolsByDistrictCSV(tree()), "schools-by-district.csv", true
	case "schools-by-type":
		return civic.SchoolsByTypeCSV(tree()), "schools-by-type.csv", true
	case "enrolment-aggregates":
		st := p.PublicEnrolment(cohort, k)
		return civic.EnrolmentCSV(st.Dimension, st.Published, st.Suppressed), "enrolment-aggregates.csv", true
	default:
		return "", "", false
	}
}

// EnrolmentStat is a publishable, k-anonymity-protected person-level statistic: per-class enrolment counts
// with any cell below the threshold suppressed, so no published figure can single out a small group.
type EnrolmentStat struct {
	Dimension     string         `json:"dimension"`
	K             int            `json:"k"`
	Published     map[string]int `json:"published"`
	Suppressed    []string       `json:"suppressed"` // cells withheld because their count < k
	PIISuppressed bool           `json:"pii_suppressed"`
}

// PublicEnrolment produces a publishable per-class enrolment statistic from a synthetic cohort, applying
// k-anonymity small-cell suppression (DPDP-safe open data): a class with fewer than k learners is withheld
// rather than published. This is how a person-level public statistic leaves the L12 civic layer without ever
// exposing an identifiable small group.
func (p *Platform) PublicEnrolment(cohort, k int) EnrolmentStat {
	if k < 1 {
		k = 5
	}
	coh := p.SyntheticCohort(cohort, 0)
	counts := map[string]int{}
	for _, s := range coh.Students {
		counts[s.Class]++
	}
	pub, sup := civic.SuppressSmallCells(counts, k)
	return EnrolmentStat{Dimension: "class", K: k, Published: pub, Suppressed: sup, PIISuppressed: true}
}

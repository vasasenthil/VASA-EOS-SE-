package integration

import (
	"context"
	"sync"

	"github.com/vasa-eos-se-tn/platform/iot"
	"github.com/vasa-eos-se-tn/platform/population"
)

// the 69,000-school estate is indexed by UDISE once (lazily) for O(1) school lookup.
var (
	schoolIdxOnce sync.Once
	schoolIdx     map[string]population.School
)

func schoolByUDISE(udise string) (population.School, bool) {
	schoolIdxOnce.Do(func() {
		schoolIdx = map[string]population.School{}
		for _, s := range tree().Schools {
			schoolIdx[s.UDISE] = s
		}
	})
	s, ok := schoolIdx[udise]
	return s, ok
}

// SchoolProfile is the institution-360 record: a school's full taxonomy classification, its T0–T6 governance
// chain (directorate → district → block → cluster), its IoT device fleet, a compliance snapshot, and the count
// of audit records concerning it — the single auditable "what is this school, who governs it, and is it
// compliant" answer for an officer.
type SchoolProfile struct {
	UDISE          string              `json:"udise"`
	Found          bool                `json:"found"`
	School         population.School   `json:"classification"`
	Directorate    string              `json:"directorate"`
	District       string              `json:"district"`
	Block          string              `json:"block"`
	Cluster        string              `json:"cluster"`
	GovernancePath string              `json:"governance_path"` // T0 → … → school
	Devices        []iot.Device        `json:"devices"`
	Compliance     []ComplianceFinding `json:"compliance_findings"`
	Compliant      bool                `json:"compliant"`
	AuditEvents    int                 `json:"audit_events"`
}

// SchoolProfile assembles the institution-360 record by UDISE. Read-only + derived across the layers.
func (p *Platform) SchoolProfile(udise string) SchoolProfile {
	prof := SchoolProfile{UDISE: udise}
	sc, ok := schoolByUDISE(udise)
	if !ok {
		return prof
	}
	prof.Found = true
	prof.School = sc
	prof.District, prof.Block, prof.Cluster = sc.District, sc.Block, sc.Cluster

	// L6 tenancy: the governance chain (T0 → … → school) + the owning directorate (T2).
	if path, ok := p.TenancyPath(udise); ok {
		prof.GovernancePath = path
	}
	prof.Directorate = p.tenancyAncestorAtLevel(udise, 2)

	// L4 IoT: the device fleet at this school.
	_, fleet := iotState()
	prof.Devices = fleet.DevicesAt(udise)

	// L9 compliance: a snapshot of the rule base over this school's facts (synthetic/illustrative, telemetry gated).
	prof.Compliance = deriveComplianceFindings(syntheticComplianceFacts(udise))
	prof.Compliant = len(prof.Compliance) == 0

	// L5 audit: how many audit records concern this school.
	for _, rec := range p.Audit.Records() {
		if mentions(rec.Resource, rec.Actor, udise) {
			prof.AuditEvents++
		}
	}
	return prof
}

// SchoolComplianceSignoff runs the full compliance check on a school (deriving findings AND routing them to a
// compliance officer for sign-off via HITL) — the actionable counterpart to the read-only profile snapshot.
func (p *Platform) SchoolComplianceSignoff(ctx context.Context, udise string) ComplianceOutcome {
	return p.CheckCompliance(ctx, ComplianceRequest{School: udise, Facts: syntheticComplianceFacts(udise)})
}

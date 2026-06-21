package integration

import "github.com/vasa-eos-se-tn/platform/tenancy"

// OfficerDashboard is a jurisdiction-scoped operating picture for a field officer (CRC/BEO/DEO/Director): the
// roll-up of ONLY the schools their tenant node governs (downward-governance scope) — the taxonomy mix, a
// compliance sweep, and the device count for their jurisdiction. A district officer sees their district; a
// block officer sees their block; nobody sees outside their subtree (fail-closed).
type OfficerDashboard struct {
	Node                string         `json:"node"`
	Found               bool           `json:"found"`
	Tier                string         `json:"tier"`
	GovernancePath      string         `json:"governance_path"`
	SchoolsGoverned     int            `json:"schools_governed"`
	Management          map[string]int `json:"management_mix"`
	Level               map[string]int `json:"level_mix"`
	Medium              map[string]int `json:"medium_mix"`
	Gender              map[string]int `json:"gender_mix"`
	Residential         map[string]int `json:"residential_mix"`
	SchoolsWithFindings int            `json:"schools_with_compliance_findings"`
	ComplianceByStatute map[string]int `json:"compliance_by_statute"`
	Devices             int            `json:"iot_devices"`
	Synthetic           bool           `json:"synthetic"` // compliance/device facts are illustrative (telemetry gated)
}

// OfficerDashboard assembles the scoped operating picture for a tenant node (e.g. "TN-DIST-Chennai" or a block
// id). It uses the T0–T6 downward-governance scope: only the T6 schools within the node's subtree are rolled
// up. Read-only + derived.
func (p *Platform) OfficerDashboard(nodeID string) OfficerDashboard {
	d := OfficerDashboard{
		Node: nodeID, Management: map[string]int{}, Level: map[string]int{}, Medium: map[string]int{},
		Gender: map[string]int{}, Residential: map[string]int{}, ComplianceByStatute: map[string]int{}, Synthetic: true,
	}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	node, ok := h.Get(nodeID)
	if !ok {
		return d
	}
	d.Found = true
	if t, ok := tenancy.TierAt(node.Level); ok {
		d.Tier = t.Name
	}
	d.GovernancePath = h.Path(nodeID)

	_, fleet := iotState()
	for _, udise := range h.LeavesUnder(nodeID, 6) {
		d.SchoolsGoverned++
		if sc, ok := schoolByUDISE(udise); ok {
			d.Management[sc.Management]++
			d.Level[sc.Level]++
			d.Medium[sc.Medium]++
			d.Gender[sc.Gender]++
			d.Residential[sc.Residential]++
		}
		if findings := deriveComplianceFindings(syntheticComplianceFacts(udise)); len(findings) > 0 {
			d.SchoolsWithFindings++
			for _, f := range findings {
				d.ComplianceByStatute[f.Statute]++
			}
		}
		d.Devices += len(fleet.DevicesAt(udise))
	}
	return d
}

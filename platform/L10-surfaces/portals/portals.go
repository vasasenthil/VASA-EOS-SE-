// Package portals is the L10 Experience-layer register of the thirteen role-tailored stakeholder portals
// (Cover Brief "Thirteen stakeholder portals"; Synthesis "thirteen role-tailored portals"). Each portal binds
// a stakeholder role to its home route, the governance tier it operates at, and its default action-grant set —
// the same dossier taxonomy the TS app realises as Next.js routes, made a first-class, queryable part of the
// Go mesh. Pure + stdlib-only.
package portals

import "sort"

// Portal is one role-tailored stakeholder portal.
type Portal struct {
	Role   string   `json:"role"`
	Label  string   `json:"label"`
	Home   string   `json:"home"`   // landing route
	Tier   string   `json:"tier"`   // governance/jurisdiction tier it operates at
	Grants []string `json:"grants"` // default action-grant surfaces
}

// Portals returns the thirteen dossier stakeholder portals (Part XVIII).
func Portals() []Portal {
	return []Portal{
		{"STUDENT", "Student / Learner", "/learn", "school", []string{"learn.view", "assess.attempt", "grievance.raise"}},
		{"PARENT", "Parent / Guardian", "/parent", "school", []string{"ward.view", "attendance.view", "grievance.raise", "consent.manage"}},
		{"TEACHER", "Teacher", "/teach", "school", []string{"class.manage", "assess.grade", "attendance.mark", "remediation.plan"}},
		{"PRINCIPAL", "Head Teacher / Principal", "/school", "school", []string{"school.govern", "staff.view", "compliance.attest", "admission.decide"}},
		{"CRCC", "Cluster Resource Coordinator", "/cluster", "cluster", []string{"cluster.monitor", "school.support", "visit.log"}},
		{"BEO", "Block Education Officer", "/block", "block", []string{"block.monitor", "scheme.recommend", "grievance.route"}},
		{"DEO", "District Education Officer / CEO", "/district", "district", []string{"district.monitor", "scheme.recommend", "sanction.recommend"}},
		{"DIRECTOR", "Directorate Director", "/directorate", "directorate", []string{"directorate.govern", "scheme.approve", "standard.set"}},
		{"SECRETARY", "School Education Secretary", "/secretariat", "state", []string{"state.govern", "fund.release", "policy.draft"}},
		{"MINISTER", "Minister / Chief Minister", "/executive", "state", []string{"policy.sanction", "budget.sanction", "executive.view"}},
		{"VENDOR", "EdTech / NEAT Partner", "/partner", "state", []string{"catalogue.publish", "integration.manage"}},
		{"RESEARCHER", "Researcher / Evaluator", "/research", "state", []string{"data.aggregate.view", "report.publish"}},
		{"PUBLIC", "Citizen / Public", "/public", "public", []string{"dashboard.view", "rti.file", "grievance.raise"}},
	}
}

// PortalFor returns a portal by role.
func PortalFor(role string) (Portal, bool) {
	for _, p := range Portals() {
		if p.Role == role {
			return p, true
		}
	}
	return Portal{}, false
}

// ByTier returns the portals that operate at a governance tier.
func ByTier(tier string) []Portal {
	var out []Portal
	for _, p := range Portals() {
		if p.Tier == tier {
			out = append(out, p)
		}
	}
	return out
}

// Roles returns the sorted set of portal roles.
func Roles() []string {
	ps := Portals()
	out := make([]string, len(ps))
	for i, p := range ps {
		out[i] = p.Role
	}
	sort.Strings(out)
	return out
}

// Package directory is the VASA-EOS(SE) TN User Directory & unified IAM: every category of user across the
// school-education governance hierarchy, each bound to an org unit (a T0–T6 tenant node) + a role + ABAC
// attributes, decided by a single Policy Decision Point that composes all FIVE access models — RBAC role
// grants, ABAC attributes, ReBAC jurisdiction (downward governance), PBAC statutory policy, and CABAC
// context-aware elevation — with deny-wins, fail-closed semantics and a full per-model decision trace.
//
// This is pure stdlib (no external IAM); in production the same contract is fronted by Keycloak/OIDC (gated
// B-010). ReBAC is delegated to an injected Governs function so the directory composes with the real tenancy
// tree without depending on it.
package directory

import "sort"

// Role is one category of user in the governance hierarchy, with its home governance tier anchor and its RBAC
// action grants. A grant is either the wildcard "*" or a "verb:resource" token (e.g. "write:assessment").
type Role struct {
	Code   string   `json:"code"`
	Name   string   `json:"name"`
	Tier   string   `json:"tier"`   // governance tier anchor (T0..T6 / cross-cutting)
	Grants []string `json:"grants"` // RBAC action grants ("*" = all)
}

// Roles is the canonical catalogue of every user category across the TN school-education governance hierarchy
// — from the learner at the school leaf (T6) up to the sovereign operator (T0), plus the cross-cutting
// assurance/citizen/partner roles. The grants encode each role's RBAC authority; jurisdiction (ReBAC),
// attributes (ABAC), statute (PBAC) and context (CABAC) further constrain every grant at decision time.
func Roles() []Role {
	return []Role{
		// ── learners & community (T6 school leaf) ──
		{"STUDENT", "Student (APAAR-anchored learner)", "T6", []string{"read:assessment", "read:attendance", "read:public"}},
		{"PARENT", "Parent / Guardian", "T6", []string{"read:assessment", "read:attendance", "read:grievance", "read:public"}},
		// ── school staff (T6) ──
		{"TEACHER", "Teacher", "T6", []string{"read:class", "read:student", "write:attendance", "write:assessment", "read:cpd"}},
		{"HEAD_TEACHER", "Head Teacher / Principal", "T6", []string{"read:class", "read:student", "write:attendance", "write:assessment", "read:school", "write:school", "read:report", "route:grievance"}},
		// ── field offices (T5 cluster → T3 district) ──
		{"CRC_COORDINATOR", "Cluster Resource Centre Coordinator", "T5", []string{"read:school", "read:report", "read:cpd"}},
		{"BEO", "Block Educational Officer", "T4", []string{"read:school", "write:school", "read:student", "read:report", "recommend:scheme", "route:grievance"}},
		{"DEO", "District Educational Officer", "T3", []string{"read:school", "write:school", "read:student", "read:report", "recommend:scheme", "route:grievance"}},
		{"CEO", "Chief Educational Officer (District)", "T3", []string{"read:school", "write:school", "read:student", "read:report", "recommend:scheme", "route:grievance"}},
		// ── directorate & secretariat (T2 → T1) ──
		{"DIRECTOR", "Directorate Head", "T2", []string{"read:school", "read:student", "read:report", "approve:scheme", "read:policy", "read:directory"}},
		{"SECRETARY", "School Education Secretary", "T1", []string{"read:report", "read:policy", "read:directory", "manage:users", "sanction:scheme", "release:fund"}},
		// ── sovereign (T0) ──
		{"MINISTER", "Hon'ble Minister (School Education)", "T0", []string{"read:report", "read:policy", "read:directory", "adopt:policy", "declare:emergency"}},
		{"SUPERADMIN", "Sovereign Platform Operator (T0)", "T0", []string{"*"}},
		// ── cross-cutting assurance & control bodies ──
		{"AUDITOR", "External / CAG Auditor (G7)", "T0", []string{"read:audit", "sign:audit", "read:report", "read:directory"}},
		{"ETHICS_CHAIR", "Ethics, Equity & RPwD Review Chair (G6)", "T0", []string{"review:ethics", "read:report"}},
		{"ARCHITECT", "Technology Architecture Board (G5)", "T0", []string{"approve:tech", "read:report"}},
		{"PIO", "Public Information Officer (RTI)", "T1", []string{"disclose:rti", "read:grievance", "read:report"}},
		// ── citizen & partners ──
		{"CITIZEN", "Citizen (public)", "T0", []string{"read:public"}},
		{"VENDOR", "Empanelled Vendor / Partner", "T1", []string{"read:tender", "read:public"}},
		{"RESEARCHER", "Approved Researcher", "T1", []string{"read:analytics", "read:public"}},
	}
}

// roleIndex builds a code→Role lookup over the catalogue.
func roleIndex() map[string]Role {
	idx := map[string]Role{}
	for _, r := range Roles() {
		idx[r.Code] = r
	}
	return idx
}

// User is a directory person bound to an org unit + role + ABAC attributes. The directory holds no free-text
// PII beyond a display name; in production the person record is the authoritative HRMS/APAAR identity (gated).
type User struct {
	ID         string            `json:"id"`
	Name       string            `json:"name"`
	Role       string            `json:"role"`     // a Role.Code
	OrgUnit    string            `json:"org_unit"` // the tenant node (T0..T6) the user is anchored to
	Attributes map[string]string `json:"attributes,omitempty"`
	Suspended  bool              `json:"suspended"`
}

// Directory is the in-memory user store (insertion-ordered for deterministic listing).
type Directory struct {
	users map[string]User
	order []string
}

// NewDirectory returns an empty directory.
func NewDirectory() *Directory { return &Directory{users: map[string]User{}} }

// Upsert inserts or updates a user by ID (preserving first-seen order).
func (d *Directory) Upsert(u User) {
	if _, ok := d.users[u.ID]; !ok {
		d.order = append(d.order, u.ID)
	}
	d.users[u.ID] = u
}

// Get returns a user by ID.
func (d *Directory) Get(id string) (User, bool) { u, ok := d.users[id]; return u, ok }

// Count returns the number of users in the directory.
func (d *Directory) Count() int { return len(d.users) }

// All returns every user in insertion order.
func (d *Directory) All() []User {
	out := make([]User, 0, len(d.order))
	for _, id := range d.order {
		out = append(out, d.users[id])
	}
	return out
}

// ByRole returns every user holding the given role (insertion order).
func (d *Directory) ByRole(role string) []User {
	var out []User
	for _, id := range d.order {
		if d.users[id].Role == role {
			out = append(out, d.users[id])
		}
	}
	return out
}

// ByOrg returns every user anchored exactly to the given org unit (insertion order).
func (d *Directory) ByOrg(org string) []User {
	var out []User
	for _, id := range d.order {
		if d.users[id].OrgUnit == org {
			out = append(out, d.users[id])
		}
	}
	return out
}

// RoleCounts rolls up the directory by role (for the user-management dashboard).
func (d *Directory) RoleCounts() map[string]int {
	counts := map[string]int{}
	for _, id := range d.order {
		counts[d.users[id].Role]++
	}
	return counts
}

// RoleCodes returns the sorted set of role codes in the catalogue (stable for UI/tests).
func RoleCodes() []string {
	var out []string
	for _, r := range Roles() {
		out = append(out, r.Code)
	}
	sort.Strings(out)
	return out
}

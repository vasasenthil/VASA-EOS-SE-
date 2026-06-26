package integration

import (
	"errors"
	"log"
	"os"
	"sync"

	"github.com/vasa-eos-se-tn/platform/directory"
	"github.com/vasa-eos-se-tn/platform/tenancy"
)

// The User Directory + unified five-model PDP is per-platform. It composes RBAC · ABAC · ReBAC · PBAC · CABAC
// over a directory of users, each bound to a REAL org unit (a T0–T6 tenant node) — and delegates ReBAC to the
// live tenancy hierarchy's downward-governance rule, so a decision here is the same jurisdiction the platform
// enforces on every listing. In production the directory is the HRMS/APAAR identity plane (gated B-022) and
// the PEP is fronted by Keycloak (gated B-010); this wires the sovereign decision logic that runs over them.
var (
	dirOnce   sync.Once
	dirStore  userDirectory
	dirEngine *directory.Engine
)

// iamState builds (once) the user directory + the unified PDP engine. The directory is the DURABLE PostgreSQL
// store when DATABASE_URL is set (users survive restarts and are CRUD-mutable), in-memory otherwise. The seed
// is idempotent (upsert), so it refreshes the synthetic catalogue users without disturbing real added users.
func iamState() (userDirectory, *directory.Engine) {
	dirOnce.Do(func() {
		h, _ := tenancyHierarchy()
		governs := func(subjectOrg, resourceOrg string) bool {
			if h == nil {
				return false
			}
			return h.Governs(subjectOrg, resourceOrg)
		}
		dirEngine = directory.NewEngine(governs)
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgUserDirectory(dsn); err == nil {
				dirStore = pg
				log.Printf("directory: using durable PostgreSQL user store (DATABASE_URL set)")
			} else {
				log.Printf("directory: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				dirStore = directory.NewDirectory()
			}
		} else {
			dirStore = directory.NewDirectory()
		}
		seedDirectory(dirStore, h)
	})
	return dirStore, dirEngine
}

// seedDirectory binds one representative user of every governance-hierarchy category to a REAL org unit. The
// field-office chain (district → block → cluster → school) is resolved from the live tenancy tree so the ReBAC
// jurisdiction tests exercise genuine downward governance. These are synthetic identities (SYN-prefixed), not
// real PII.
func seedDirectory(d userDirectory, h *tenancy.Hierarchy) {
	// resolve a real Chennai field chain: district → block → cluster → school.
	district := "TN-DIST-Chennai"
	var block, cluster, school string
	if h != nil {
		if leaves := h.LeavesUnder(district, 6); len(leaves) > 0 {
			school = leaves[0]
			for _, a := range h.Ancestors(school) {
				switch a.Level {
				case 4:
					block = a.ID
				case 5:
					cluster = a.ID
				}
			}
		}
	}
	teaching := map[string]string{"cadre": "teaching"}
	add := func(id, name, role, org string, attrs map[string]string) {
		d.Upsert(directory.User{ID: id, Name: name, Role: role, OrgUnit: org, Attributes: attrs})
	}
	// sovereign & assurance (T0)
	add("SYN-U-MIN", "SYN Minister", "MINISTER", "TN", nil)
	add("SYN-U-SUP", "SYN Sovereign Operator", "SUPERADMIN", "TN", nil)
	add("SYN-U-AUD", "SYN CAG Auditor", "AUDITOR", "TN", nil)
	add("SYN-U-ETH", "SYN Ethics Chair", "ETHICS_CHAIR", "TN", nil)
	add("SYN-U-ARC", "SYN Chief Architect", "ARCHITECT", "TN", nil)
	add("SYN-U-CIT", "SYN Citizen", "CITIZEN", "TN", nil)
	// secretariat (T1)
	add("SYN-U-SEC", "SYN Secretary", "SECRETARY", "TN-SEC", nil)
	add("SYN-U-PIO", "SYN Public Information Officer", "PIO", "TN-SEC", nil)
	add("SYN-U-VEN", "SYN Empanelled Vendor", "VENDOR", "TN-SEC", nil)
	add("SYN-U-RES", "SYN Approved Researcher", "RESEARCHER", "TN-SEC", nil)
	// directorate (T2)
	add("SYN-U-DIR", "SYN Director (DSE)", "DIRECTOR", "TN-DIR-DSE", nil)
	// district (T3)
	add("SYN-U-CEO", "SYN Chief Educational Officer", "CEO", district, nil)
	add("SYN-U-DEO", "SYN District Educational Officer", "DEO", district, nil)
	// block (T4)
	if block != "" {
		add("SYN-U-BEO", "SYN Block Educational Officer", "BEO", block, nil)
	}
	// cluster (T5)
	if cluster != "" {
		add("SYN-U-CRC", "SYN CRC Coordinator", "CRC_COORDINATOR", cluster, nil)
	}
	// school (T6)
	if school != "" {
		add("SYN-U-HM", "SYN Head Teacher", "HEAD_TEACHER", school, teaching)
		add("SYN-U-TCH", "SYN Teacher", "TEACHER", school, teaching)
		add("SYN-U-STU", "SYN Student", "STUDENT", school, nil)
		add("SYN-U-PAR", "SYN Parent", "PARENT", school, nil)
	}
}

// DirectorySummary is the user-management roll-up: total users, the per-role census, and the full role
// catalogue (every category across the governance hierarchy) with its grants.
type DirectorySummary struct {
	Users      int              `json:"users"`
	Roles      int              `json:"roles"`
	RoleCensus map[string]int   `json:"role_census"`
	Catalogue  []directory.Role `json:"catalogue"`
	Sample     []directory.User `json:"sample"`
	Models     []string         `json:"access_models"`
	Synthetic  bool             `json:"synthetic"`
}

// DirectorySummary returns the user-management operating picture.
func (p *Platform) DirectorySummary() DirectorySummary {
	d, _ := iamState()
	return DirectorySummary{
		Users:      d.Count(),
		Roles:      len(directory.Roles()),
		RoleCensus: d.RoleCounts(),
		Catalogue:  directory.Roles(),
		Sample:     d.All(),
		Models:     []string{"RBAC", "ABAC", "ReBAC", "PBAC", "CABAC"},
		Synthetic:  true,
	}
}

// AccessExplain verifies any access decision for a directory user — the reverse "why can/can't this person do
// X" lookup — returning the composed effect and the full per-model trace. ok=false for an unknown user.
func (p *Platform) AccessExplain(userID, action string, res directory.Resource, ctx directory.Context) (directory.Decision, directory.User, bool) {
	d, e := iamState()
	u, ok := d.Get(userID)
	if !ok {
		return directory.Decision{}, directory.User{}, false
	}
	return e.Evaluate(u, action, res, ctx), u, true
}

// EvaluateAccess decides an access request for an EXPLICIT subject (not a pre-seeded directory user) against
// the unified five-model PDP. This is the seam the Next.js access guard delegates to, so the frontend and the
// backbone share ONE decision engine rather than two divergent PDPs.
func (p *Platform) EvaluateAccess(u directory.User, action string, res directory.Resource, ctx directory.Context) directory.Decision {
	_, e := iamState()
	return e.Evaluate(u, action, res, ctx)
}

// AddUser creates or updates a directory user durably (CRUD over the persisted identity plane). The role must
// be a known category and the user must be bound to an org unit. Audited.
func (p *Platform) AddUser(u directory.User) (directory.User, error) {
	if u.ID == "" || u.Role == "" || u.OrgUnit == "" {
		return directory.User{}, errors.New("directory: id, role and org_unit are required")
	}
	known := false
	for _, r := range directory.Roles() {
		if r.Code == u.Role {
			known = true
			break
		}
	}
	if !known {
		return directory.User{}, errors.New("directory: unknown role " + u.Role)
	}
	d, _ := iamState()
	d.Upsert(u)
	p.appendAudit("directory", "user.upsert", u.ID, "executed", u.Role+" @ "+u.OrgUnit)
	stored, _ := d.Get(u.ID)
	return stored, nil
}

// DirectoryScopedBy applies the same downward-governance scope used everywhere else: the directory users an
// officer at the given org unit may see are exactly those anchored to a node the officer governs. Unknown or
// ungoverning subjects see nobody (fail-closed).
func (p *Platform) DirectoryScopedBy(subjectOrg string) []directory.User {
	d, _ := iamState()
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []directory.User
	for _, u := range d.All() {
		if u.OrgUnit != "" && h.Governs(subjectOrg, u.OrgUnit) {
			out = append(out, u)
		}
	}
	return out
}

package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sort"
	"sync"
)

// Visitor & Gate Management is an L6 campus-safety vertical: the school gate registers every visitor on entry and
// records their exit, so at any moment the register answers "who is on campus right now?". It is durable,
// audited, and enforces two hard invariants server-side:
//   - SINGLE OPEN PASS PER VISITOR: a visitor (by synthetic visitor id) can hold at most one open (checked-in)
//     pass across ALL governed gates — a second check-in is rejected until they check out (no phantom presence).
//   - NO DOUBLE CHECK-OUT: only a checked-in pass can be checked out; a pass already checked out cannot be
//     checked out again.
// The on-premises worklist (currently checked-in) is the live safety signal. Downward-governance scoped.
// Synthetic SYN- ids only, never real PII.

// Pass status.
const (
	VisitorIn  = "checked_in"
	VisitorOut = "checked_out"
)

func validVisitorPurpose(p string) bool {
	switch p {
	case "parent_meeting", "official", "vendor", "maintenance", "inspection", "guest":
		return true
	}
	return false
}

// VisitorPass is one gate pass for a visitor's campus visit.
type VisitorPass struct {
	ID         string `json:"id"`
	OrgUnit    string `json:"org_unit"` // the school gate (T6 tenancy node)
	VisitorID  string `json:"visitor_id"`
	Name       string `json:"name"`
	Purpose    string `json:"purpose"` // parent_meeting | official | vendor | maintenance | inspection | guest
	Host       string `json:"host"`    // whom they are visiting (synthetic staff id)
	CheckInAt  string `json:"check_in_at"`
	CheckOutAt string `json:"check_out_at,omitempty"`
	Status     string `json:"status"`
	CreatedOn  string `json:"created_on"`
	UpdatedAt  string `json:"updated_at"`
}

// Validate checks a pass's required fields.
func (v VisitorPass) Validate() error {
	if v.ID == "" || v.OrgUnit == "" {
		return errors.New("visitor: id and org_unit are required")
	}
	if v.VisitorID == "" || v.Name == "" {
		return errors.New("visitor: visitor_id and name are required")
	}
	if !validVisitorPurpose(v.Purpose) {
		return errors.New("visitor: purpose must be parent_meeting, official, vendor, maintenance, inspection or guest")
	}
	return nil
}

// applyCheckOut closes an open pass — rejected if it is not currently checked in (no double check-out).
func applyCheckOut(v VisitorPass, now string) (VisitorPass, error) {
	if v.Status != VisitorIn {
		return VisitorPass{}, fmt.Errorf("visitor: %s is not checked in (status %s) — cannot check out", v.ID, v.Status)
	}
	v.Status = VisitorOut
	v.CheckOutAt = now
	v.UpdatedAt = now
	return v, nil
}

type visitorFilter struct{ OrgUnit, Status, Purpose string }

func matchVisitor(f visitorFilter, v VisitorPass) bool {
	if f.OrgUnit != "" && v.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Status != "" && v.Status != f.Status {
		return false
	}
	if f.Purpose != "" && v.Purpose != f.Purpose {
		return false
	}
	return true
}

// visitorStore is the persistence port. *memVisitorStore and *pgVisitorStore satisfy it.
type visitorStore interface {
	Upsert(VisitorPass) (VisitorPass, error)
	Get(id string) (VisitorPass, bool)
	List(visitorFilter) []VisitorPass
}

type memVisitorStore struct {
	mu sync.Mutex
	m  map[string]VisitorPass
}

func newMemVisitorStore() *memVisitorStore { return &memVisitorStore{m: map[string]VisitorPass{}} }

func (s *memVisitorStore) Upsert(v VisitorPass) (VisitorPass, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[v.ID] = v
	return v, nil
}

func (s *memVisitorStore) Get(id string) (VisitorPass, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	v, ok := s.m[id]
	return v, ok
}

func (s *memVisitorStore) List(f visitorFilter) []VisitorPass {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]VisitorPass, 0, len(s.m))
	for _, v := range s.m {
		if matchVisitor(f, v) {
			out = append(out, v)
		}
	}
	return out
}

var (
	visitorOnce sync.Once
	visitorBack visitorStore
)

func visitorState() visitorStore {
	visitorOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgVisitorStore(dsn); err == nil {
				visitorBack = pg
				log.Printf("visitor: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("visitor: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				visitorBack = newMemVisitorStore()
			}
		} else {
			visitorBack = newMemVisitorStore()
		}
		seedVisitor(visitorBack)
	})
	return visitorBack
}

func visitorNow() string { return "2026-06-25T09:30:00Z" }

// visitorOpenPass returns the id of a visitor's currently-open pass (any governed gate), or "" if none.
func visitorOpenPass(visitorID string) string {
	for _, v := range visitorState().List(visitorFilter{Status: VisitorIn}) {
		if v.VisitorID == visitorID {
			return v.ID
		}
	}
	return ""
}

// CheckInVisitor registers a visitor at the gate — rejecting a second concurrent open pass. Audited.
func (p *Platform) CheckInVisitor(v VisitorPass) (VisitorPass, error) {
	v.Status = VisitorIn
	v.CheckOutAt = ""
	if v.CheckInAt == "" {
		v.CheckInAt = visitorNow()
	}
	if v.CreatedOn == "" {
		v.CreatedOn = "2026-06-25"
	}
	v.UpdatedAt = visitorNow()
	if err := v.Validate(); err != nil {
		p.appendAudit("gate-security", "visitor.checkin.denied", v.OrgUnit, "deny", err.Error())
		return VisitorPass{}, err
	}
	if other := visitorOpenPass(v.VisitorID); other != "" {
		err := fmt.Errorf("visitor: %s already has an open pass %s (single open pass per visitor)", v.VisitorID, other)
		p.appendAudit("gate-security", "visitor.checkin.denied", v.OrgUnit, "deny", err.Error())
		return VisitorPass{}, err
	}
	out, err := visitorState().Upsert(v)
	if err != nil {
		return VisitorPass{}, err
	}
	p.appendAudit("gate-security", "visitor.checkin", v.ID, "executed", fmt.Sprintf("%s (%s)", v.Name, v.Purpose))
	return out, nil
}

// CheckOutVisitor records a visitor's exit — rejecting a double check-out. Audited.
func (p *Platform) CheckOutVisitor(id string) (VisitorPass, error) {
	cur, ok := visitorState().Get(id)
	if !ok {
		return VisitorPass{}, errors.New("visitor: not found")
	}
	out, err := applyCheckOut(cur, visitorNow())
	if err != nil {
		p.appendAudit("gate-security", "visitor.checkout.denied", id, "deny", err.Error())
		return VisitorPass{}, err
	}
	if _, err := visitorState().Upsert(out); err != nil {
		return VisitorPass{}, err
	}
	p.appendAudit("gate-security", "visitor.checkout", id, "executed", "checked out")
	return out, nil
}

// VisitorPassRecord returns a single pass by id.
func (p *Platform) VisitorPassRecord(id string) (VisitorPass, bool) { return visitorState().Get(id) }

// VisitorDashboard is the jurisdiction-scoped gate picture: total passes, currently on premises (checked-in),
// checked-out, by purpose, and the live on-premises worklist. Downward-governance scoped.
type VisitorDashboard struct {
	Scope      string         `json:"scope"`
	Total      int            `json:"total"`
	OnPremises int            `json:"on_premises"`
	CheckedOut int            `json:"checked_out"`
	ByPurpose  map[string]int `json:"by_purpose"`
	Present    []VisitorPass  `json:"present,omitempty"`
	Synthetic  bool           `json:"synthetic"`
}

// VisitorDashboard rolls up passes across the schools a tenant node governs (fail-closed for others).
func (p *Platform) VisitorDashboard(scopeOrg string) VisitorDashboard {
	d := VisitorDashboard{Scope: scopeOrg, ByPurpose: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, v := range visitorState().List(visitorFilter{}) {
		if !h.Governs(scopeOrg, v.OrgUnit) {
			continue
		}
		d.Total++
		d.ByPurpose[v.Purpose]++
		if v.Status == VisitorIn {
			d.OnPremises++
			d.Present = append(d.Present, v)
		} else {
			d.CheckedOut++
		}
	}
	sort.Slice(d.Present, func(i, j int) bool { return d.Present[i].ID < d.Present[j].ID })
	return d
}

// ScopedVisitorPasses lists passes a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedVisitorPasses(scopeOrg, status string) []VisitorPass {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []VisitorPass
	for _, v := range visitorState().List(visitorFilter{Status: status}) {
		if h.Governs(scopeOrg, v.OrgUnit) {
			out = append(out, v)
		}
	}
	return out
}

// seedVisitor plants gate passes per school across more than one district: two still on premises and one already
// checked out, so the on-premises worklist has signal. Synthetic SYN- ids only.
func seedVisitor(s visitorStore) {
	schools := pilotSchools(4)
	if len(schools) == 0 {
		if only := tenancyLeafUnder(pilotDistrict()); only != "" {
			schools = []string{only}
		} else {
			return
		}
	}
	for si, school := range schools {
		tag := schoolTag(si)
		specs := []struct {
			purpose, host, in, out, status string
		}{
			{"parent_meeting", "SYN-T-CHN-07", "2026-06-25T09:10:00Z", "", VisitorIn},
			{"vendor", "SYN-HM-CHN", "2026-06-25T09:25:00Z", "", VisitorIn},
			{"inspection", "SYN-HM-CHN", "2026-06-25T08:40:00Z", "2026-06-25T09:15:00Z", VisitorOut},
		}
		for vi, sp := range specs {
			v := VisitorPass{
				ID: fmt.Sprintf("VIS-%s-%02d", tag, vi+1), OrgUnit: school, VisitorID: fmt.Sprintf("SYN-V-%s-%02d", tag, vi+1),
				Name: fmt.Sprintf("Visitor SYN-V-%s-%02d", tag, vi+1), Purpose: sp.purpose, Host: sp.host,
				CheckInAt: sp.in, CheckOutAt: sp.out, Status: sp.status, CreatedOn: "2026-06-25", UpdatedAt: visitorNow(),
			}
			if err := v.Validate(); err == nil {
				s.Upsert(v)
			}
		}
	}
}

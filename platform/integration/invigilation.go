package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sort"
	"sync"
)

// Exam Invigilation Duty Roster is an L6 examinations vertical: the exam cell rosters invigilators onto exam
// sessions (a hall, on a date, in a slot). It is durable, audited, and enforces three hard invariants
// server-side:
//   - NO CLASH: an invigilator cannot be assigned to two sessions in the same date+slot across ALL governed
//     sessions — the duty roster cannot put one person in two halls at once.
//   - CAPACITY + UNIQUENESS: a session takes at most its required number of invigilators, and a person is
//     assigned at most once per session.
//   - NO CLOSE WHILE UNDERSTAFFED: a session can only be finalised (closed) once it is fully staffed.
// Invigilators are embedded on the session (like hostel residents). Downward-governance scoped. Synthetic SYN-
// ids only, never real PII.

// Session status.
const (
	DutyOpen   = "open"
	DutyClosed = "closed"
)

func validDutySlot(s string) bool {
	switch s {
	case "FN", "AN":
		return true
	}
	return false
}

// DutySession is one exam session (hall · date · slot) with its assigned invigilators.
type DutySession struct {
	ID                   string   `json:"id"`
	OrgUnit              string   `json:"org_unit"`
	Exam                 string   `json:"exam"`
	Date                 string   `json:"date"`
	Slot                 string   `json:"slot"` // FN | AN
	Hall                 string   `json:"hall"`
	RequiredInvigilators int      `json:"required_invigilators"`
	Invigilators         []string `json:"invigilators,omitempty"`
	Status               string   `json:"status"`
	CreatedOn            string   `json:"created_on"`
	UpdatedAt            string   `json:"updated_at"`
}

// Assigned is the current number of invigilators.
func (d DutySession) Assigned() int { return len(d.Invigilators) }

// Validate checks a session's required fields.
func (d DutySession) Validate() error {
	if d.ID == "" || d.OrgUnit == "" {
		return errors.New("invigilation: id and org_unit are required")
	}
	if d.Exam == "" || d.Date == "" || d.Hall == "" {
		return errors.New("invigilation: exam, date and hall are required")
	}
	if !validDutySlot(d.Slot) {
		return errors.New("invigilation: slot must be FN or AN")
	}
	if d.RequiredInvigilators < 1 {
		return errors.New("invigilation: required_invigilators must be at least 1")
	}
	return nil
}

func (d DutySession) hasInvigilator(teacher string) bool {
	for _, t := range d.Invigilators {
		if t == teacher {
			return true
		}
	}
	return false
}

// applyAssignDuty assigns an invigilator — rejecting a closed session, a duplicate, or over-capacity. (The
// cross-session date+slot clash is enforced by the Platform method.)
func applyAssignDuty(d DutySession, teacher, now string) (DutySession, error) {
	if d.Status != DutyOpen {
		return DutySession{}, fmt.Errorf("invigilation: %s is closed — cannot assign", d.ID)
	}
	if teacher == "" {
		return DutySession{}, errors.New("invigilation: an invigilator id is required")
	}
	if d.hasInvigilator(teacher) {
		return DutySession{}, fmt.Errorf("invigilation: %s is already assigned to %s", teacher, d.ID)
	}
	if d.Assigned() >= d.RequiredInvigilators {
		return DutySession{}, fmt.Errorf("invigilation: %s is fully staffed (%d/%d)", d.ID, d.Assigned(), d.RequiredInvigilators)
	}
	d.Invigilators = append(d.Invigilators, teacher)
	d.UpdatedAt = now
	return d, nil
}

// applyUnassignDuty removes an invigilator from a session.
func applyUnassignDuty(d DutySession, teacher, now string) (DutySession, error) {
	for i := range d.Invigilators {
		if d.Invigilators[i] == teacher {
			d.Invigilators = append(d.Invigilators[:i], d.Invigilators[i+1:]...)
			d.UpdatedAt = now
			return d, nil
		}
	}
	return DutySession{}, fmt.Errorf("invigilation: %s is not assigned to %s", teacher, d.ID)
}

// applyCloseDuty finalises a session — rejected while it is understaffed.
func applyCloseDuty(d DutySession, now string) (DutySession, error) {
	if d.Assigned() < d.RequiredInvigilators {
		return DutySession{}, fmt.Errorf("invigilation: cannot close %s — understaffed (%d/%d)", d.ID, d.Assigned(), d.RequiredInvigilators)
	}
	d.Status = DutyClosed
	d.UpdatedAt = now
	return d, nil
}

type dutyFilter struct{ OrgUnit, Status, Date string }

func matchDuty(f dutyFilter, d DutySession) bool {
	if f.OrgUnit != "" && d.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Status != "" && d.Status != f.Status {
		return false
	}
	if f.Date != "" && d.Date != f.Date {
		return false
	}
	return true
}

// dutyStore is the persistence port. *memDutyStore and *pgDutyStore satisfy it.
type dutyStore interface {
	Upsert(DutySession) (DutySession, error)
	Get(id string) (DutySession, bool)
	List(dutyFilter) []DutySession
}

type memDutyStore struct {
	mu sync.Mutex
	m  map[string]DutySession
}

func newMemDutyStore() *memDutyStore { return &memDutyStore{m: map[string]DutySession{}} }

func (s *memDutyStore) Upsert(d DutySession) (DutySession, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[d.ID] = d
	return d, nil
}

func (s *memDutyStore) Get(id string) (DutySession, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	d, ok := s.m[id]
	return d, ok
}

func (s *memDutyStore) List(f dutyFilter) []DutySession {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]DutySession, 0, len(s.m))
	for _, d := range s.m {
		if matchDuty(f, d) {
			out = append(out, d)
		}
	}
	return out
}

var (
	dutyOnce sync.Once
	dutyBack dutyStore
)

func dutyState() dutyStore {
	dutyOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgDutyStore(dsn); err == nil {
				dutyBack = pg
				log.Printf("invigilation: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("invigilation: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				dutyBack = newMemDutyStore()
			}
		} else {
			dutyBack = newMemDutyStore()
		}
		seedDuty(dutyBack)
	})
	return dutyBack
}

func dutyNow() string { return "2026-06-25T00:00:00Z" }

// invigilatorBusyAt reports whether a teacher is already assigned to another session at the same date+slot.
func invigilatorBusyAt(teacher, date, slot, excludeID string) string {
	for _, d := range dutyState().List(dutyFilter{Date: date}) {
		if d.ID == excludeID || d.Slot != slot {
			continue
		}
		if d.hasInvigilator(teacher) {
			return d.ID
		}
	}
	return ""
}

// CreateDutySession records a new exam session (status open). Audited.
func (p *Platform) CreateDutySession(d DutySession) (DutySession, error) {
	d.Status = DutyOpen
	d.Invigilators = nil
	if d.CreatedOn == "" {
		d.CreatedOn = "2026-06-25"
	}
	d.UpdatedAt = dutyNow()
	if err := d.Validate(); err != nil {
		p.appendAudit("exam-coordinator", "invigilation.create.denied", d.OrgUnit, "deny", err.Error())
		return DutySession{}, err
	}
	out, err := dutyState().Upsert(d)
	if err != nil {
		return DutySession{}, err
	}
	p.appendAudit("exam-coordinator", "invigilation.create", d.ID, "executed", fmt.Sprintf("%s %s/%s %s", d.Exam, d.Date, d.Slot, d.Hall))
	return out, nil
}

// AssignInvigilator assigns a teacher — rejecting a same-slot clash, a duplicate or over-capacity. Audited.
func (p *Platform) AssignInvigilator(id, teacher string) (DutySession, error) {
	cur, ok := dutyState().Get(id)
	if !ok {
		return DutySession{}, errors.New("invigilation: not found")
	}
	if other := invigilatorBusyAt(teacher, cur.Date, cur.Slot, cur.ID); other != "" {
		err := fmt.Errorf("invigilation: %s is already on duty at %s %s (session %s) — clash", teacher, cur.Date, cur.Slot, other)
		p.appendAudit("exam-coordinator", "invigilation.assign.denied", id, "deny", err.Error())
		return DutySession{}, err
	}
	out, err := applyAssignDuty(cur, teacher, dutyNow())
	if err != nil {
		p.appendAudit("exam-coordinator", "invigilation.assign.denied", id, "deny", err.Error())
		return DutySession{}, err
	}
	if _, err := dutyState().Upsert(out); err != nil {
		return DutySession{}, err
	}
	p.appendAudit("exam-coordinator", "invigilation.assign", id, "executed", fmt.Sprintf("%s → %d/%d", teacher, out.Assigned(), out.RequiredInvigilators))
	return out, nil
}

// UnassignInvigilator removes a teacher from a session. Audited.
func (p *Platform) UnassignInvigilator(id, teacher string) (DutySession, error) {
	cur, ok := dutyState().Get(id)
	if !ok {
		return DutySession{}, errors.New("invigilation: not found")
	}
	out, err := applyUnassignDuty(cur, teacher, dutyNow())
	if err != nil {
		p.appendAudit("exam-coordinator", "invigilation.unassign.denied", id, "deny", err.Error())
		return DutySession{}, err
	}
	if _, err := dutyState().Upsert(out); err != nil {
		return DutySession{}, err
	}
	p.appendAudit("exam-coordinator", "invigilation.unassign", id, "executed", teacher)
	return out, nil
}

// CloseDutySession finalises a fully-staffed session. Audited.
func (p *Platform) CloseDutySession(id string) (DutySession, error) {
	cur, ok := dutyState().Get(id)
	if !ok {
		return DutySession{}, errors.New("invigilation: not found")
	}
	out, err := applyCloseDuty(cur, dutyNow())
	if err != nil {
		p.appendAudit("exam-coordinator", "invigilation.close.denied", id, "deny", err.Error())
		return DutySession{}, err
	}
	if _, err := dutyState().Upsert(out); err != nil {
		return DutySession{}, err
	}
	p.appendAudit("exam-coordinator", "invigilation.close", id, "executed", "finalised")
	return out, nil
}

// DutySessionRecord returns a single session by id.
func (p *Platform) DutySessionRecord(id string) (DutySession, bool) { return dutyState().Get(id) }

// InvigilationDashboard is the jurisdiction-scoped roster picture: sessions by status, required vs assigned
// invigilator totals, and the understaffed worklist. Downward-governance scoped.
type InvigilationDashboard struct {
	Scope         string         `json:"scope"`
	Sessions      int            `json:"sessions"`
	ByStatus      map[string]int `json:"by_status"`
	RequiredSeats int            `json:"required_seats"`
	AssignedSeats int            `json:"assigned_seats"`
	Understaffed  []DutySession  `json:"understaffed,omitempty"`
	Synthetic     bool           `json:"synthetic"`
}

// InvigilationDashboard rolls up sessions across the schools a tenant node governs (fail-closed for others).
func (p *Platform) InvigilationDashboard(scopeOrg string) InvigilationDashboard {
	d := InvigilationDashboard{Scope: scopeOrg, ByStatus: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, ses := range dutyState().List(dutyFilter{}) {
		if !h.Governs(scopeOrg, ses.OrgUnit) {
			continue
		}
		d.Sessions++
		d.ByStatus[ses.Status]++
		d.RequiredSeats += ses.RequiredInvigilators
		d.AssignedSeats += ses.Assigned()
		if ses.Status == DutyOpen && ses.Assigned() < ses.RequiredInvigilators {
			d.Understaffed = append(d.Understaffed, ses)
		}
	}
	sort.Slice(d.Understaffed, func(i, j int) bool { return d.Understaffed[i].ID < d.Understaffed[j].ID })
	return d
}

// ScopedDutySessions lists sessions a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedDutySessions(scopeOrg, status string) []DutySession {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []DutySession
	for _, ses := range dutyState().List(dutyFilter{Status: status}) {
		if h.Governs(scopeOrg, ses.OrgUnit) {
			out = append(out, ses)
		}
	}
	return out
}

// seedDuty plants exam sessions per school across more than one district: a morning session fully staffed, an
// afternoon session understaffed (pending), sharing a date so the clash rule has signal. Synthetic SYN- ids only.
func seedDuty(s dutyStore) {
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

		// FN session — fully staffed (2/2).
		fn := DutySession{
			ID: fmt.Sprintf("INV-%s-FN", tag), OrgUnit: school, Exam: "Half-yearly", Date: "2026-09-10", Slot: "FN",
			Hall: "Hall-A", RequiredInvigilators: 2, Status: DutyOpen, CreatedOn: "2026-06-20", UpdatedAt: dutyNow(),
		}
		fn, _ = applyAssignDuty(fn, fmt.Sprintf("SYN-T-%s-01", tag), dutyNow())
		fn, _ = applyAssignDuty(fn, fmt.Sprintf("SYN-T-%s-02", tag), dutyNow())
		s.Upsert(fn)

		// AN session — understaffed (1/2).
		an := DutySession{
			ID: fmt.Sprintf("INV-%s-AN", tag), OrgUnit: school, Exam: "Half-yearly", Date: "2026-09-10", Slot: "AN",
			Hall: "Hall-A", RequiredInvigilators: 2, Status: DutyOpen, CreatedOn: "2026-06-20", UpdatedAt: dutyNow(),
		}
		an, _ = applyAssignDuty(an, fmt.Sprintf("SYN-T-%s-03", tag), dutyNow())
		s.Upsert(an)
	}
}

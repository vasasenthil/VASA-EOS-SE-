package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sync"
)

// Hostel Allocation & Occupancy is an L6 welfare vertical: the State runs residential hostels (SC/ST/BC/tribal
// welfare) and must place students into beds without over-allocating. It is durable, audited, and enforces two
// hard invariants server-side:
//   - CAPACITY: a hostel's occupancy can never exceed its sanctioned capacity (no over-allocation).
//   - ONE BED PER STUDENT (statewide): a student can hold at most one active allotment across ALL hostels —
//     AllotBed scans every governed hostel and rejects a second placement.
// Residents are embedded (student + allotted-on) with an allot→vacate lifecycle. Downward-governance scoped.
// Synthetic SYN- ids only, never real PII.

// Hostel status.
const (
	HostelOpen   = "open"
	HostelClosed = "closed"
)

func validHostelType(t string) bool {
	switch t {
	case "boys", "girls", "tribal":
		return true
	}
	return false
}

// Resident is one student placed in a hostel.
type Resident struct {
	StudentID  string `json:"student_id"`
	AllottedOn string `json:"allotted_on"`
}

// Hostel is one residential hostel with its current residents.
type Hostel struct {
	ID        string     `json:"id"`
	OrgUnit   string     `json:"org_unit"` // the school/welfare node (T6 tenancy node)
	Name      string     `json:"name"`
	Type      string     `json:"type"` // boys | girls | tribal
	Capacity  int        `json:"capacity"`
	Residents []Resident `json:"residents,omitempty"`
	Status    string     `json:"status"`
	CreatedOn string     `json:"created_on"`
	UpdatedAt string     `json:"updated_at"`
}

// Occupied is the current number of residents.
func (h Hostel) Occupied() int { return len(h.Residents) }

// Validate checks a hostel's required fields.
func (h Hostel) Validate() error {
	if h.ID == "" || h.OrgUnit == "" {
		return errors.New("hostel: id and org_unit are required")
	}
	if h.Name == "" {
		return errors.New("hostel: a name is required")
	}
	if !validHostelType(h.Type) {
		return errors.New("hostel: type must be boys, girls or tribal")
	}
	if h.Capacity < 1 {
		return errors.New("hostel: capacity must be at least 1")
	}
	return nil
}

func (h Hostel) hasResident(studentID string) bool {
	for _, r := range h.Residents {
		if r.StudentID == studentID {
			return true
		}
	}
	return false
}

// applyHostelAllot places a student in a hostel — rejected if closed, full, or the student is already a resident
// here. (The statewide one-bed-per-student check is enforced by the Platform method against all hostels.)
func applyHostelAllot(h Hostel, studentID, now string) (Hostel, error) {
	if h.Status != HostelOpen {
		return Hostel{}, errors.New("hostel: cannot allot in a closed hostel")
	}
	if h.Occupied() >= h.Capacity {
		return Hostel{}, fmt.Errorf("hostel: %s is full (%d/%d) — no over-allocation", h.ID, h.Occupied(), h.Capacity)
	}
	if h.hasResident(studentID) {
		return Hostel{}, fmt.Errorf("hostel: %s is already a resident of %s", studentID, h.ID)
	}
	h.Residents = append(h.Residents, Resident{StudentID: studentID, AllottedOn: "2026-06-25"})
	h.UpdatedAt = now
	return h, nil
}

// applyHostelVacate removes a student from a hostel.
func applyHostelVacate(h Hostel, studentID, now string) (Hostel, error) {
	for i := range h.Residents {
		if h.Residents[i].StudentID == studentID {
			h.Residents = append(h.Residents[:i], h.Residents[i+1:]...)
			h.UpdatedAt = now
			return h, nil
		}
	}
	return Hostel{}, fmt.Errorf("hostel: %s is not a resident of %s", studentID, h.ID)
}

// applyHostelClose closes a hostel (no further allotment) — only when empty.
func applyHostelClose(h Hostel, now string) (Hostel, error) {
	if h.Occupied() > 0 {
		return Hostel{}, fmt.Errorf("hostel: cannot close %s — %d resident(s) still placed", h.ID, h.Occupied())
	}
	h.Status = HostelClosed
	h.UpdatedAt = now
	return h, nil
}

type hostelFilter struct{ OrgUnit, Type, Status string }

func matchHostel(f hostelFilter, h Hostel) bool {
	if f.OrgUnit != "" && h.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Type != "" && h.Type != f.Type {
		return false
	}
	if f.Status != "" && h.Status != f.Status {
		return false
	}
	return true
}

// hostelStore is the persistence port. *memHostelStore and *pgHostelStore satisfy it.
type hostelStore interface {
	Upsert(Hostel) (Hostel, error)
	Get(id string) (Hostel, bool)
	List(hostelFilter) []Hostel
}

type memHostelStore struct {
	mu sync.Mutex
	m  map[string]Hostel
}

func newMemHostelStore() *memHostelStore { return &memHostelStore{m: map[string]Hostel{}} }

func (s *memHostelStore) Upsert(h Hostel) (Hostel, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[h.ID] = h
	return h, nil
}

func (s *memHostelStore) Get(id string) (Hostel, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	h, ok := s.m[id]
	return h, ok
}

func (s *memHostelStore) List(f hostelFilter) []Hostel {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]Hostel, 0, len(s.m))
	for _, h := range s.m {
		if matchHostel(f, h) {
			out = append(out, h)
		}
	}
	return out
}

var (
	hostelOnce sync.Once
	hostelBack hostelStore
)

func hostelState() hostelStore {
	hostelOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgHostelStore(dsn); err == nil {
				hostelBack = pg
				log.Printf("hostel: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("hostel: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				hostelBack = newMemHostelStore()
			}
		} else {
			hostelBack = newMemHostelStore()
		}
		seedHostel(hostelBack)
	})
	return hostelBack
}

func hostelNow() string { return "2026-06-25T00:00:00Z" }

// studentActiveHostel returns the hostel id a student is currently placed in (statewide), or "" if none.
func studentActiveHostel(studentID string) string {
	for _, h := range hostelState().List(hostelFilter{}) {
		if h.hasResident(studentID) {
			return h.ID
		}
	}
	return ""
}

// RegisterHostel records a new hostel (status open). Audited.
func (p *Platform) RegisterHostel(h Hostel) (Hostel, error) {
	h.Status = HostelOpen
	h.Residents = nil
	if h.CreatedOn == "" {
		h.CreatedOn = "2026-06-25"
	}
	h.UpdatedAt = hostelNow()
	if err := h.Validate(); err != nil {
		p.appendAudit("hostel-warden", "hostel.register.denied", h.OrgUnit, "deny", err.Error())
		return Hostel{}, err
	}
	out, err := hostelState().Upsert(h)
	if err != nil {
		return Hostel{}, err
	}
	p.appendAudit("hostel-warden", "hostel.register", h.ID, "executed", fmt.Sprintf("%s (%s) cap %d", h.Name, h.Type, h.Capacity))
	return out, nil
}

// AllotBed places a student — rejecting an over-allocation and a second statewide placement. Audited.
func (p *Platform) AllotBed(hostelID, studentID string) (Hostel, error) {
	if studentID == "" {
		return Hostel{}, errors.New("hostel: a student_id is required")
	}
	cur, ok := hostelState().Get(hostelID)
	if !ok {
		return Hostel{}, errors.New("hostel: not found")
	}
	if other := studentActiveHostel(studentID); other != "" && other != hostelID {
		err := fmt.Errorf("hostel: %s already holds an active bed at %s (one bed per student)", studentID, other)
		p.appendAudit("hostel-warden", "hostel.allot.denied", hostelID, "deny", err.Error())
		return Hostel{}, err
	}
	out, err := applyHostelAllot(cur, studentID, hostelNow())
	if err != nil {
		p.appendAudit("hostel-warden", "hostel.allot.denied", hostelID, "deny", err.Error())
		return Hostel{}, err
	}
	if _, err := hostelState().Upsert(out); err != nil {
		return Hostel{}, err
	}
	p.appendAudit("hostel-warden", "hostel.allot", hostelID, "executed", fmt.Sprintf("%s → %d/%d", studentID, out.Occupied(), out.Capacity))
	return out, nil
}

// VacateBed removes a student from a hostel. Audited.
func (p *Platform) VacateBed(hostelID, studentID string) (Hostel, error) {
	cur, ok := hostelState().Get(hostelID)
	if !ok {
		return Hostel{}, errors.New("hostel: not found")
	}
	out, err := applyHostelVacate(cur, studentID, hostelNow())
	if err != nil {
		p.appendAudit("hostel-warden", "hostel.vacate.denied", hostelID, "deny", err.Error())
		return Hostel{}, err
	}
	if _, err := hostelState().Upsert(out); err != nil {
		return Hostel{}, err
	}
	p.appendAudit("hostel-warden", "hostel.vacate", hostelID, "executed", fmt.Sprintf("%s ← %d/%d", studentID, out.Occupied(), out.Capacity))
	return out, nil
}

// CloseHostel closes an empty hostel. Audited.
func (p *Platform) CloseHostel(hostelID string) (Hostel, error) {
	cur, ok := hostelState().Get(hostelID)
	if !ok {
		return Hostel{}, errors.New("hostel: not found")
	}
	out, err := applyHostelClose(cur, hostelNow())
	if err != nil {
		p.appendAudit("hostel-warden", "hostel.close.denied", hostelID, "deny", err.Error())
		return Hostel{}, err
	}
	if _, err := hostelState().Upsert(out); err != nil {
		return Hostel{}, err
	}
	p.appendAudit("hostel-warden", "hostel.close", hostelID, "executed", "closed")
	return out, nil
}

// HostelRecord returns a single hostel by id.
func (p *Platform) HostelRecord(id string) (Hostel, bool) { return hostelState().Get(id) }

// HostelDashboard is the jurisdiction-scoped welfare picture: hostels, capacity/occupancy, occupancy %, by type,
// and the near-full worklist (≥90% occupied). Downward-governance scoped.
type HostelDashboard struct {
	Scope        string         `json:"scope"`
	Hostels      int            `json:"hostels"`
	Capacity     int            `json:"capacity"`
	Occupied     int            `json:"occupied"`
	OccupancyPct float64        `json:"occupancy_pct"`
	ByType       map[string]int `json:"by_type"`
	NearFull     []Hostel       `json:"near_full,omitempty"`
	Synthetic    bool           `json:"synthetic"`
}

// HostelDashboard rolls up hostels across the schools a tenant node governs (fail-closed for others).
func (p *Platform) HostelDashboard(scopeOrg string) HostelDashboard {
	d := HostelDashboard{Scope: scopeOrg, ByType: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, ho := range hostelState().List(hostelFilter{}) {
		if !h.Governs(scopeOrg, ho.OrgUnit) {
			continue
		}
		d.Hostels++
		d.Capacity += ho.Capacity
		d.Occupied += ho.Occupied()
		d.ByType[ho.Type]++
		if ho.Capacity > 0 && float64(ho.Occupied())/float64(ho.Capacity) >= 0.9 {
			d.NearFull = append(d.NearFull, ho)
		}
	}
	if d.Capacity > 0 {
		d.OccupancyPct = float64(d.Occupied) / float64(d.Capacity) * 100
	}
	return d
}

// ScopedHostels lists hostels a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedHostels(scopeOrg, status string) []Hostel {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []Hostel
	for _, ho := range hostelState().List(hostelFilter{Status: status}) {
		if h.Governs(scopeOrg, ho.OrgUnit) {
			out = append(out, ho)
		}
	}
	return out
}

// seedHostel plants a boys' + a girls' hostel per school across more than one district, partly occupied (one near
// full so the near-full analytics have signal). Synthetic SYN- ids only.
func seedHostel(s hostelStore) {
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
			kind     string
			capacity int
			filled   int
		}{
			{"boys", 50, 47}, // near full (94%)
			{"girls", 50, 38},
		}
		for hi, sp := range specs {
			h := Hostel{
				ID: fmt.Sprintf("HOS-%s-%s", tag, sp.kind), OrgUnit: school, Name: fmt.Sprintf("%s Welfare Hostel", sp.kind),
				Type: sp.kind, Capacity: sp.capacity, Status: HostelOpen, CreatedOn: "2026-06-01", UpdatedAt: hostelNow(),
			}
			for f := 0; f < sp.filled; f++ {
				h.Residents = append(h.Residents, Resident{StudentID: fmt.Sprintf("SYN-S-%s-%s-%03d", tag, sp.kind, f+1), AllottedOn: "2026-06-02"})
			}
			_ = hi
			s.Upsert(h)
		}
	}
}

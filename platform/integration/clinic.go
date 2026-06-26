package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sort"
	"sync"
)

// School Health Clinic is an L6 student-welfare vertical for the day-to-day sick room (distinct from the periodic
// RBSK screening camps): a student reports a complaint, the nurse records first-aid/treatment, and the visit is
// closed with an outcome (recovered, referred onward, or sent home). It is durable, audited, and enforces three
// hard invariants server-side:
//   - SINGLE OPEN VISIT: a student can have at most one open visit across ALL governed clinics — a second
//     concurrent visit is rejected (no double sick-room presence).
//   - OUTCOME GATE: a visit cannot be closed without a recorded outcome (recovered | referred | sent_home).
//   - REFERRAL DESTINATION: closing with a referral requires a destination (e.g. PHC/RBSK/hospital).
// Treatments are embedded on the visit (like hostel residents). Downward-governance scoped. Synthetic SYN- ids
// only, never real PII.

// Visit status.
const (
	ClinicOpen   = "open"
	ClinicClosed = "closed"
)

func validClinicOutcome(o string) bool {
	switch o {
	case "recovered", "referred", "sent_home":
		return true
	}
	return false
}

// Treatment is one first-aid / medicine entry recorded during a visit.
type Treatment struct {
	Note    string `json:"note"`
	GivenOn string `json:"given_on"`
}

// ClinicVisit is one sick-room visit with its embedded treatments and outcome.
type ClinicVisit struct {
	ID          string      `json:"id"`
	OrgUnit     string      `json:"org_unit"`
	StudentID   string      `json:"student_id"`
	Complaint   string      `json:"complaint"`
	Treatments  []Treatment `json:"treatments,omitempty"`
	Outcome     string      `json:"outcome,omitempty"`
	Destination string      `json:"destination,omitempty"`
	ReportedAt  string      `json:"reported_at"`
	ClosedAt    string      `json:"closed_at,omitempty"`
	Status      string      `json:"status"`
	CreatedOn   string      `json:"created_on"`
	UpdatedAt   string      `json:"updated_at"`
}

// Validate checks a visit's required fields.
func (v ClinicVisit) Validate() error {
	if v.ID == "" || v.OrgUnit == "" {
		return errors.New("clinic: id and org_unit are required")
	}
	if v.StudentID == "" {
		return errors.New("clinic: a student_id is required")
	}
	if v.Complaint == "" {
		return errors.New("clinic: a complaint is required")
	}
	return nil
}

// applyTreat records a treatment — rejected once the visit is closed.
func applyTreat(v ClinicVisit, note, now string) (ClinicVisit, error) {
	if v.Status != ClinicOpen {
		return ClinicVisit{}, fmt.Errorf("clinic: %s is closed — cannot record treatment", v.ID)
	}
	if note == "" {
		return ClinicVisit{}, errors.New("clinic: a treatment note is required")
	}
	v.Treatments = append(v.Treatments, Treatment{Note: note, GivenOn: "2026-06-25"})
	v.UpdatedAt = now
	return v, nil
}

// applyCloseVisit closes a visit with an outcome — rejected without a valid outcome, or a referral without a
// destination, or if already closed.
func applyCloseVisit(v ClinicVisit, outcome, destination, now string) (ClinicVisit, error) {
	if v.Status != ClinicOpen {
		return ClinicVisit{}, fmt.Errorf("clinic: %s is already closed", v.ID)
	}
	if !validClinicOutcome(outcome) {
		return ClinicVisit{}, errors.New("clinic: outcome must be recovered, referred or sent_home")
	}
	if outcome == "referred" && destination == "" {
		return ClinicVisit{}, errors.New("clinic: a referral requires a destination")
	}
	v.Outcome = outcome
	v.Destination = destination
	v.ClosedAt = now
	v.Status = ClinicClosed
	v.UpdatedAt = now
	return v, nil
}

type clinicFilter struct{ OrgUnit, Status, Outcome string }

func matchClinic(f clinicFilter, v ClinicVisit) bool {
	if f.OrgUnit != "" && v.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Status != "" && v.Status != f.Status {
		return false
	}
	if f.Outcome != "" && v.Outcome != f.Outcome {
		return false
	}
	return true
}

// clinicStore is the persistence port. *memClinicStore and *pgClinicStore satisfy it.
type clinicStore interface {
	Upsert(ClinicVisit) (ClinicVisit, error)
	Get(id string) (ClinicVisit, bool)
	List(clinicFilter) []ClinicVisit
}

type memClinicStore struct {
	mu sync.Mutex
	m  map[string]ClinicVisit
}

func newMemClinicStore() *memClinicStore { return &memClinicStore{m: map[string]ClinicVisit{}} }

func (s *memClinicStore) Upsert(v ClinicVisit) (ClinicVisit, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[v.ID] = v
	return v, nil
}

func (s *memClinicStore) Get(id string) (ClinicVisit, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	v, ok := s.m[id]
	return v, ok
}

func (s *memClinicStore) List(f clinicFilter) []ClinicVisit {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]ClinicVisit, 0, len(s.m))
	for _, v := range s.m {
		if matchClinic(f, v) {
			out = append(out, v)
		}
	}
	return out
}

var (
	clinicOnce sync.Once
	clinicBack clinicStore
)

func clinicState() clinicStore {
	clinicOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgClinicStore(dsn); err == nil {
				clinicBack = pg
				log.Printf("clinic: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("clinic: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				clinicBack = newMemClinicStore()
			}
		} else {
			clinicBack = newMemClinicStore()
		}
		seedClinic(clinicBack)
	})
	return clinicBack
}

func clinicNow() string { return "2026-06-25T10:00:00Z" }

// studentOpenVisit returns the id of a student's currently-open visit (statewide), or "" if none.
func studentOpenVisit(studentID string) string {
	for _, v := range clinicState().List(clinicFilter{Status: ClinicOpen}) {
		if v.StudentID == studentID {
			return v.ID
		}
	}
	return ""
}

// OpenClinicVisit records a new sick-room visit — rejecting a second concurrent open visit for the student. Audited.
func (p *Platform) OpenClinicVisit(v ClinicVisit) (ClinicVisit, error) {
	v.Status = ClinicOpen
	v.Outcome = ""
	v.ClosedAt = ""
	if v.ReportedAt == "" {
		v.ReportedAt = clinicNow()
	}
	if v.CreatedOn == "" {
		v.CreatedOn = "2026-06-25"
	}
	v.UpdatedAt = clinicNow()
	if err := v.Validate(); err != nil {
		p.appendAudit("school-nurse", "clinic.open.denied", v.OrgUnit, "deny", err.Error())
		return ClinicVisit{}, err
	}
	if other := studentOpenVisit(v.StudentID); other != "" {
		err := fmt.Errorf("clinic: %s already has an open visit %s (single open visit)", v.StudentID, other)
		p.appendAudit("school-nurse", "clinic.open.denied", v.OrgUnit, "deny", err.Error())
		return ClinicVisit{}, err
	}
	out, err := clinicState().Upsert(v)
	if err != nil {
		return ClinicVisit{}, err
	}
	p.appendAudit("school-nurse", "clinic.open", v.ID, "executed", fmt.Sprintf("%s: %s", v.StudentID, v.Complaint))
	return out, nil
}

// TreatClinicVisit records a treatment on an open visit. Audited.
func (p *Platform) TreatClinicVisit(id, note string) (ClinicVisit, error) {
	cur, ok := clinicState().Get(id)
	if !ok {
		return ClinicVisit{}, errors.New("clinic: not found")
	}
	out, err := applyTreat(cur, note, clinicNow())
	if err != nil {
		p.appendAudit("school-nurse", "clinic.treat.denied", id, "deny", err.Error())
		return ClinicVisit{}, err
	}
	if _, err := clinicState().Upsert(out); err != nil {
		return ClinicVisit{}, err
	}
	p.appendAudit("school-nurse", "clinic.treat", id, "executed", note)
	return out, nil
}

// CloseClinicVisit closes a visit with an outcome — rejecting a missing outcome or a referral without a
// destination. Audited.
func (p *Platform) CloseClinicVisit(id, outcome, destination string) (ClinicVisit, error) {
	cur, ok := clinicState().Get(id)
	if !ok {
		return ClinicVisit{}, errors.New("clinic: not found")
	}
	out, err := applyCloseVisit(cur, outcome, destination, clinicNow())
	if err != nil {
		p.appendAudit("school-nurse", "clinic.close.denied", id, "deny", err.Error())
		return ClinicVisit{}, err
	}
	if _, err := clinicState().Upsert(out); err != nil {
		return ClinicVisit{}, err
	}
	p.appendAudit("school-nurse", "clinic.close", id, "executed", outcome)
	return out, nil
}

// ClinicVisitRecord returns a single visit by id.
func (p *Platform) ClinicVisitRecord(id string) (ClinicVisit, bool) { return clinicState().Get(id) }

// ClinicDashboard is the jurisdiction-scoped sick-room picture: visits by status/outcome, currently-open
// (in sick room now), referral count, and the open worklist. Downward-governance scoped.
type ClinicDashboard struct {
	Scope     string         `json:"scope"`
	Visits    int            `json:"visits"`
	OpenNow   int            `json:"open_now"`
	ByOutcome map[string]int `json:"by_outcome"`
	Referrals int            `json:"referrals"`
	OpenList  []ClinicVisit  `json:"open_list,omitempty"`
	Synthetic bool           `json:"synthetic"`
}

// ClinicDashboard rolls up visits across the schools a tenant node governs (fail-closed for others).
func (p *Platform) ClinicDashboard(scopeOrg string) ClinicDashboard {
	d := ClinicDashboard{Scope: scopeOrg, ByOutcome: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, v := range clinicState().List(clinicFilter{}) {
		if !h.Governs(scopeOrg, v.OrgUnit) {
			continue
		}
		d.Visits++
		if v.Status == ClinicOpen {
			d.OpenNow++
			d.OpenList = append(d.OpenList, v)
		} else {
			d.ByOutcome[v.Outcome]++
			if v.Outcome == "referred" {
				d.Referrals++
			}
		}
	}
	sort.Slice(d.OpenList, func(i, j int) bool { return d.OpenList[i].ID < d.OpenList[j].ID })
	return d
}

// ScopedClinicVisits lists visits a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedClinicVisits(scopeOrg, status string) []ClinicVisit {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []ClinicVisit
	for _, v := range clinicState().List(clinicFilter{Status: status}) {
		if h.Governs(scopeOrg, v.OrgUnit) {
			out = append(out, v)
		}
	}
	return out
}

// seedClinic plants visits per school across more than one district: one open (in the sick room now), one closed
// as recovered, and one closed as a referral. Synthetic SYN- ids only.
func seedClinic(s clinicStore) {
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

		// Open visit — headache, treated, still in sick room.
		open := ClinicVisit{
			ID: fmt.Sprintf("CLN-%s-01", tag), OrgUnit: school, StudentID: fmt.Sprintf("SYN-S-%s-C01", tag),
			Complaint: "Headache", ReportedAt: clinicNow(), Status: ClinicOpen, CreatedOn: "2026-06-25", UpdatedAt: clinicNow(),
		}
		open, _ = applyTreat(open, "Rest + ORS", clinicNow())
		s.Upsert(open)

		// Closed — recovered.
		rec := ClinicVisit{
			ID: fmt.Sprintf("CLN-%s-02", tag), OrgUnit: school, StudentID: fmt.Sprintf("SYN-S-%s-C02", tag),
			Complaint: "Minor cut", ReportedAt: "2026-06-25T09:10:00Z", Status: ClinicOpen, CreatedOn: "2026-06-25", UpdatedAt: clinicNow(),
		}
		rec, _ = applyTreat(rec, "Antiseptic + dressing", clinicNow())
		rec, _ = applyCloseVisit(rec, "recovered", "", clinicNow())
		s.Upsert(rec)

		// Closed — referred to PHC.
		ref := ClinicVisit{
			ID: fmt.Sprintf("CLN-%s-03", tag), OrgUnit: school, StudentID: fmt.Sprintf("SYN-S-%s-C03", tag),
			Complaint: "High fever", ReportedAt: "2026-06-25T08:40:00Z", Status: ClinicOpen, CreatedOn: "2026-06-25", UpdatedAt: clinicNow(),
		}
		ref, _ = applyCloseVisit(ref, "referred", "PHC-"+tag, clinicNow())
		s.Upsert(ref)
	}
}

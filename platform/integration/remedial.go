package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sort"
	"sync"
)

// Diagnostic & Remedial Learning is an L6 academic vertical for NIPUN Bharat / FLN (Foundational Literacy &
// Numeracy): students are diagnosed onto a learning level, and those below the proficiency target are grouped
// into capped remedial batches until they reach it. It is durable, audited, and enforces four hard invariants
// server-side:
//   - CAPACITY: a batch's active enrolment can never exceed its sanctioned capacity.
//   - ELIGIBILITY GATE: only a student below the batch's proficiency target may be enrolled (you cannot place an
//     already-proficient child in remedial).
//   - UNIQUE ENROLMENT: a student can hold at most one active enrolment in a batch.
//   - PROFICIENCY (GRADUATION) GATE: a student can only exit (graduate from) a batch once re-assessed at or above
//     the proficiency target.
// Enrolments are embedded on the batch (like hostel residents). Downward-governance scoped. Synthetic SYN- ids
// only, never real PII.

// Batch status.
const (
	RemedialOpen   = "open"
	RemedialClosed = "closed"
)

func validRemedialSubject(s string) bool {
	switch s {
	case "literacy", "numeracy":
		return true
	}
	return false
}

// RemedialEnrollment is one student in a remedial batch, carrying their diagnostic level and exit state.
type RemedialEnrollment struct {
	StudentID  string `json:"student_id"`
	Level      int    `json:"level"` // diagnostic level at enrolment (0..target-1)
	Exited     bool   `json:"exited"`
	ExitLevel  int    `json:"exit_level,omitempty"`
	EnrolledOn string `json:"enrolled_on"`
}

// RemedialBatch is one capped remedial group for an FLN subject, targeting a proficiency level.
type RemedialBatch struct {
	ID          string               `json:"id"`
	OrgUnit     string               `json:"org_unit"`
	Subject     string               `json:"subject"`      // literacy | numeracy
	TargetLevel int                  `json:"target_level"` // proficiency target (1..5)
	Capacity    int                  `json:"capacity"`
	Enrollments []RemedialEnrollment `json:"enrollments,omitempty"`
	Status      string               `json:"status"`
	CreatedOn   string               `json:"created_on"`
	UpdatedAt   string               `json:"updated_at"`
}

// ActiveCount is the number of students still enrolled (not yet graduated/exited).
func (b RemedialBatch) ActiveCount() int {
	n := 0
	for _, e := range b.Enrollments {
		if !e.Exited {
			n++
		}
	}
	return n
}

// Validate checks a batch's required fields.
func (b RemedialBatch) Validate() error {
	if b.ID == "" || b.OrgUnit == "" {
		return errors.New("remedial: id and org_unit are required")
	}
	if !validRemedialSubject(b.Subject) {
		return errors.New("remedial: subject must be literacy or numeracy")
	}
	if b.TargetLevel < 1 || b.TargetLevel > 5 {
		return errors.New("remedial: target_level must be between 1 and 5")
	}
	if b.Capacity < 1 {
		return errors.New("remedial: capacity must be at least 1")
	}
	return nil
}

func (b RemedialBatch) activeIndex(studentID string) int {
	for i := range b.Enrollments {
		if b.Enrollments[i].StudentID == studentID && !b.Enrollments[i].Exited {
			return i
		}
	}
	return -1
}

// applyEnroll enrolls a student — rejecting a closed batch, over-capacity, a duplicate active enrolment, or an
// already-proficient student (eligibility gate).
func applyEnroll(b RemedialBatch, studentID string, level int, now string) (RemedialBatch, error) {
	if b.Status != RemedialOpen {
		return RemedialBatch{}, errors.New("remedial: cannot enrol in a closed batch")
	}
	if studentID == "" {
		return RemedialBatch{}, errors.New("remedial: a student_id is required")
	}
	if level < 0 {
		return RemedialBatch{}, errors.New("remedial: level must be non-negative")
	}
	if level >= b.TargetLevel {
		return RemedialBatch{}, fmt.Errorf("remedial: %s is at level %d (≥ target %d) — not remedial-eligible", studentID, level, b.TargetLevel)
	}
	if b.ActiveCount() >= b.Capacity {
		return RemedialBatch{}, fmt.Errorf("remedial: %s is full (%d/%d) — no over-enrolment", b.ID, b.ActiveCount(), b.Capacity)
	}
	if b.activeIndex(studentID) >= 0 {
		return RemedialBatch{}, fmt.Errorf("remedial: %s is already enrolled in %s", studentID, b.ID)
	}
	b.Enrollments = append(b.Enrollments, RemedialEnrollment{StudentID: studentID, Level: level, EnrolledOn: "2026-06-25"})
	b.UpdatedAt = now
	return b, nil
}

// applyGraduate exits a student — rejected unless re-assessed at or above the proficiency target.
func applyGraduate(b RemedialBatch, studentID string, exitLevel int, now string) (RemedialBatch, error) {
	idx := b.activeIndex(studentID)
	if idx < 0 {
		return RemedialBatch{}, fmt.Errorf("remedial: %s is not actively enrolled in %s", studentID, b.ID)
	}
	if exitLevel < b.TargetLevel {
		return RemedialBatch{}, fmt.Errorf("remedial: %s at level %d has not reached target %d — cannot graduate", studentID, exitLevel, b.TargetLevel)
	}
	b.Enrollments[idx].Exited = true
	b.Enrollments[idx].ExitLevel = exitLevel
	b.UpdatedAt = now
	return b, nil
}

// applyCloseBatch closes a batch (no further enrolment).
func applyCloseBatch(b RemedialBatch, now string) (RemedialBatch, error) {
	b.Status = RemedialClosed
	b.UpdatedAt = now
	return b, nil
}

type remedialFilter struct{ OrgUnit, Subject, Status string }

func matchRemedial(f remedialFilter, b RemedialBatch) bool {
	if f.OrgUnit != "" && b.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Subject != "" && b.Subject != f.Subject {
		return false
	}
	if f.Status != "" && b.Status != f.Status {
		return false
	}
	return true
}

// remedialStore is the persistence port. *memRemedialStore and *pgRemedialStore satisfy it.
type remedialStore interface {
	Upsert(RemedialBatch) (RemedialBatch, error)
	Get(id string) (RemedialBatch, bool)
	List(remedialFilter) []RemedialBatch
}

type memRemedialStore struct {
	mu sync.Mutex
	m  map[string]RemedialBatch
}

func newMemRemedialStore() *memRemedialStore { return &memRemedialStore{m: map[string]RemedialBatch{}} }

func (s *memRemedialStore) Upsert(b RemedialBatch) (RemedialBatch, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[b.ID] = b
	return b, nil
}

func (s *memRemedialStore) Get(id string) (RemedialBatch, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	b, ok := s.m[id]
	return b, ok
}

func (s *memRemedialStore) List(f remedialFilter) []RemedialBatch {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]RemedialBatch, 0, len(s.m))
	for _, b := range s.m {
		if matchRemedial(f, b) {
			out = append(out, b)
		}
	}
	return out
}

var (
	remedialOnce sync.Once
	remedialBack remedialStore
)

func remedialState() remedialStore {
	remedialOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgRemedialStore(dsn); err == nil {
				remedialBack = pg
				log.Printf("remedial: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("remedial: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				remedialBack = newMemRemedialStore()
			}
		} else {
			remedialBack = newMemRemedialStore()
		}
		seedRemedial(remedialBack)
	})
	return remedialBack
}

func remedialNow() string { return "2026-06-25T00:00:00Z" }

// CreateRemedialBatch records a new remedial batch (status open). Audited.
func (p *Platform) CreateRemedialBatch(b RemedialBatch) (RemedialBatch, error) {
	b.Status = RemedialOpen
	b.Enrollments = nil
	if b.CreatedOn == "" {
		b.CreatedOn = "2026-06-25"
	}
	b.UpdatedAt = remedialNow()
	if err := b.Validate(); err != nil {
		p.appendAudit("fln-coordinator", "remedial.create.denied", b.OrgUnit, "deny", err.Error())
		return RemedialBatch{}, err
	}
	out, err := remedialState().Upsert(b)
	if err != nil {
		return RemedialBatch{}, err
	}
	p.appendAudit("fln-coordinator", "remedial.create", b.ID, "executed", fmt.Sprintf("%s target %d cap %d", b.Subject, b.TargetLevel, b.Capacity))
	return out, nil
}

// EnrolRemedial enrols a student — rejecting over-capacity, a duplicate, or an already-proficient student. Audited.
func (p *Platform) EnrolRemedial(id, studentID string, level int) (RemedialBatch, error) {
	cur, ok := remedialState().Get(id)
	if !ok {
		return RemedialBatch{}, errors.New("remedial: not found")
	}
	out, err := applyEnroll(cur, studentID, level, remedialNow())
	if err != nil {
		p.appendAudit("fln-coordinator", "remedial.enrol.denied", id, "deny", err.Error())
		return RemedialBatch{}, err
	}
	if _, err := remedialState().Upsert(out); err != nil {
		return RemedialBatch{}, err
	}
	p.appendAudit("fln-coordinator", "remedial.enrol", id, "executed", fmt.Sprintf("%s @L%d (%d/%d)", studentID, level, out.ActiveCount(), out.Capacity))
	return out, nil
}

// GraduateRemedial exits a student — rejecting a graduation below the proficiency target. Audited.
func (p *Platform) GraduateRemedial(id, studentID string, exitLevel int) (RemedialBatch, error) {
	cur, ok := remedialState().Get(id)
	if !ok {
		return RemedialBatch{}, errors.New("remedial: not found")
	}
	out, err := applyGraduate(cur, studentID, exitLevel, remedialNow())
	if err != nil {
		p.appendAudit("fln-coordinator", "remedial.graduate.denied", id, "deny", err.Error())
		return RemedialBatch{}, err
	}
	if _, err := remedialState().Upsert(out); err != nil {
		return RemedialBatch{}, err
	}
	p.appendAudit("fln-coordinator", "remedial.graduate", id, "executed", fmt.Sprintf("%s → L%d", studentID, exitLevel))
	return out, nil
}

// CloseRemedialBatch closes a batch. Audited.
func (p *Platform) CloseRemedialBatch(id string) (RemedialBatch, error) {
	cur, ok := remedialState().Get(id)
	if !ok {
		return RemedialBatch{}, errors.New("remedial: not found")
	}
	out, err := applyCloseBatch(cur, remedialNow())
	if err != nil {
		p.appendAudit("fln-coordinator", "remedial.close.denied", id, "deny", err.Error())
		return RemedialBatch{}, err
	}
	if _, err := remedialState().Upsert(out); err != nil {
		return RemedialBatch{}, err
	}
	p.appendAudit("fln-coordinator", "remedial.close", id, "executed", "closed")
	return out, nil
}

// RemedialBatchRecord returns a single batch by id.
func (p *Platform) RemedialBatchRecord(id string) (RemedialBatch, bool) {
	return remedialState().Get(id)
}

// RemedialDashboard is the jurisdiction-scoped FLN picture: batches by subject/status, active enrolment, graduated
// count, the overall graduation rate, and the near-capacity worklist. Downward-governance scoped.
type RemedialDashboard struct {
	Scope       string          `json:"scope"`
	Batches     int             `json:"batches"`
	BySubject   map[string]int  `json:"by_subject"`
	ByStatus    map[string]int  `json:"by_status"`
	Active      int             `json:"active"`
	Graduated   int             `json:"graduated"`
	GraduatePct float64         `json:"graduate_pct"`
	NearFull    []RemedialBatch `json:"near_full,omitempty"`
	Synthetic   bool            `json:"synthetic"`
}

// RemedialDashboard rolls up batches across the schools a tenant node governs (fail-closed for others).
func (p *Platform) RemedialDashboard(scopeOrg string) RemedialDashboard {
	d := RemedialDashboard{Scope: scopeOrg, BySubject: map[string]int{}, ByStatus: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, b := range remedialState().List(remedialFilter{}) {
		if !h.Governs(scopeOrg, b.OrgUnit) {
			continue
		}
		d.Batches++
		d.BySubject[b.Subject]++
		d.ByStatus[b.Status]++
		d.Active += b.ActiveCount()
		for _, e := range b.Enrollments {
			if e.Exited {
				d.Graduated++
			}
		}
		if b.Status == RemedialOpen && b.Capacity > 0 && float64(b.ActiveCount())/float64(b.Capacity) >= 0.9 {
			d.NearFull = append(d.NearFull, b)
		}
	}
	if total := d.Active + d.Graduated; total > 0 {
		d.GraduatePct = float64(d.Graduated) / float64(total) * 100
	}
	sort.Slice(d.NearFull, func(i, j int) bool { return d.NearFull[i].ID < d.NearFull[j].ID })
	return d
}

// ScopedRemedialBatches lists batches a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedRemedialBatches(scopeOrg, status string) []RemedialBatch {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []RemedialBatch
	for _, b := range remedialState().List(remedialFilter{Status: status}) {
		if h.Governs(scopeOrg, b.OrgUnit) {
			out = append(out, b)
		}
	}
	return out
}

// seedRemedial plants a literacy + a numeracy batch per school across more than one district: the literacy batch
// near full with one graduate, the numeracy batch lightly enrolled. Synthetic SYN- ids only.
func seedRemedial(s remedialStore) {
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

		// Literacy batch — target level 4, capacity 10, 9 enrolled (near full), one graduated.
		lit := RemedialBatch{
			ID: fmt.Sprintf("REM-%s-LIT", tag), OrgUnit: school, Subject: "literacy", TargetLevel: 4, Capacity: 10,
			Status: RemedialOpen, CreatedOn: "2026-06-10", UpdatedAt: remedialNow(),
		}
		for i := 0; i < 9; i++ {
			lit, _ = applyEnroll(lit, fmt.Sprintf("SYN-S-%s-L%02d", tag, i+1), 1+i%3, remedialNow())
		}
		lit, _ = applyGraduate(lit, fmt.Sprintf("SYN-S-%s-L01", tag), 4, remedialNow())
		s.Upsert(lit)

		// Numeracy batch — target level 3, capacity 12, 4 enrolled.
		num := RemedialBatch{
			ID: fmt.Sprintf("REM-%s-NUM", tag), OrgUnit: school, Subject: "numeracy", TargetLevel: 3, Capacity: 12,
			Status: RemedialOpen, CreatedOn: "2026-06-12", UpdatedAt: remedialNow(),
		}
		for i := 0; i < 4; i++ {
			num, _ = applyEnroll(num, fmt.Sprintf("SYN-S-%s-N%02d", tag, i+1), 1+i%2, remedialNow())
		}
		s.Upsert(num)
	}
}

package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sync"
	"time"
)

// Transfer Certificate (TC) is an L11 student-records vertical: when a learner leaves a school a TC is raised,
// issued with a serial number, and (if raised in error) cancelled. A learner can hold at most ONE ACTIVE TC
// (requested or issued) at a school at a time — a school cannot issue two live TCs for the same student. Durable
// to PostgreSQL; downward-governance scoped. Synthetic ids only, never real PII.

// TC status values.
const (
	TCRequested = "requested"
	TCIssued    = "issued"
	TCCancelled = "cancelled"
)

// TC reasons.
const (
	TCTransfer   = "transfer"
	TCCompletion = "completion"
	TCMigration  = "migration"
	TCWithdrawal = "withdrawal"
)

// TransferCertificate is a single TC record for a leaving student.
type TransferCertificate struct {
	ID          string `json:"id"`
	OrgUnit     string `json:"org_unit"` // the issuing school (T6 tenancy node)
	StudentID   string `json:"student_id"`
	Reason      string `json:"reason"`
	Status      string `json:"status"`
	Serial      string `json:"serial,omitempty"`    // assigned when issued
	IssuedOn    string `json:"issued_on,omitempty"` // YYYY-MM-DD when issued
	RequestedOn string `json:"requested_on"`
	Note        string `json:"note,omitempty"`
	UpdatedAt   string `json:"updated_at"`
}

func validTCReason(r string) bool {
	switch r {
	case TCTransfer, TCCompletion, TCMigration, TCWithdrawal:
		return true
	}
	return false
}

// Active reports whether the TC is still live (blocks a second TC for the same student).
func (t TransferCertificate) Active() bool { return t.Status == TCRequested || t.Status == TCIssued }

// Validate checks a TC's required fields and reason.
func (t TransferCertificate) Validate() error {
	if t.ID == "" || t.OrgUnit == "" || t.StudentID == "" {
		return errors.New("tc: id, org_unit and student_id are required")
	}
	if !validTCReason(t.Reason) {
		return errors.New("tc: invalid reason " + t.Reason)
	}
	if _, err := time.Parse("2006-01-02", t.RequestedOn); err != nil {
		return errors.New("tc: invalid requested_on (want YYYY-MM-DD)")
	}
	return nil
}

// applyTCIssue issues a requested TC with a serial number and date.
func applyTCIssue(t TransferCertificate, serial, on, now string) (TransferCertificate, error) {
	if t.Status != TCRequested {
		return TransferCertificate{}, errors.New("tc: only a requested TC can be issued")
	}
	if serial == "" {
		return TransferCertificate{}, errors.New("tc: a serial number is required to issue")
	}
	if _, err := time.Parse("2006-01-02", on); err != nil {
		return TransferCertificate{}, errors.New("tc: invalid issued_on (want YYYY-MM-DD)")
	}
	t.Status = TCIssued
	t.Serial = serial
	t.IssuedOn = on
	t.UpdatedAt = now
	return t, nil
}

// applyTCCancel cancels an active TC (raised in error).
func applyTCCancel(t TransferCertificate, note, now string) (TransferCertificate, error) {
	if !t.Active() {
		return TransferCertificate{}, errors.New("tc: only an active TC can be cancelled")
	}
	t.Status = TCCancelled
	t.Note = note
	t.UpdatedAt = now
	return t, nil
}

type tcFilter struct{ OrgUnit, Student, Status string }

func matchTC(f tcFilter, t TransferCertificate) bool {
	if f.OrgUnit != "" && t.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Student != "" && t.StudentID != f.Student {
		return false
	}
	if f.Status != "" && t.Status != f.Status {
		return false
	}
	return true
}

// tcStore is the persistence port. *memTCStore (in-memory) and *pgTCStore (PostgreSQL) satisfy it.
type tcStore interface {
	Upsert(TransferCertificate) (TransferCertificate, error)
	Get(id string) (TransferCertificate, bool)
	List(tcFilter) []TransferCertificate
}

type memTCStore struct {
	mu sync.Mutex
	m  map[string]TransferCertificate
}

func newMemTCStore() *memTCStore { return &memTCStore{m: map[string]TransferCertificate{}} }

func (s *memTCStore) Upsert(t TransferCertificate) (TransferCertificate, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[t.ID] = t
	return t, nil
}

func (s *memTCStore) Get(id string) (TransferCertificate, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	t, ok := s.m[id]
	return t, ok
}

func (s *memTCStore) List(f tcFilter) []TransferCertificate {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]TransferCertificate, 0, len(s.m))
	for _, t := range s.m {
		if matchTC(f, t) {
			out = append(out, t)
		}
	}
	return out
}

var (
	tcOnce sync.Once
	tcBack tcStore
)

func tcState() tcStore {
	tcOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgTCStore(dsn); err == nil {
				tcBack = pg
				log.Printf("tc: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("tc: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				tcBack = newMemTCStore()
			}
		} else {
			tcBack = newMemTCStore()
		}
		seedTC(tcBack)
	})
	return tcBack
}

func tcNow() string { return "2026-06-22T00:00:00Z" }

// RequestTC raises a new TC for a leaving student. Rejects a second ACTIVE TC for the same student at the school.
// Audited.
func (p *Platform) RequestTC(t TransferCertificate) (TransferCertificate, error) {
	t.Status = TCRequested
	t.UpdatedAt = tcNow()
	if t.RequestedOn == "" {
		t.RequestedOn = "2026-06-22"
	}
	if err := t.Validate(); err != nil {
		p.appendAudit("registrar", "tc.request.denied", t.OrgUnit, "deny", err.Error())
		return TransferCertificate{}, err
	}
	for _, ex := range tcState().List(tcFilter{OrgUnit: t.OrgUnit, Student: t.StudentID}) {
		if ex.ID != t.ID && ex.Active() {
			return TransferCertificate{}, fmt.Errorf("tc: %s already has an active TC at %s (%s)", t.StudentID, t.OrgUnit, ex.ID)
		}
	}
	out, err := tcState().Upsert(t)
	if err != nil {
		return TransferCertificate{}, err
	}
	p.appendAudit("registrar", "tc.request", t.ID, "executed", t.StudentID+" ("+t.Reason+")")
	return out, nil
}

// AdvanceTC walks a TC: issue (requested → issued, with serial+date) | cancel (→ cancelled). Audited.
func (p *Platform) AdvanceTC(id, action, arg1, arg2 string) (TransferCertificate, error) {
	cur, ok := tcState().Get(id)
	if !ok {
		return TransferCertificate{}, errors.New("tc: not found")
	}
	var (
		out TransferCertificate
		err error
	)
	switch action {
	case "issue":
		on := arg2
		if on == "" {
			on = "2026-06-22"
		}
		out, err = applyTCIssue(cur, arg1, on, tcNow())
	case "cancel":
		out, err = applyTCCancel(cur, arg1, tcNow())
	default:
		return TransferCertificate{}, errors.New("tc: action must be issue or cancel")
	}
	if err != nil {
		p.appendAudit("registrar", "tc.advance.denied", id, "deny", err.Error())
		return TransferCertificate{}, err
	}
	if _, err := tcState().Upsert(out); err != nil {
		return TransferCertificate{}, err
	}
	p.appendAudit("registrar", "tc.advance", id, "executed", action+"→"+out.Status)
	return out, nil
}

// TCRecord returns a single TC by id.
func (p *Platform) TCRecord(id string) (TransferCertificate, bool) { return tcState().Get(id) }

// TCDashboard is the jurisdiction-scoped TC picture: counts by status/reason, issued total, and the pending
// (requested) worklist. Downward-governance scoped.
type TCDashboard struct {
	Scope     string                `json:"scope"`
	Total     int                   `json:"total"`
	ByStatus  map[string]int        `json:"by_status"`
	ByReason  map[string]int        `json:"by_reason"`
	Issued    int                   `json:"issued"`
	Pending   []TransferCertificate `json:"pending,omitempty"` // requested, awaiting issue
	Synthetic bool                  `json:"synthetic"`
}

// TCDashboard rolls up TCs across the schools a tenant node governs (fail-closed for others).
func (p *Platform) TCDashboard(scopeOrg string) TCDashboard {
	d := TCDashboard{Scope: scopeOrg, ByStatus: map[string]int{}, ByReason: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, t := range tcState().List(tcFilter{}) {
		if !h.Governs(scopeOrg, t.OrgUnit) {
			continue
		}
		d.Total++
		d.ByStatus[t.Status]++
		d.ByReason[t.Reason]++
		if t.Status == TCIssued {
			d.Issued++
		}
		if t.Status == TCRequested {
			d.Pending = append(d.Pending, t)
		}
	}
	return d
}

// ScopedTCs lists TCs a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedTCs(scopeOrg, status string) []TransferCertificate {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []TransferCertificate
	for _, t := range tcState().List(tcFilter{Status: status}) {
		if h.Governs(scopeOrg, t.OrgUnit) {
			out = append(out, t)
		}
	}
	return out
}

// seedTC plants a few TCs across several schools over more than one district so the records roll-up spans the
// estate, with a mix of issued + pending (requested) certificates.
func seedTC(s tcStore) {
	schools := pilotSchools(4)
	if len(schools) == 0 {
		if only := tenancyLeafUnder(pilotDistrict()); only != "" {
			schools = []string{only}
		} else {
			return
		}
	}
	type rec struct {
		student string
		reason  string
		issue   bool
	}
	recs := []rec{
		{"SYN-S-101", TCTransfer, true},
		{"SYN-S-102", TCCompletion, true},
		{"SYN-S-103", TCMigration, false}, // pending
	}
	for si, school := range schools {
		tag := schoolTag(si)
		for ri, r := range recs {
			id := fmt.Sprintf("TC-%s-%02d", tag, ri+1)
			t := TransferCertificate{
				ID: id, OrgUnit: school, StudentID: r.student, Reason: r.reason,
				Status: TCRequested, RequestedOn: "2026-06-10", UpdatedAt: tcNow(),
			}
			if _, err := s.Upsert(t); err != nil {
				continue
			}
			if r.issue {
				if out, err := applyTCIssue(t, fmt.Sprintf("TC/%s/2026/%02d", tag, ri+1), "2026-06-12", tcNow()); err == nil {
					s.Upsert(out)
				}
			}
		}
	}
}

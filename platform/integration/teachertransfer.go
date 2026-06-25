package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sync"

	"github.com/vasa-eos-se-tn/platform/establishment"
)

// Teacher Transfer & Posting is an L6 HR vertical: a teacher requests a transfer from their current school to
// another, decided through a real workflow. It is durable, audited, and enforces two hard invariants server-side:
//   - SINGLE ACTIVE REQUEST: a teacher cannot have two in-flight transfer requests at once.
//   - CROSS-MODULE VACANCY GATE: a transfer can only be APPROVED into a destination school that has a sanctioned
//     VACANCY in the teacher's cadre (filled < sanctioned). This reads the live Establishment register (the same
//     sanctioned-strength source of truth as establishment.go) — you cannot post a teacher where no post is open.
// Lifecycle: requested → approved → posted (or rejected). Downward-governance scoped. Synthetic ids only.
// (Distinct from transfer.go, which is STUDENT APAAR portability — a different concern entirely.)

// Teacher-transfer status.
const (
	TTRequested = "requested"
	TTApproved  = "approved"
	TTPosted    = "posted"
	TTRejected  = "rejected"
)

// TeacherTransfer is one teacher's request to move from FromOrg to ToOrg.
type TeacherTransfer struct {
	ID          string `json:"id"`
	EmployeeID  string `json:"employee_id"`
	Name        string `json:"name"`
	Cadre       string `json:"cadre"` // must match an establishment cadre at the destination
	FromOrg     string `json:"from_org"`
	ToOrg       string `json:"to_org"`
	Reason      string `json:"reason"` // request | mutual | administrative | promotion
	Status      string `json:"status"`
	Note        string `json:"note,omitempty"`
	RequestedOn string `json:"requested_on"`
	DecidedOn   string `json:"decided_on,omitempty"`
	UpdatedAt   string `json:"updated_at"`
}

func validTeacherTransferReason(r string) bool {
	switch r {
	case "request", "mutual", "administrative", "promotion":
		return true
	}
	return false
}

// Validate checks a teacher-transfer request's required fields.
func (t TeacherTransfer) Validate() error {
	if t.ID == "" || t.EmployeeID == "" {
		return errors.New("teacher-transfer: id and employee_id are required")
	}
	if t.Cadre == "" {
		return errors.New("teacher-transfer: a cadre is required")
	}
	if t.FromOrg == "" || t.ToOrg == "" {
		return errors.New("teacher-transfer: from_org and to_org are required")
	}
	if t.FromOrg == t.ToOrg {
		return errors.New("teacher-transfer: from_org and to_org must differ")
	}
	if !validTeacherTransferReason(t.Reason) {
		return errors.New("teacher-transfer: invalid reason " + t.Reason)
	}
	return nil
}

// Active reports whether the request is still in flight (cannot start another).
func (t TeacherTransfer) Active() bool {
	return t.Status == TTRequested || t.Status == TTApproved
}

type teacherTransferFilter struct{ Employee, ToOrg, FromOrg, Status string }

func matchTeacherTransfer(f teacherTransferFilter, t TeacherTransfer) bool {
	if f.Employee != "" && t.EmployeeID != f.Employee {
		return false
	}
	if f.ToOrg != "" && t.ToOrg != f.ToOrg {
		return false
	}
	if f.FromOrg != "" && t.FromOrg != f.FromOrg {
		return false
	}
	if f.Status != "" && t.Status != f.Status {
		return false
	}
	return true
}

// teacherTransferStore is the persistence port. *memTeacherTransferStore and *pgTeacherTransferStore satisfy it.
type teacherTransferStore interface {
	Upsert(TeacherTransfer) (TeacherTransfer, error)
	Get(id string) (TeacherTransfer, bool)
	List(teacherTransferFilter) []TeacherTransfer
}

type memTeacherTransferStore struct {
	mu sync.Mutex
	m  map[string]TeacherTransfer
}

func newMemTeacherTransferStore() *memTeacherTransferStore {
	return &memTeacherTransferStore{m: map[string]TeacherTransfer{}}
}

func (s *memTeacherTransferStore) Upsert(t TeacherTransfer) (TeacherTransfer, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[t.ID] = t
	return t, nil
}

func (s *memTeacherTransferStore) Get(id string) (TeacherTransfer, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	t, ok := s.m[id]
	return t, ok
}

func (s *memTeacherTransferStore) List(f teacherTransferFilter) []TeacherTransfer {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]TeacherTransfer, 0, len(s.m))
	for _, t := range s.m {
		if matchTeacherTransfer(f, t) {
			out = append(out, t)
		}
	}
	return out
}

var (
	tchTransferOnce sync.Once
	tchTransferBack teacherTransferStore
)

func teacherTransferState() teacherTransferStore {
	tchTransferOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgTeacherTransferStore(dsn); err == nil {
				tchTransferBack = pg
				log.Printf("teacher-transfer: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("teacher-transfer: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				tchTransferBack = newMemTeacherTransferStore()
			}
		} else {
			tchTransferBack = newMemTeacherTransferStore()
		}
		seedTeacherTransfer(tchTransferBack)
	})
	return tchTransferBack
}

func teacherTransferNow() string { return "2026-06-25T00:00:00Z" }

// cadreVacancy computes the number of vacant sanctioned posts of a cadre at a school by reading the live
// Establishment register (sanctioned − filled, summed over that school's active establishments of the cadre).
func cadreVacancy(org, cadre string) int {
	ests := estabState().ListEstablishments(establishment.EstablishmentFilter{OrgUnit: org, Cadre: cadre, Status: establishment.Active})
	appts := estabState().ListAppointments(establishment.AppointmentFilter{OrgUnit: org})
	sanctioned, filled := 0, 0
	for _, e := range ests {
		sanctioned += e.Sanctioned
		filled += establishment.FilledCount(appts, e.ID)
	}
	return sanctioned - filled
}

// RequestTeacherTransfer records a new request (status requested) — rejecting a second active request. Audited.
func (p *Platform) RequestTeacherTransfer(t TeacherTransfer) (TeacherTransfer, error) {
	t.Status = TTRequested
	t.DecidedOn = ""
	if t.RequestedOn == "" {
		t.RequestedOn = "2026-06-25"
	}
	t.UpdatedAt = teacherTransferNow()
	if err := t.Validate(); err != nil {
		p.appendAudit("hr-officer", "teacher-transfer.request.denied", t.EmployeeID, "deny", err.Error())
		return TeacherTransfer{}, err
	}
	for _, ex := range teacherTransferState().List(teacherTransferFilter{Employee: t.EmployeeID}) {
		if ex.Active() {
			err := fmt.Errorf("teacher-transfer: %s already has an active transfer request (%s)", t.EmployeeID, ex.ID)
			p.appendAudit("hr-officer", "teacher-transfer.request.denied", t.EmployeeID, "deny", err.Error())
			return TeacherTransfer{}, err
		}
	}
	out, err := teacherTransferState().Upsert(t)
	if err != nil {
		return TeacherTransfer{}, err
	}
	p.appendAudit("hr-officer", "teacher-transfer.request", t.ID, "executed", fmt.Sprintf("%s %s→%s (%s)", t.EmployeeID, t.FromOrg, t.ToOrg, t.Reason))
	return out, nil
}

// ApproveTeacherTransfer approves a requested transfer — rejected unless the destination has a sanctioned vacancy
// in the teacher's cadre (cross-module gate against the Establishment register). Audited.
func (p *Platform) ApproveTeacherTransfer(id string) (TeacherTransfer, error) {
	cur, ok := teacherTransferState().Get(id)
	if !ok {
		return TeacherTransfer{}, errors.New("teacher-transfer: not found")
	}
	if cur.Status != TTRequested {
		err := fmt.Errorf("teacher-transfer: only a requested transfer can be approved (is %s)", cur.Status)
		p.appendAudit("hr-officer", "teacher-transfer.approve.denied", id, "deny", err.Error())
		return TeacherTransfer{}, err
	}
	if v := cadreVacancy(cur.ToOrg, cur.Cadre); v <= 0 {
		err := fmt.Errorf("teacher-transfer: no sanctioned vacancy for cadre %q at %s — cannot post (filled posts are at sanctioned strength)", cur.Cadre, cur.ToOrg)
		p.appendAudit("hr-officer", "teacher-transfer.approve.denied", id, "deny", err.Error())
		return TeacherTransfer{}, err
	}
	cur.Status = TTApproved
	cur.DecidedOn = "2026-06-25"
	cur.UpdatedAt = teacherTransferNow()
	if _, err := teacherTransferState().Upsert(cur); err != nil {
		return TeacherTransfer{}, err
	}
	p.appendAudit("hr-officer", "teacher-transfer.approve", id, "executed", fmt.Sprintf("→%s (cadre %s)", cur.ToOrg, cur.Cadre))
	return cur, nil
}

// PostTeacherTransfer finalises an approved transfer (the teacher is now posted at the destination). Audited.
func (p *Platform) PostTeacherTransfer(id string) (TeacherTransfer, error) {
	cur, ok := teacherTransferState().Get(id)
	if !ok {
		return TeacherTransfer{}, errors.New("teacher-transfer: not found")
	}
	if cur.Status != TTApproved {
		err := errors.New("teacher-transfer: only an approved transfer can be posted")
		p.appendAudit("hr-officer", "teacher-transfer.post.denied", id, "deny", err.Error())
		return TeacherTransfer{}, err
	}
	cur.Status = TTPosted
	cur.UpdatedAt = teacherTransferNow()
	if _, err := teacherTransferState().Upsert(cur); err != nil {
		return TeacherTransfer{}, err
	}
	p.appendAudit("hr-officer", "teacher-transfer.post", id, "executed", fmt.Sprintf("%s posted at %s", cur.EmployeeID, cur.ToOrg))
	return cur, nil
}

// RejectTeacherTransfer rejects a requested transfer with a note. Audited.
func (p *Platform) RejectTeacherTransfer(id, note string) (TeacherTransfer, error) {
	cur, ok := teacherTransferState().Get(id)
	if !ok {
		return TeacherTransfer{}, errors.New("teacher-transfer: not found")
	}
	if cur.Status != TTRequested {
		err := errors.New("teacher-transfer: only a requested transfer can be rejected")
		p.appendAudit("hr-officer", "teacher-transfer.reject.denied", id, "deny", err.Error())
		return TeacherTransfer{}, err
	}
	cur.Status = TTRejected
	cur.Note = note
	cur.DecidedOn = "2026-06-25"
	cur.UpdatedAt = teacherTransferNow()
	if _, err := teacherTransferState().Upsert(cur); err != nil {
		return TeacherTransfer{}, err
	}
	p.appendAudit("hr-officer", "teacher-transfer.reject", id, "executed", note)
	return cur, nil
}

// TeacherTransferRecord returns a single request by id.
func (p *Platform) TeacherTransferRecord(id string) (TeacherTransfer, bool) {
	return teacherTransferState().Get(id)
}

// TeacherTransferDashboard is the jurisdiction-scoped HR picture: requests by status/reason, posted count, and the
// pending-decision worklist. Scoped by the DESTINATION school (where the posting lands).
type TeacherTransferDashboard struct {
	Scope       string            `json:"scope"`
	Total       int               `json:"total"`
	ByStatus    map[string]int    `json:"by_status"`
	ByReason    map[string]int    `json:"by_reason"`
	Posted      int               `json:"posted"`
	PendingWork []TeacherTransfer `json:"pending_work,omitempty"`
	Synthetic   bool              `json:"synthetic"`
}

// TeacherTransferDashboard rolls up transfer requests destined for the schools a tenant node governs (fail-closed).
func (p *Platform) TeacherTransferDashboard(scopeOrg string) TeacherTransferDashboard {
	d := TeacherTransferDashboard{Scope: scopeOrg, ByStatus: map[string]int{}, ByReason: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, t := range teacherTransferState().List(teacherTransferFilter{}) {
		if !h.Governs(scopeOrg, t.ToOrg) {
			continue
		}
		d.Total++
		d.ByStatus[t.Status]++
		d.ByReason[t.Reason]++
		if t.Status == TTPosted {
			d.Posted++
		}
		if t.Status == TTRequested {
			d.PendingWork = append(d.PendingWork, t)
		}
	}
	return d
}

// ScopedTeacherTransfers lists transfer requests destined for schools a tenant node governs (optionally by status).
func (p *Platform) ScopedTeacherTransfers(scopeOrg, status string) []TeacherTransfer {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []TeacherTransfer
	for _, t := range teacherTransferState().List(teacherTransferFilter{Status: status}) {
		if h.Governs(scopeOrg, t.ToOrg) {
			out = append(out, t)
		}
	}
	return out
}

// seedTeacherTransfer plants requests across schools over more than one district: one posted (into a school that
// the establishment seed leaves with a vacancy) and one pending request, leaving the cross-module gate
// exercisable live. Synthetic ids only.
func seedTeacherTransfer(s teacherTransferStore) {
	schools := pilotSchools(4)
	if len(schools) < 2 {
		return
	}
	const cadre = "Graduate Teacher (BT)"
	// Move a teacher from school 1 → school 0 (the establishment seed leaves school 0 with vacancies).
	posted := TeacherTransfer{
		ID: "TT-CHN-01", EmployeeID: "SYN-T-CHN-IN", Name: "SYN Transferring Teacher", Cadre: cadre,
		FromOrg: schools[1], ToOrg: schools[0], Reason: "request", RequestedOn: "2026-05-20", UpdatedAt: teacherTransferNow(),
	}
	posted.Status = TTRequested
	if err := posted.Validate(); err == nil {
		s.Upsert(posted)
		if v := cadreVacancy(posted.ToOrg, posted.Cadre); v > 0 {
			posted.Status = TTApproved
			posted.DecidedOn = "2026-05-25"
			s.Upsert(posted)
			posted.Status = TTPosted
			s.Upsert(posted)
		}
	}
	// A pending mutual-transfer request awaiting decision.
	pending := TeacherTransfer{
		ID: "TT-CHN-02", EmployeeID: "SYN-T-CHN-REQ", Name: "SYN Requesting Teacher", Cadre: cadre,
		FromOrg: schools[1], ToOrg: schools[0], Reason: "mutual", RequestedOn: "2026-06-18", UpdatedAt: teacherTransferNow(),
		Status: TTRequested,
	}
	if err := pending.Validate(); err == nil {
		s.Upsert(pending)
	}
}

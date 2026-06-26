package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sort"
	"sync"
)

// Co-curricular Registration is an L6 student-activity vertical: schools open seat-capped events (sports trials,
// arts workshops, club excursions) and register students fairly — confirming up to the seat cap and waitlisting
// the rest, with automatic FIFO promotion when a confirmed seat frees up. It is durable, audited, and enforces
// four hard invariants server-side:
//   - REGISTRATION WINDOW: no registration once the event is closed.
//   - UNIQUE REGISTRATION: a student can hold at most one active registration (confirmed or waitlisted) per event.
//   - SEAT CAP: confirmed registrations can never exceed the seat cap.
//   - FAIR AUTO-PROMOTION: when a confirmed seat is vacated, the earliest waitlisted student is promoted — a
//     confirmed seat is never left empty while the waitlist is non-empty.
// Registrations are embedded on the event (like hostel residents). Downward-governance scoped. Synthetic SYN-
// ids only, never real PII.

// Event status.
const (
	EventOpen   = "open"
	EventClosed = "closed"
)

// Registration state.
const (
	RegConfirmed  = "confirmed"
	RegWaitlisted = "waitlisted"
	RegWithdrawn  = "withdrawn"
)

func validEventCategory(c string) bool {
	switch c {
	case "sports", "arts", "club", "excursion", "workshop":
		return true
	}
	return false
}

// Registration is one student's registration in an event, carrying its state and FIFO order.
type Registration struct {
	StudentID    string `json:"student_id"`
	State        string `json:"state"` // confirmed | waitlisted | withdrawn
	Seq          int    `json:"seq"`   // monotonic registration order (FIFO)
	RegisteredOn string `json:"registered_on"`
}

// ActivityEvent is one seat-capped co-curricular event with its registrations.
type ActivityEvent struct {
	ID            string         `json:"id"`
	OrgUnit       string         `json:"org_unit"`
	Name          string         `json:"name"`
	Category      string         `json:"category"`
	SeatCap       int            `json:"seat_cap"`
	EventDate     string         `json:"event_date"`
	Registrations []Registration `json:"registrations,omitempty"`
	NextSeq       int            `json:"next_seq"`
	Status        string         `json:"status"`
	CreatedOn     string         `json:"created_on"`
	UpdatedAt     string         `json:"updated_at"`
}

// ConfirmedCount / WaitlistedCount report current active registrations by state.
func (e ActivityEvent) ConfirmedCount() int  { return e.countState(RegConfirmed) }
func (e ActivityEvent) WaitlistedCount() int { return e.countState(RegWaitlisted) }

func (e ActivityEvent) countState(state string) int {
	n := 0
	for _, r := range e.Registrations {
		if r.State == state {
			n++
		}
	}
	return n
}

// Validate checks an event's required fields.
func (e ActivityEvent) Validate() error {
	if e.ID == "" || e.OrgUnit == "" {
		return errors.New("registration: id and org_unit are required")
	}
	if e.Name == "" {
		return errors.New("registration: a name is required")
	}
	if !validEventCategory(e.Category) {
		return errors.New("registration: category must be sports, arts, club, excursion or workshop")
	}
	if e.SeatCap < 1 {
		return errors.New("registration: seat_cap must be at least 1")
	}
	return nil
}

func (e ActivityEvent) activeIndex(studentID string) int {
	for i := range e.Registrations {
		if e.Registrations[i].StudentID == studentID && e.Registrations[i].State != RegWithdrawn {
			return i
		}
	}
	return -1
}

// earliestWaitlistedIndex returns the index of the lowest-seq waitlisted registration, or -1.
func (e ActivityEvent) earliestWaitlistedIndex() int {
	best, bestSeq := -1, 0
	for i := range e.Registrations {
		if e.Registrations[i].State != RegWaitlisted {
			continue
		}
		if best == -1 || e.Registrations[i].Seq < bestSeq {
			best, bestSeq = i, e.Registrations[i].Seq
		}
	}
	return best
}

// applyRegister registers a student — confirming up to the seat cap, else waitlisting. Rejected if the event is
// closed or the student already has an active registration.
func applyRegister(e ActivityEvent, studentID, now string) (ActivityEvent, error) {
	if e.Status != EventOpen {
		return ActivityEvent{}, errors.New("registration: event is closed")
	}
	if studentID == "" {
		return ActivityEvent{}, errors.New("registration: a student_id is required")
	}
	if e.activeIndex(studentID) >= 0 {
		return ActivityEvent{}, fmt.Errorf("registration: %s is already registered for %s", studentID, e.ID)
	}
	state := RegConfirmed
	if e.ConfirmedCount() >= e.SeatCap {
		state = RegWaitlisted
	}
	e.Registrations = append(e.Registrations, Registration{StudentID: studentID, State: state, Seq: e.NextSeq, RegisteredOn: "2026-06-25"})
	e.NextSeq++
	e.UpdatedAt = now
	return e, nil
}

// applyWithdraw withdraws a student. If a confirmed seat is vacated, the earliest waitlisted student is auto-promoted.
func applyWithdraw(e ActivityEvent, studentID, now string) (ActivityEvent, error) {
	idx := e.activeIndex(studentID)
	if idx < 0 {
		return ActivityEvent{}, fmt.Errorf("registration: %s has no active registration for %s", studentID, e.ID)
	}
	wasConfirmed := e.Registrations[idx].State == RegConfirmed
	e.Registrations[idx].State = RegWithdrawn
	if wasConfirmed {
		if wi := e.earliestWaitlistedIndex(); wi >= 0 {
			e.Registrations[wi].State = RegConfirmed
		}
	}
	e.UpdatedAt = now
	return e, nil
}

// applyCloseEvent closes registration for an event.
func applyCloseEvent(e ActivityEvent, now string) (ActivityEvent, error) {
	e.Status = EventClosed
	e.UpdatedAt = now
	return e, nil
}

type eventFilter struct{ OrgUnit, Category, Status string }

func matchEvent(f eventFilter, e ActivityEvent) bool {
	if f.OrgUnit != "" && e.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Category != "" && e.Category != f.Category {
		return false
	}
	if f.Status != "" && e.Status != f.Status {
		return false
	}
	return true
}

// eventStore is the persistence port. *memEventStore and *pgEventStore satisfy it.
type eventStore interface {
	Upsert(ActivityEvent) (ActivityEvent, error)
	Get(id string) (ActivityEvent, bool)
	List(eventFilter) []ActivityEvent
}

type memEventStore struct {
	mu sync.Mutex
	m  map[string]ActivityEvent
}

func newMemEventStore() *memEventStore { return &memEventStore{m: map[string]ActivityEvent{}} }

func (s *memEventStore) Upsert(e ActivityEvent) (ActivityEvent, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[e.ID] = e
	return e, nil
}

func (s *memEventStore) Get(id string) (ActivityEvent, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	e, ok := s.m[id]
	return e, ok
}

func (s *memEventStore) List(f eventFilter) []ActivityEvent {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]ActivityEvent, 0, len(s.m))
	for _, e := range s.m {
		if matchEvent(f, e) {
			out = append(out, e)
		}
	}
	return out
}

var (
	eventOnce sync.Once
	eventBack eventStore
)

func eventState() eventStore {
	eventOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgEventStore(dsn); err == nil {
				eventBack = pg
				log.Printf("registration: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("registration: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				eventBack = newMemEventStore()
			}
		} else {
			eventBack = newMemEventStore()
		}
		seedEvent(eventBack)
	})
	return eventBack
}

func eventNow() string { return "2026-06-25T00:00:00Z" }

// CreateActivityEvent records a new event (status open). Audited.
func (p *Platform) CreateActivityEvent(e ActivityEvent) (ActivityEvent, error) {
	e.Status = EventOpen
	e.Registrations = nil
	e.NextSeq = 1
	if e.CreatedOn == "" {
		e.CreatedOn = "2026-06-25"
	}
	e.UpdatedAt = eventNow()
	if err := e.Validate(); err != nil {
		p.appendAudit("activity-coordinator", "registration.create.denied", e.OrgUnit, "deny", err.Error())
		return ActivityEvent{}, err
	}
	out, err := eventState().Upsert(e)
	if err != nil {
		return ActivityEvent{}, err
	}
	p.appendAudit("activity-coordinator", "registration.create", e.ID, "executed", fmt.Sprintf("%s (%s) cap %d", e.Name, e.Category, e.SeatCap))
	return out, nil
}

// RegisterStudent registers a student — confirming or waitlisting. Audited.
func (p *Platform) RegisterStudent(id, studentID string) (ActivityEvent, error) {
	cur, ok := eventState().Get(id)
	if !ok {
		return ActivityEvent{}, errors.New("registration: event not found")
	}
	out, err := applyRegister(cur, studentID, eventNow())
	if err != nil {
		p.appendAudit("activity-coordinator", "registration.register.denied", id, "deny", err.Error())
		return ActivityEvent{}, err
	}
	if _, err := eventState().Upsert(out); err != nil {
		return ActivityEvent{}, err
	}
	state := RegConfirmed
	if idx := out.activeIndex(studentID); idx >= 0 {
		state = out.Registrations[idx].State
	}
	p.appendAudit("activity-coordinator", "registration.register", id, "executed", fmt.Sprintf("%s → %s (%d/%d)", studentID, state, out.ConfirmedCount(), out.SeatCap))
	return out, nil
}

// WithdrawStudent withdraws a student, auto-promoting the earliest waitlisted on a vacated confirmed seat. Audited.
func (p *Platform) WithdrawStudent(id, studentID string) (ActivityEvent, error) {
	cur, ok := eventState().Get(id)
	if !ok {
		return ActivityEvent{}, errors.New("registration: event not found")
	}
	out, err := applyWithdraw(cur, studentID, eventNow())
	if err != nil {
		p.appendAudit("activity-coordinator", "registration.withdraw.denied", id, "deny", err.Error())
		return ActivityEvent{}, err
	}
	if _, err := eventState().Upsert(out); err != nil {
		return ActivityEvent{}, err
	}
	p.appendAudit("activity-coordinator", "registration.withdraw", id, "executed", fmt.Sprintf("%s (%d/%d)", studentID, out.ConfirmedCount(), out.SeatCap))
	return out, nil
}

// CloseActivityEvent closes registration for an event. Audited.
func (p *Platform) CloseActivityEvent(id string) (ActivityEvent, error) {
	cur, ok := eventState().Get(id)
	if !ok {
		return ActivityEvent{}, errors.New("registration: event not found")
	}
	out, err := applyCloseEvent(cur, eventNow())
	if err != nil {
		p.appendAudit("activity-coordinator", "registration.close.denied", id, "deny", err.Error())
		return ActivityEvent{}, err
	}
	if _, err := eventState().Upsert(out); err != nil {
		return ActivityEvent{}, err
	}
	p.appendAudit("activity-coordinator", "registration.close", id, "executed", "closed")
	return out, nil
}

// ActivityEventRecord returns a single event by id.
func (p *Platform) ActivityEventRecord(id string) (ActivityEvent, bool) { return eventState().Get(id) }

// RegistrationDashboard is the jurisdiction-scoped activity picture: events by category/status, confirmed and
// waitlisted totals, the fill rate, and the events that are full with a waitlist. Downward-governance scoped.
type RegistrationDashboard struct {
	Scope      string          `json:"scope"`
	Events     int             `json:"events"`
	ByCategory map[string]int  `json:"by_category"`
	ByStatus   map[string]int  `json:"by_status"`
	Confirmed  int             `json:"confirmed"`
	Waitlisted int             `json:"waitlisted"`
	Seats      int             `json:"seats"`
	FillPct    float64         `json:"fill_pct"`
	Waitlists  []ActivityEvent `json:"waitlists,omitempty"`
	Synthetic  bool            `json:"synthetic"`
}

// RegistrationDashboard rolls up events across the schools a tenant node governs (fail-closed for others).
func (p *Platform) RegistrationDashboard(scopeOrg string) RegistrationDashboard {
	d := RegistrationDashboard{Scope: scopeOrg, ByCategory: map[string]int{}, ByStatus: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, e := range eventState().List(eventFilter{}) {
		if !h.Governs(scopeOrg, e.OrgUnit) {
			continue
		}
		d.Events++
		d.ByCategory[e.Category]++
		d.ByStatus[e.Status]++
		d.Confirmed += e.ConfirmedCount()
		d.Waitlisted += e.WaitlistedCount()
		d.Seats += e.SeatCap
		if e.WaitlistedCount() > 0 {
			d.Waitlists = append(d.Waitlists, e)
		}
	}
	if d.Seats > 0 {
		d.FillPct = float64(d.Confirmed) / float64(d.Seats) * 100
	}
	sort.Slice(d.Waitlists, func(i, j int) bool { return d.Waitlists[i].ID < d.Waitlists[j].ID })
	return d
}

// ScopedActivityEvents lists events a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedActivityEvents(scopeOrg, status string) []ActivityEvent {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []ActivityEvent
	for _, e := range eventState().List(eventFilter{Status: status}) {
		if h.Governs(scopeOrg, e.OrgUnit) {
			out = append(out, e)
		}
	}
	return out
}

// seedEvent plants events per school across more than one district: a small-cap sports trial that is full with a
// waitlist, and an arts workshop with spare seats. Synthetic SYN- ids only.
func seedEvent(s eventStore) {
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

		// Sports trial — seat cap 4, 6 registered (4 confirmed + 2 waitlisted).
		trial := ActivityEvent{
			ID: fmt.Sprintf("EVT-%s-TRIAL", tag), OrgUnit: school, Name: "District football trial", Category: "sports",
			SeatCap: 4, EventDate: "2026-07-15", Status: EventOpen, NextSeq: 1, CreatedOn: "2026-06-15", UpdatedAt: eventNow(),
		}
		for i := 0; i < 6; i++ {
			trial, _ = applyRegister(trial, fmt.Sprintf("SYN-S-%s-T%02d", tag, i+1), eventNow())
		}
		s.Upsert(trial)

		// Arts workshop — seat cap 20, 8 registered (all confirmed).
		arts := ActivityEvent{
			ID: fmt.Sprintf("EVT-%s-ARTS", tag), OrgUnit: school, Name: "Madhubani art workshop", Category: "arts",
			SeatCap: 20, EventDate: "2026-07-22", Status: EventOpen, NextSeq: 1, CreatedOn: "2026-06-18", UpdatedAt: eventNow(),
		}
		for i := 0; i < 8; i++ {
			arts, _ = applyRegister(arts, fmt.Sprintf("SYN-S-%s-A%02d", tag, i+1), eventNow())
		}
		s.Upsert(arts)
	}
}

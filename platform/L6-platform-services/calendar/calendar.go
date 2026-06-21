// Package calendar is the L6 Events & Academic Calendar service: plan the academic year — terms, examinations,
// holidays, parent-teacher meetings (PTM) and events — as durable, jurisdiction-scoped entries that move
// through a DYNAMIC multi-level approval chain (the number of levels is decided per entry by the caller from
// the entry's type and the tenancy level it applies to) before they are published. The store is CRUD-complete,
// filters by type/year, and always returns entries in date order. Pure + stdlib-only.
package calendar

import (
	"errors"
	"sort"
	"time"
)

// Entry types — the five planning instruments of the academic year.
const (
	Term    = "term"
	Exam    = "exam"
	Holiday = "holiday"
	PTM     = "ptm"
	Event   = "event"
)

// EntryTypes returns the canonical set of calendar entry types.
func EntryTypes() []string { return []string{Term, Exam, Holiday, PTM, Event} }

func validType(t string) bool {
	for _, v := range EntryTypes() {
		if v == t {
			return true
		}
	}
	return false
}

// Entry lifecycle statuses.
const (
	Draft    = "draft"    // created, not yet submitted for approval
	Pending  = "pending"  // moving through the approval chain
	Approved = "approved" // fully approved → published on the calendar
	Rejected = "rejected" // rejected at some level → not published
)

// ApprovalStep is one level in an entry's dynamic approval chain (a governance tier acting on the entry).
type ApprovalStep struct {
	Tier          string `json:"tier"`           // governance tier code (G1..G7)
	ApproverRole  string `json:"approver_role"`  // the role that may act at this level
	RequiredScope string `json:"required_scope"` // the scope the approver must hold
	Decision      string `json:"decision"`       // "" pending · "approved" · "rejected"
	DecidedBy     string `json:"decided_by,omitempty"`
	DecidedAt     string `json:"decided_at,omitempty"`
	Note          string `json:"note,omitempty"`
}

// Entry is one academic-calendar entry, bound to the org unit (tenant node) it applies to.
type Entry struct {
	ID           string         `json:"id"`
	Title        string         `json:"title"`
	Type         string         `json:"type"`
	StartDate    string         `json:"start_date"` // YYYY-MM-DD (inclusive)
	EndDate      string         `json:"end_date"`   // YYYY-MM-DD (inclusive)
	OrgUnit      string         `json:"org_unit"`   // the tenant node the entry applies to (school/district/state)
	AcademicYear string         `json:"academic_year"`
	Description  string         `json:"description,omitempty"`
	Status       string         `json:"status"`
	Chain        []ApprovalStep `json:"approval_chain,omitempty"`
	CurrentStep  int            `json:"current_step"`
	CreatedAt    string         `json:"created_at"`
	UpdatedAt    string         `json:"updated_at"`
	Synthetic    bool           `json:"synthetic"`
}

// Published reports whether the entry is approved and therefore live on the calendar.
func (e Entry) Published() bool { return e.Status == Approved }

const dateLayout = "2006-01-02"

// Validate checks the entry's required fields and that the dates are well-formed and ordered.
func (e Entry) Validate() error {
	if e.Title == "" {
		return errors.New("calendar: title is required")
	}
	if !validType(e.Type) {
		return errors.New("calendar: invalid entry type " + e.Type)
	}
	if e.OrgUnit == "" {
		return errors.New("calendar: org unit is required")
	}
	s, err := time.Parse(dateLayout, e.StartDate)
	if err != nil {
		return errors.New("calendar: start_date must be YYYY-MM-DD")
	}
	en, err := time.Parse(dateLayout, e.EndDate)
	if err != nil {
		return errors.New("calendar: end_date must be YYYY-MM-DD")
	}
	if en.Before(s) {
		return errors.New("calendar: end_date is before start_date")
	}
	return nil
}

// Filter narrows a listing. Zero values mean "all"; Orgs (when non-nil) is an allow-list of org units, used by
// callers to apply jurisdiction scoping.
type Filter struct {
	Type string          // "" = all types
	Year string          // "" = all academic years
	Orgs map[string]bool // nil = all org units
}

// FilterMatch reports whether an entry satisfies a filter — exported so external persistence adapters (e.g. the
// Postgres store) apply exactly the same filtering semantics as the in-memory store.
func FilterMatch(f Filter, e Entry) bool { return f.match(e) }

func (f Filter) match(e Entry) bool {
	if f.Type != "" && e.Type != f.Type {
		return false
	}
	if f.Year != "" && e.AcademicYear != f.Year {
		return false
	}
	if f.Orgs != nil && !f.Orgs[e.OrgUnit] {
		return false
	}
	return true
}

// Store is the durable academic-calendar store (in-memory here; the same contract is fronted by Postgres in
// production). It keeps entries CRUD-addressable and lists them in date order.
type Store struct {
	entries map[string]Entry
	now     func() time.Time
}

// NewStore returns an empty store using the wall clock.
func NewStore() *Store { return &Store{entries: map[string]Entry{}, now: time.Now} }

// NewStoreWithClock returns a store with an injected clock (deterministic tests).
func NewStoreWithClock(now func() time.Time) *Store {
	return &Store{entries: map[string]Entry{}, now: now}
}

func (s *Store) stamp() string { return s.now().UTC().Format(time.RFC3339) }

// Create validates and inserts a new entry as a Draft. ID must be unique and non-empty.
func (s *Store) Create(e Entry) (Entry, error) {
	if e.ID == "" {
		return Entry{}, errors.New("calendar: id is required")
	}
	if _, exists := s.entries[e.ID]; exists {
		return Entry{}, errors.New("calendar: duplicate id " + e.ID)
	}
	if err := e.Validate(); err != nil {
		return Entry{}, err
	}
	if e.Status == "" {
		e.Status = Draft
	}
	e.CreatedAt, e.UpdatedAt = s.stamp(), s.stamp()
	s.entries[e.ID] = e
	return e, nil
}

// Get returns an entry by ID.
func (s *Store) Get(id string) (Entry, bool) { e, ok := s.entries[id]; return e, ok }

// Update replaces a mutable entry's editable fields (title/type/dates/description). Only Draft or Rejected
// entries may be edited — an in-flight or published entry is immutable to preserve the approval trail.
func (s *Store) Update(id, title, etype, start, end, desc string) (Entry, error) {
	e, ok := s.entries[id]
	if !ok {
		return Entry{}, errors.New("calendar: not found")
	}
	updated, err := ApplyUpdate(e, title, etype, start, end, desc, s.stamp())
	if err != nil {
		return Entry{}, err
	}
	s.entries[id] = updated
	return updated, nil
}

// Delete removes an entry. Returns false if it does not exist.
func (s *Store) Delete(id string) bool {
	if _, ok := s.entries[id]; !ok {
		return false
	}
	delete(s.entries, id)
	return true
}

// List returns the filtered entries in date order (StartDate, then ID for stability).
func (s *Store) List(f Filter) []Entry {
	var out []Entry
	for _, e := range s.entries {
		if f.match(e) {
			out = append(out, e)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].StartDate != out[j].StartDate {
			return out[i].StartDate < out[j].StartDate
		}
		return out[i].ID < out[j].ID
	})
	return out
}

// Count returns the number of entries in the store.
func (s *Store) Count() int { return len(s.entries) }

// Submit moves a Draft (or Rejected) entry into the approval chain. The chain is supplied by the caller, which
// sizes it DYNAMICALLY from the entry's type and the tenancy level it applies to. An empty chain auto-approves
// (a purely local, zero-stakes entry).
func (s *Store) Submit(id string, chain []ApprovalStep) (Entry, error) {
	e, ok := s.entries[id]
	if !ok {
		return Entry{}, errors.New("calendar: not found")
	}
	out, err := ApplySubmit(e, chain, s.stamp())
	if err != nil {
		return Entry{}, err
	}
	s.entries[id] = out
	return out, nil
}

// Act applies a decision at the entry's current approval level. The actor must hold the step's ApproverRole
// AND its RequiredScope (fail-closed). Approve advances to the next level (or publishes on the last); reject
// stops the chain and marks the entry Rejected.
func (s *Store) Act(id string, approve bool, actorID, actorRole string, scopes []string, note string) (Entry, error) {
	e, ok := s.entries[id]
	if !ok {
		return Entry{}, errors.New("calendar: not found")
	}
	out, err := ApplyAct(e, approve, actorID, actorRole, scopes, note, s.stamp())
	if err != nil {
		return Entry{}, err
	}
	s.entries[id] = out
	return out, nil
}

func hasScope(scopes []string, want string) bool {
	for _, sc := range scopes {
		if sc == want || sc == "*" {
			return true
		}
	}
	return false
}

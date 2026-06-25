// Package leave is the L6 Staff Leave & Approval service: a teacher files a leave request and it moves through
// a DYNAMIC multi-level approval chain whose depth is decided by the number of days — the head teacher
// (principal) always approves; more than 5 days also needs the Block Educational Officer (BEO); more than 15
// days also needs the District Educational Officer (DEO). Pure + stdlib-only; storage adapters reuse the pure
// transitions so the in-memory and PostgreSQL backends behave identically.
package leave

import (
	"errors"
	"sort"
	"time"
)

// Request statuses.
const (
	Pending  = "pending"
	Approved = "approved"
	Rejected = "rejected"
)

// Step is one level in the approval chain (a role that must sign off).
type Step struct {
	Role      string `json:"role"`
	Decision  string `json:"decision"` // "" pending · approved · rejected
	DecidedBy string `json:"decided_by,omitempty"`
	DecidedAt string `json:"decided_at,omitempty"`
	Note      string `json:"note,omitempty"`
}

// Request is one staff leave application bound to the school (org unit) it is filed at.
type Request struct {
	ID          string `json:"id"`
	Employee    string `json:"employee"`
	Type        string `json:"type"` // casual | medical | earned | maternity | duty
	From        string `json:"from_date"`
	To          string `json:"to_date"`
	Days        int    `json:"days"`
	Reason      string `json:"reason,omitempty"`
	OrgUnit     string `json:"org_unit"`
	Status      string `json:"status"`
	Chain       []Step `json:"approval_chain"`
	CurrentStep int    `json:"current_step"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

// Approved reports whether the request is fully approved.
func (r Request) Approved() bool { return r.Status == Approved }

const dateLayout = "2006-01-02"

// DaysBetween returns the inclusive number of days between two YYYY-MM-DD dates.
func DaysBetween(from, to string) (int, error) {
	f, err := time.Parse(dateLayout, from)
	if err != nil {
		return 0, errors.New("leave: from_date must be YYYY-MM-DD")
	}
	t, err := time.Parse(dateLayout, to)
	if err != nil {
		return 0, errors.New("leave: to_date must be YYYY-MM-DD")
	}
	if t.Before(f) {
		return 0, errors.New("leave: to_date is before from_date")
	}
	return int(t.Sub(f).Hours()/24) + 1, nil
}

// ChainFor builds the dynamic approval chain from the number of days: principal always; +BEO over 5 days;
// +DEO over 15 days.
func ChainFor(days int) []Step {
	steps := []Step{{Role: "HEAD_TEACHER"}}
	if days > 5 {
		steps = append(steps, Step{Role: "BEO"})
	}
	if days > 15 {
		steps = append(steps, Step{Role: "DEO"})
	}
	return steps
}

// NewRequest validates inputs and builds a pending request with its dynamic chain (pure).
func NewRequest(id, employee, ltype, from, to, reason, orgUnit, now string) (Request, error) {
	if id == "" || employee == "" || orgUnit == "" {
		return Request{}, errors.New("leave: id, employee and org_unit are required")
	}
	if ltype == "" {
		ltype = "casual"
	}
	days, err := DaysBetween(from, to)
	if err != nil {
		return Request{}, err
	}
	return Request{
		ID: id, Employee: employee, Type: ltype, From: from, To: to, Days: days, Reason: reason,
		OrgUnit: orgUnit, Status: Pending, Chain: ChainFor(days), CurrentStep: 0, CreatedAt: now, UpdatedAt: now,
	}, nil
}

// ApplyDecide applies an approve/reject at the request's current level (pure, fail-closed): the actor must hold
// the level's role. Approve advances (fully approves on the last level); reject stops the chain.
func ApplyDecide(r Request, approve bool, actorRole, actorID, note, now string) (Request, error) {
	if r.Status != Pending {
		return Request{}, errors.New("leave: request is not awaiting approval")
	}
	if r.CurrentStep < 0 || r.CurrentStep >= len(r.Chain) {
		return Request{}, errors.New("leave: approval chain is exhausted")
	}
	step := r.Chain[r.CurrentStep]
	if actorRole != step.Role {
		return Request{}, errors.New("leave: " + actorRole + " may not act at this level (needs " + step.Role + ")")
	}
	r.Chain = append([]Step(nil), r.Chain...)
	step.DecidedBy, step.DecidedAt, step.Note = actorID, now, note
	if approve {
		step.Decision = "approved"
		r.Chain[r.CurrentStep] = step
		r.CurrentStep++
		if r.CurrentStep >= len(r.Chain) {
			r.Status = Approved
		}
	} else {
		step.Decision = "rejected"
		r.Chain[r.CurrentStep] = step
		r.Status = Rejected
	}
	r.UpdatedAt = now
	return r, nil
}

// Filter narrows a listing.
type Filter struct {
	Status   string
	Employee string
	Orgs     map[string]bool // nil = all
}

// Match reports whether a request satisfies a filter (exported for persistence adapters).
func Match(f Filter, r Request) bool {
	if f.Status != "" && r.Status != f.Status {
		return false
	}
	if f.Employee != "" && r.Employee != f.Employee {
		return false
	}
	if f.Orgs != nil && !f.Orgs[r.OrgUnit] {
		return false
	}
	return true
}

// Store is the in-memory leave store (credential-free demo).
type Store struct {
	reqs map[string]Request
	now  func() time.Time
}

// NewStore returns an empty in-memory store.
func NewStore() *Store { return &Store{reqs: map[string]Request{}, now: time.Now} }

// NewStoreWithClock returns a store with an injected clock.
func NewStoreWithClock(now func() time.Time) *Store {
	return &Store{reqs: map[string]Request{}, now: now}
}

func (s *Store) stamp() string { return s.now().UTC().Format(time.RFC3339) }

// File validates and stores a new leave request.
func (s *Store) File(id, employee, ltype, from, to, reason, orgUnit string) (Request, error) {
	if _, exists := s.reqs[id]; exists {
		return Request{}, errors.New("leave: duplicate id " + id)
	}
	r, err := NewRequest(id, employee, ltype, from, to, reason, orgUnit, s.stamp())
	if err != nil {
		return Request{}, err
	}
	s.reqs[id] = r
	return r, nil
}

// Get returns a request by id.
func (s *Store) Get(id string) (Request, bool) { r, ok := s.reqs[id]; return r, ok }

// Decide applies a decision at the current level and persists it.
func (s *Store) Decide(id string, approve bool, actorRole, actorID, note string) (Request, error) {
	r, ok := s.reqs[id]
	if !ok {
		return Request{}, errors.New("leave: not found")
	}
	out, err := ApplyDecide(r, approve, actorRole, actorID, note, s.stamp())
	if err != nil {
		return Request{}, err
	}
	s.reqs[id] = out
	return out, nil
}

// List returns the filtered requests, most recent first (by created timestamp, then id).
func (s *Store) List(f Filter) []Request {
	var out []Request
	for _, r := range s.reqs {
		if Match(f, r) {
			out = append(out, r)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].CreatedAt != out[j].CreatedAt {
			return out[i].CreatedAt > out[j].CreatedAt
		}
		return out[i].ID < out[j].ID
	})
	return out
}

// Count returns the number of requests.
func (s *Store) Count() int { return len(s.reqs) }

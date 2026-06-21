// Package grievance is the L12 Citizen Grievance & Redressal service: a complainant files a grievance against
// a school/office and it is handled by a tier of officers under an SLA. The escalation chain depends on the
// category (child-safety escalates fastest, to the directorate), and a grievance that BREACHES its SLA
// deadline auto-escalates to the next tier. Pure + stdlib-only; storage adapters reuse the pure transitions.
package grievance

import (
	"errors"
	"sort"
	"time"
)

// Statuses.
const (
	Open      = "open"
	Resolved  = "resolved"
	Rejected  = "rejected"
	Escalated = "escalated" // reached the top of the chain without resolution
	maxNote   = 2000
	layoutRFC = time.RFC3339
)

// Categories.
const (
	Academic       = "academic"
	Infrastructure = "infrastructure"
	Safety         = "safety"
	Financial      = "financial"
	Service        = "service"
)

// Step is one handler tier in the escalation chain.
type Step struct {
	Role      string `json:"role"`
	Decision  string `json:"decision"` // "" pending · resolved · rejected · escalated
	DecidedBy string `json:"decided_by,omitempty"`
	DecidedAt string `json:"decided_at,omitempty"`
	Note      string `json:"note,omitempty"`
}

// Grievance is one citizen complaint, bound to the org unit it concerns.
type Grievance struct {
	ID          string `json:"id"`
	Complainant string `json:"complainant"`
	Category    string `json:"category"`
	Subject     string `json:"subject"`
	OrgUnit     string `json:"org_unit"`
	Status      string `json:"status"`
	Chain       []Step `json:"escalation_chain"`
	CurrentTier int    `json:"current_tier"`
	FiledAt     string `json:"filed_at"`
	DueAt       string `json:"due_at"` // SLA deadline for the current tier
	Resolution  string `json:"resolution,omitempty"`
	UpdatedAt   string `json:"updated_at"`
}

// Closed reports whether the grievance is in a terminal state.
func (g Grievance) Closed() bool {
	return g.Status == Resolved || g.Status == Rejected
}

// slaDays returns the per-tier SLA (in days) for a category — child safety is fastest.
func slaDays(category string) int {
	if category == Safety {
		return 3
	}
	return 7
}

// ChainFor returns the escalation chain (handler roles) for a category. Safety escalates straight to the
// directorate; financial runs school→block→district; everything else school→block.
func ChainFor(category string) []Step {
	switch category {
	case Safety:
		return []Step{{Role: "HEAD_TEACHER"}, {Role: "DEO"}, {Role: "DIRECTOR"}}
	case Financial:
		return []Step{{Role: "HEAD_TEACHER"}, {Role: "BEO"}, {Role: "DEO"}}
	default:
		return []Step{{Role: "HEAD_TEACHER"}, {Role: "BEO"}}
	}
}

func validCategory(c string) bool {
	switch c {
	case Academic, Infrastructure, Safety, Financial, Service:
		return true
	}
	return false
}

func addDays(ts string, days int) string {
	t, err := time.Parse(layoutRFC, ts)
	if err != nil {
		return ts
	}
	return t.Add(time.Duration(days) * 24 * time.Hour).Format(layoutRFC)
}

// NewGrievance validates and builds an open grievance assigned to the first tier with its SLA deadline (pure).
func NewGrievance(id, complainant, category, subject, orgUnit, now string) (Grievance, error) {
	if id == "" || complainant == "" || orgUnit == "" {
		return Grievance{}, errors.New("grievance: id, complainant and org_unit are required")
	}
	if !validCategory(category) {
		return Grievance{}, errors.New("grievance: invalid category " + category)
	}
	if len(subject) > maxNote {
		return Grievance{}, errors.New("grievance: subject too long")
	}
	return Grievance{
		ID: id, Complainant: complainant, Category: category, Subject: subject, OrgUnit: orgUnit,
		Status: Open, Chain: ChainFor(category), CurrentTier: 0, FiledAt: now,
		DueAt: addDays(now, slaDays(category)), UpdatedAt: now,
	}, nil
}

// ApplyResolve resolves the grievance at its current tier (pure, fail-closed: the actor must hold the tier's
// handler role).
func ApplyResolve(g Grievance, actorRole, actorID, resolution, now string) (Grievance, error) {
	if g.Status != Open {
		return Grievance{}, errors.New("grievance: not open")
	}
	if g.CurrentTier < 0 || g.CurrentTier >= len(g.Chain) {
		return Grievance{}, errors.New("grievance: tier out of range")
	}
	if actorRole != g.Chain[g.CurrentTier].Role {
		return Grievance{}, errors.New("grievance: " + actorRole + " is not the current handler (needs " + g.Chain[g.CurrentTier].Role + ")")
	}
	g.Chain = append([]Step(nil), g.Chain...)
	g.Chain[g.CurrentTier].Decision = "resolved"
	g.Chain[g.CurrentTier].DecidedBy = actorID
	g.Chain[g.CurrentTier].DecidedAt = now
	g.Chain[g.CurrentTier].Note = resolution
	g.Status = Resolved
	g.Resolution = resolution
	g.UpdatedAt = now
	return g, nil
}

// ApplyEscalate moves the grievance to the next tier and resets its SLA deadline (pure). `by` records who/what
// escalated (an officer id, or "sla" for an automatic SLA breach). If there is no higher tier the grievance is
// marked Escalated (it has exhausted the chain and needs leadership attention).
func ApplyEscalate(g Grievance, by, reason, now string) (Grievance, error) {
	if g.Status != Open {
		return Grievance{}, errors.New("grievance: only an open grievance can escalate")
	}
	g.Chain = append([]Step(nil), g.Chain...)
	g.Chain[g.CurrentTier].Decision = "escalated"
	g.Chain[g.CurrentTier].DecidedBy = by
	g.Chain[g.CurrentTier].DecidedAt = now
	g.Chain[g.CurrentTier].Note = reason
	if g.CurrentTier+1 >= len(g.Chain) {
		g.Status = Escalated
		g.UpdatedAt = now
		return g, nil
	}
	g.CurrentTier++
	g.DueAt = addDays(now, slaDays(g.Category))
	g.UpdatedAt = now
	return g, nil
}

// ApplyReject rejects the grievance at the current tier (e.g. duplicate / out of scope).
func ApplyReject(g Grievance, actorRole, actorID, note, now string) (Grievance, error) {
	if g.Status != Open {
		return Grievance{}, errors.New("grievance: not open")
	}
	if actorRole != g.Chain[g.CurrentTier].Role {
		return Grievance{}, errors.New("grievance: " + actorRole + " is not the current handler")
	}
	g.Chain = append([]Step(nil), g.Chain...)
	g.Chain[g.CurrentTier].Decision = "rejected"
	g.Chain[g.CurrentTier].DecidedBy = actorID
	g.Chain[g.CurrentTier].DecidedAt = now
	g.Chain[g.CurrentTier].Note = note
	g.Status = Rejected
	g.UpdatedAt = now
	return g, nil
}

// Overdue reports whether an open grievance has breached its SLA deadline as of `now`.
func Overdue(g Grievance, now string) bool {
	if g.Status != Open {
		return false
	}
	due, err := time.Parse(layoutRFC, g.DueAt)
	if err != nil {
		return false
	}
	n, err := time.Parse(layoutRFC, now)
	if err != nil {
		return false
	}
	return n.After(due)
}

// Filter narrows a listing.
type Filter struct {
	Status   string
	Category string
	Orgs     map[string]bool // nil = all
}

// Match reports whether a grievance satisfies a filter (exported for persistence adapters).
func Match(f Filter, g Grievance) bool {
	if f.Status != "" && g.Status != f.Status {
		return false
	}
	if f.Category != "" && g.Category != f.Category {
		return false
	}
	if f.Orgs != nil && !f.Orgs[g.OrgUnit] {
		return false
	}
	return true
}

// Store is the in-memory grievance store (credential-free demo).
type Store struct {
	items map[string]Grievance
	now   func() time.Time
}

// NewStore returns an empty in-memory store.
func NewStore() *Store { return &Store{items: map[string]Grievance{}, now: time.Now} }

// NewStoreWithClock returns a store with an injected clock.
func NewStoreWithClock(now func() time.Time) *Store {
	return &Store{items: map[string]Grievance{}, now: now}
}

func (s *Store) stamp() string { return s.now().UTC().Format(layoutRFC) }

// File validates and stores a new grievance.
func (s *Store) File(id, complainant, category, subject, orgUnit string) (Grievance, error) {
	if _, exists := s.items[id]; exists {
		return Grievance{}, errors.New("grievance: duplicate id " + id)
	}
	g, err := NewGrievance(id, complainant, category, subject, orgUnit, s.stamp())
	if err != nil {
		return Grievance{}, err
	}
	s.items[id] = g
	return g, nil
}

// Get returns a grievance by id.
func (s *Store) Get(id string) (Grievance, bool) { g, ok := s.items[id]; return g, ok }

// Resolve resolves at the current tier.
func (s *Store) Resolve(id, actorRole, actorID, resolution string) (Grievance, error) {
	return s.mutate(id, func(g Grievance, now string) (Grievance, error) {
		return ApplyResolve(g, actorRole, actorID, resolution, now)
	})
}

// Reject rejects at the current tier.
func (s *Store) Reject(id, actorRole, actorID, note string) (Grievance, error) {
	return s.mutate(id, func(g Grievance, now string) (Grievance, error) {
		return ApplyReject(g, actorRole, actorID, note, now)
	})
}

// Escalate manually escalates to the next tier.
func (s *Store) Escalate(id, by, reason string) (Grievance, error) {
	return s.mutate(id, func(g Grievance, now string) (Grievance, error) {
		return ApplyEscalate(g, by, reason, now)
	})
}

func (s *Store) mutate(id string, fn func(Grievance, string) (Grievance, error)) (Grievance, error) {
	g, ok := s.items[id]
	if !ok {
		return Grievance{}, errors.New("grievance: not found")
	}
	out, err := fn(g, s.stamp())
	if err != nil {
		return Grievance{}, err
	}
	s.items[id] = out
	return out, nil
}

// List returns the filtered grievances, most recent first.
func (s *Store) List(f Filter) []Grievance {
	var out []Grievance
	for _, g := range s.items {
		if Match(f, g) {
			out = append(out, g)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].FiledAt != out[j].FiledAt {
			return out[i].FiledAt > out[j].FiledAt
		}
		return out[i].ID < out[j].ID
	})
	return out
}

// Count returns the number of grievances.
func (s *Store) Count() int { return len(s.items) }

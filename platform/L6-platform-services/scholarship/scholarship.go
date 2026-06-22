// Package scholarship is the L6 Scholarship / DBT (Direct Benefit Transfer) service: a student scholarship is
// applied for, SANCTIONED through an amount-driven multi-level fund-approval chain (PFMS/GFR — larger amounts
// rise to higher authority), DISBURSED to the beneficiary with a payment reference, then RECONCILED against the
// payment rail. Money is held in paise (integer) — never floats. Pure + stdlib-only; storage adapters reuse
// the pure transitions so the in-memory and PostgreSQL backends behave identically.
package scholarship

import (
	"errors"
	"sort"
	"time"
)

// Statuses.
const (
	Pending    = "pending"    // awaiting sanction (moving through the approval chain)
	Sanctioned = "sanctioned" // fully approved, ready to disburse
	Disbursed  = "disbursed"  // paid to the beneficiary (has a payment ref)
	Reconciled = "reconciled" // matched against the payment rail
	Flagged    = "flagged"    // disbursed but the rail did not confirm (leakage signal)
	Rejected   = "rejected"   // rejected during sanction
)

// Schemes (TN/Centre scholarship heads).
const (
	PreMatric   = "pre-matric"
	PostMatric  = "post-matric"
	Merit       = "merit"
	Maintenance = "maintenance" // EWS/CWSN maintenance allowance
)

// Step is one fund-approval tier (a sanctioning role).
type Step struct {
	Role      string `json:"role"`
	Decision  string `json:"decision"` // "" pending · approved · rejected
	DecidedBy string `json:"decided_by,omitempty"`
	DecidedAt string `json:"decided_at,omitempty"`
	Note      string `json:"note,omitempty"`
}

// Disbursement is one scholarship/DBT case for a student.
type Disbursement struct {
	ID          string `json:"id"`
	StudentID   string `json:"student_id"`
	Scheme      string `json:"scheme"`
	AmountPaise int64  `json:"amount_paise"` // money in paise (₹1 = 100 paise)
	OrgUnit     string `json:"org_unit"`     // the school the beneficiary belongs to
	Status      string `json:"status"`
	Chain       []Step `json:"approval_chain"`
	CurrentStep int    `json:"current_step"`
	PaymentRef  string `json:"payment_ref,omitempty"`
	FiledAt     string `json:"filed_at"`
	UpdatedAt   string `json:"updated_at"`
}

func validScheme(s string) bool {
	switch s {
	case PreMatric, PostMatric, Merit, Maintenance:
		return true
	}
	return false
}

// Rupees returns the amount in whole rupees (for display).
func (d Disbursement) Rupees() int64 { return d.AmountPaise / 100 }

// ChainFor builds the amount-driven sanction chain (PFMS/GFR): every disbursement is sanctioned by the head
// teacher and the block officer; over ₹50,000 it also needs the district officer; over ₹2,00,000 it also needs
// the directorate (fund.release authority). Higher money → more levels of human approval.
func ChainFor(amountPaise int64) []Step {
	steps := []Step{{Role: "HEAD_TEACHER"}, {Role: "BEO"}}
	if amountPaise > 50_000*100 {
		steps = append(steps, Step{Role: "DEO"})
	}
	if amountPaise > 200_000*100 {
		steps = append(steps, Step{Role: "DIRECTOR"})
	}
	return steps
}

// NewDisbursement validates and builds a pending disbursement with its sanction chain (pure).
func NewDisbursement(id, studentID, scheme string, amountPaise int64, orgUnit, now string) (Disbursement, error) {
	if id == "" || studentID == "" || orgUnit == "" {
		return Disbursement{}, errors.New("scholarship: id, student_id and org_unit are required")
	}
	if !validScheme(scheme) {
		return Disbursement{}, errors.New("scholarship: invalid scheme " + scheme)
	}
	if amountPaise <= 0 {
		return Disbursement{}, errors.New("scholarship: amount must be positive")
	}
	return Disbursement{
		ID: id, StudentID: studentID, Scheme: scheme, AmountPaise: amountPaise, OrgUnit: orgUnit,
		Status: Pending, Chain: ChainFor(amountPaise), CurrentStep: 0, FiledAt: now, UpdatedAt: now,
	}, nil
}

// ApplyDecide applies an approve/reject at the current sanction tier (pure, fail-closed: the actor must hold
// the tier's role). Approve advances; on the last tier the disbursement becomes Sanctioned. Reject stops it.
func ApplyDecide(d Disbursement, approve bool, actorRole, actorID, note, now string) (Disbursement, error) {
	if d.Status != Pending {
		return Disbursement{}, errors.New("scholarship: not awaiting sanction")
	}
	if d.CurrentStep < 0 || d.CurrentStep >= len(d.Chain) {
		return Disbursement{}, errors.New("scholarship: sanction chain exhausted")
	}
	step := d.Chain[d.CurrentStep]
	if actorRole != step.Role {
		return Disbursement{}, errors.New("scholarship: " + actorRole + " may not sanction at this tier (needs " + step.Role + ")")
	}
	d.Chain = append([]Step(nil), d.Chain...)
	step.DecidedBy, step.DecidedAt, step.Note = actorID, now, note
	if approve {
		step.Decision = "approved"
		d.Chain[d.CurrentStep] = step
		d.CurrentStep++
		if d.CurrentStep >= len(d.Chain) {
			d.Status = Sanctioned
		}
	} else {
		step.Decision = "rejected"
		d.Chain[d.CurrentStep] = step
		d.Status = Rejected
	}
	d.UpdatedAt = now
	return d, nil
}

// ApplyDisburse pays out a SANCTIONED disbursement, recording the payment reference (pure).
func ApplyDisburse(d Disbursement, paymentRef, now string) (Disbursement, error) {
	if d.Status != Sanctioned {
		return Disbursement{}, errors.New("scholarship: only a sanctioned disbursement can be disbursed")
	}
	if paymentRef == "" {
		return Disbursement{}, errors.New("scholarship: a payment reference is required to disburse")
	}
	d.Status = Disbursed
	d.PaymentRef = paymentRef
	d.UpdatedAt = now
	return d, nil
}

// ApplyReconcile reconciles a DISBURSED case against the payment rail: matched → Reconciled, unmatched →
// Flagged (a leakage / failed-credit signal).
func ApplyReconcile(d Disbursement, matched bool, now string) (Disbursement, error) {
	if d.Status != Disbursed {
		return Disbursement{}, errors.New("scholarship: only a disbursed case can be reconciled")
	}
	if matched {
		d.Status = Reconciled
	} else {
		d.Status = Flagged
	}
	d.UpdatedAt = now
	return d, nil
}

// Filter narrows a listing.
type Filter struct {
	Status  string
	Scheme  string
	Student string
	Orgs    map[string]bool // nil = all
}

// Match reports whether a disbursement satisfies a filter (exported for persistence adapters).
func Match(f Filter, d Disbursement) bool {
	if f.Status != "" && d.Status != f.Status {
		return false
	}
	if f.Scheme != "" && d.Scheme != f.Scheme {
		return false
	}
	if f.Student != "" && d.StudentID != f.Student {
		return false
	}
	if f.Orgs != nil && !f.Orgs[d.OrgUnit] {
		return false
	}
	return true
}

// Store is the in-memory store (credential-free demo).
type Store struct {
	items map[string]Disbursement
	now   func() time.Time
}

// NewStore returns an empty store.
func NewStore() *Store { return &Store{items: map[string]Disbursement{}, now: time.Now} }

// NewStoreWithClock returns a store with an injected clock.
func NewStoreWithClock(now func() time.Time) *Store {
	return &Store{items: map[string]Disbursement{}, now: now}
}

func (s *Store) stamp() string { return s.now().UTC().Format(time.RFC3339) }

// File validates and stores a new disbursement.
func (s *Store) File(id, studentID, scheme string, amountPaise int64, orgUnit string) (Disbursement, error) {
	if _, exists := s.items[id]; exists {
		return Disbursement{}, errors.New("scholarship: duplicate id " + id)
	}
	d, err := NewDisbursement(id, studentID, scheme, amountPaise, orgUnit, s.stamp())
	if err != nil {
		return Disbursement{}, err
	}
	s.items[id] = d
	return d, nil
}

// Get returns a disbursement by id.
func (s *Store) Get(id string) (Disbursement, bool) { d, ok := s.items[id]; return d, ok }

func (s *Store) mutate(id string, fn func(Disbursement, string) (Disbursement, error)) (Disbursement, error) {
	d, ok := s.items[id]
	if !ok {
		return Disbursement{}, errors.New("scholarship: not found")
	}
	out, err := fn(d, s.stamp())
	if err != nil {
		return Disbursement{}, err
	}
	s.items[id] = out
	return out, nil
}

// Decide applies a sanction decision.
func (s *Store) Decide(id string, approve bool, actorRole, actorID, note string) (Disbursement, error) {
	return s.mutate(id, func(d Disbursement, now string) (Disbursement, error) {
		return ApplyDecide(d, approve, actorRole, actorID, note, now)
	})
}

// Disburse pays out a sanctioned case.
func (s *Store) Disburse(id, paymentRef string) (Disbursement, error) {
	return s.mutate(id, func(d Disbursement, now string) (Disbursement, error) {
		return ApplyDisburse(d, paymentRef, now)
	})
}

// Reconcile reconciles a disbursed case.
func (s *Store) Reconcile(id string, matched bool) (Disbursement, error) {
	return s.mutate(id, func(d Disbursement, now string) (Disbursement, error) {
		return ApplyReconcile(d, matched, now)
	})
}

// List returns the filtered disbursements, most recent first.
func (s *Store) List(f Filter) []Disbursement {
	var out []Disbursement
	for _, d := range s.items {
		if Match(f, d) {
			out = append(out, d)
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

// Count returns the number of disbursements.
func (s *Store) Count() int { return len(s.items) }

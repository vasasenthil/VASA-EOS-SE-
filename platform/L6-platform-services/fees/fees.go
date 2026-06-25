// Package fees is the L6 Fee & Finance Ledger service: the durable record of fee demands raised against students
// (exam / hostel / special fees — TN government schooling is largely free, but statutory heads remain) and the
// payments collected against them, with the money-grade invariants a finance ledger must hold — every amount is
// in PAISE (int64, never floats), a payment can never take the collected total ABOVE the amount demanded (no
// overpayment), and a fully-paid or waived demand is closed to further payment. A constraint-checked ledger,
// pure + stdlib-only.
package fees

import (
	"errors"
	"sort"
	"strconv"
	"time"
)

// Demand lifecycle statuses.
const (
	Pending   = "pending"   // raised, nothing paid
	Partial   = "partial"   // some paid, balance remains
	Paid      = "paid"      // fully collected
	Waived    = "waived"    // concession granted; no further collection
	Cancelled = "cancelled" // raised in error
)

// Payment modes.
const (
	Cash   = "cash"
	Online = "online"
	UPI    = "upi"
	DD     = "dd"
	Cheque = "cheque"
)

const dateLayout = "2006-01-02"

func parseDate(s string) (time.Time, error) { return time.Parse(dateLayout, s) }

func validMode(m string) bool {
	switch m {
	case Cash, Online, UPI, DD, Cheque:
		return true
	}
	return false
}

func validDemandStatus(s string) bool {
	switch s {
	case Pending, Partial, Paid, Waived, Cancelled:
		return true
	}
	return false
}

// Demand is a fee charge raised against a student. AmountPaise is the gross amount due, in paise.
type Demand struct {
	ID          string `json:"id"`
	OrgUnit     string `json:"org_unit"` // the school (T6 tenancy node)
	StudentID   string `json:"student_id"`
	Category    string `json:"category"` // exam | hostel | special | ...
	Term        string `json:"term"`
	AmountPaise int64  `json:"amount_paise"`
	Status      string `json:"status"`
	DueOn       string `json:"due_on"` // YYYY-MM-DD
}

// Validate checks a demand's required fields, money amount, status and date.
func (d Demand) Validate() error {
	if d.ID == "" || d.OrgUnit == "" || d.StudentID == "" {
		return errors.New("fees: demand id, org_unit and student_id are required")
	}
	if d.Category == "" {
		return errors.New("fees: demand category is required")
	}
	if d.AmountPaise <= 0 {
		return errors.New("fees: amount_paise must be positive")
	}
	if !validDemandStatus(d.Status) {
		return errors.New("fees: invalid status " + d.Status)
	}
	if _, err := parseDate(d.DueOn); err != nil {
		return errors.New("fees: invalid due_on (want YYYY-MM-DD)")
	}
	return nil
}

// Open reports whether a demand can still take payment (raised and not closed).
func (d Demand) Open() bool { return d.Status == Pending || d.Status == Partial }

// Payment is a collection against a demand, in paise.
type Payment struct {
	ID          string `json:"id"`
	DemandID    string `json:"demand_id"`
	OrgUnit     string `json:"org_unit"`
	StudentID   string `json:"student_id"`
	AmountPaise int64  `json:"amount_paise"`
	Mode        string `json:"mode"`
	Reference   string `json:"reference,omitempty"`
	PaidOn      string `json:"paid_on"`
}

// Validate checks a payment's required fields, money amount, mode and date.
func (p Payment) Validate() error {
	if p.ID == "" || p.DemandID == "" {
		return errors.New("fees: payment id and demand_id are required")
	}
	if p.AmountPaise <= 0 {
		return errors.New("fees: payment amount_paise must be positive")
	}
	if !validMode(p.Mode) {
		return errors.New("fees: invalid payment mode " + p.Mode)
	}
	if _, err := parseDate(p.PaidOn); err != nil {
		return errors.New("fees: invalid paid_on (want YYYY-MM-DD)")
	}
	return nil
}

// PaidSoFar totals the payments against a demand (optionally excluding one payment id, so a re-record can be
// computed idempotently).
func PaidSoFar(payments []Payment, demandID, excludeID string) int64 {
	var total int64
	for _, p := range payments {
		if p.DemandID == demandID && p.ID != excludeID {
			total += p.AmountPaise
		}
	}
	return total
}

// statusFor derives a demand's status from how much has been collected against its amount.
func statusFor(amount, paid int64) string {
	if paid >= amount {
		return Paid
	}
	if paid > 0 {
		return Partial
	}
	return Pending
}

// DemandFilter narrows a demand listing.
type DemandFilter struct {
	OrgUnit  string
	Student  string
	Category string
	Status   string
}

// MatchDemand reports whether a demand satisfies a filter (exported for persistence adapters).
func MatchDemand(f DemandFilter, d Demand) bool {
	if f.OrgUnit != "" && d.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Student != "" && d.StudentID != f.Student {
		return false
	}
	if f.Category != "" && d.Category != f.Category {
		return false
	}
	if f.Status != "" && d.Status != f.Status {
		return false
	}
	return true
}

// PaymentFilter narrows a payment listing.
type PaymentFilter struct {
	OrgUnit  string
	DemandID string
	Student  string
}

// MatchPayment reports whether a payment satisfies a filter (exported for persistence adapters).
func MatchPayment(f PaymentFilter, p Payment) bool {
	if f.OrgUnit != "" && p.OrgUnit != f.OrgUnit {
		return false
	}
	if f.DemandID != "" && p.DemandID != f.DemandID {
		return false
	}
	if f.Student != "" && p.StudentID != f.Student {
		return false
	}
	return true
}

// Store is the in-memory fee ledger holding demands and their payments (credential-free demo).
type Store struct {
	demands  map[string]Demand
	payments map[string]Payment
}

// NewStore returns an empty store.
func NewStore() *Store {
	return &Store{demands: map[string]Demand{}, payments: map[string]Payment{}}
}

func (s *Store) listPayments() []Payment {
	out := make([]Payment, 0, len(s.payments))
	for _, p := range s.payments {
		out = append(out, p)
	}
	return out
}

// RaiseDemand validates and stores (or updates) a fee demand by id.
func (s *Store) RaiseDemand(d Demand) (Demand, error) {
	if d.Status == "" {
		d.Status = Pending
	}
	if err := d.Validate(); err != nil {
		return Demand{}, err
	}
	s.demands[d.ID] = d
	return d, nil
}

// GetDemand returns a demand by id.
func (s *Store) GetDemand(id string) (Demand, bool) { d, ok := s.demands[id]; return d, ok }

// RecordPayment records a collection against a demand, enforcing the money invariants: the demand must be open
// (pending/partial), and the payment cannot take the collected total above the amount demanded (no overpayment).
// The demand's status is recomputed (partial/paid). Idempotent: re-recording the same payment id corrects.
func (s *Store) RecordPayment(p Payment) (Payment, error) {
	if err := p.Validate(); err != nil {
		return Payment{}, err
	}
	d, ok := s.demands[p.DemandID]
	if !ok {
		return Payment{}, errors.New("fees: unknown demand " + p.DemandID)
	}
	if !d.Open() {
		return Payment{}, errors.New("fees: demand " + d.ID + " is " + d.Status + " and cannot take payment")
	}
	// exclude this payment's own prior amount so a correction recomputes cleanly.
	priorOthers := PaidSoFar(s.listPayments(), p.DemandID, p.ID)
	if priorOthers+p.AmountPaise > d.AmountPaise {
		return Payment{}, errors.New("fees: payment would overpay demand " + d.ID +
			" — outstanding " + strconv.FormatInt(d.AmountPaise-priorOthers, 10) + "p, tendered " + strconv.FormatInt(p.AmountPaise, 10) + "p")
	}
	if p.OrgUnit == "" {
		p.OrgUnit = d.OrgUnit
	}
	if p.StudentID == "" {
		p.StudentID = d.StudentID
	}
	s.payments[p.ID] = p
	d.Status = statusFor(d.AmountPaise, priorOthers+p.AmountPaise)
	s.demands[d.ID] = d
	return p, nil
}

// WaiveDemand grants a concession on an open demand (no further collection). A paid demand cannot be waived.
func (s *Store) WaiveDemand(id string) (Demand, error) {
	d, ok := s.demands[id]
	if !ok {
		return Demand{}, errors.New("fees: unknown demand " + id)
	}
	if d.Status == Paid {
		return Demand{}, errors.New("fees: a paid demand cannot be waived")
	}
	if d.Status == Cancelled {
		return Demand{}, errors.New("fees: a cancelled demand cannot be waived")
	}
	d.Status = Waived
	s.demands[id] = d
	return d, nil
}

// Outstanding returns the unpaid balance on a demand (0 for waived/cancelled/paid).
func (s *Store) Outstanding(id string) int64 {
	d, ok := s.demands[id]
	if !ok || !d.Open() {
		return 0
	}
	return d.AmountPaise - PaidSoFar(s.listPayments(), id, "")
}

// ListDemands returns the filtered demands ordered by due date then id.
func (s *Store) ListDemands(f DemandFilter) []Demand {
	var out []Demand
	for _, d := range s.demands {
		if MatchDemand(f, d) {
			out = append(out, d)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].DueOn != out[j].DueOn {
			return out[i].DueOn < out[j].DueOn
		}
		return out[i].ID < out[j].ID
	})
	return out
}

// ListPayments returns the filtered payments ordered by paid date (most recent first) then id.
func (s *Store) ListPayments(f PaymentFilter) []Payment {
	var out []Payment
	for _, p := range s.payments {
		if MatchPayment(f, p) {
			out = append(out, p)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].PaidOn != out[j].PaidOn {
			return out[i].PaidOn > out[j].PaidOn
		}
		return out[i].ID < out[j].ID
	})
	return out
}

// CountDemands returns the number of demands.
func (s *Store) CountDemands() int { return len(s.demands) }

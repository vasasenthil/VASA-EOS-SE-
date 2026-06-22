// Package library is the L6 School Library circulation service: the durable record of physical book copies
// issued to members (students/teachers), with the one hard invariant a library must hold — a single physical
// copy can be on loan to at most one member at a time — plus the overdue analytics a librarian needs. A
// constraint-checked state machine (issue → renew* → return | lost), pure + stdlib-only.
package library

import (
	"errors"
	"sort"
	"time"
)

// Loan lifecycle statuses.
const (
	OnLoan   = "on_loan"
	Returned = "returned"
	Lost     = "lost"
)

// LoanPeriodDays is the default circulation period; MaxRenewals caps how many times a loan may be extended.
const (
	LoanPeriodDays = 14
	MaxRenewals    = 2
)

const dateLayout = "2006-01-02"

// Loan is one circulation record: a physical copy issued to a member.
type Loan struct {
	ID         string `json:"id"`
	OrgUnit    string `json:"org_unit"` // the school library (T6 tenancy node)
	BookID     string `json:"book_id"`  // catalogue id / ISBN
	Title      string `json:"title"`
	CopyID     string `json:"copy_id"`   // the physical copy barcode (unique within a library)
	MemberID   string `json:"member_id"` // borrower (synthetic student/teacher id)
	IssuedOn   string `json:"issued_on"` // YYYY-MM-DD
	DueOn      string `json:"due_on"`    // YYYY-MM-DD
	ReturnedOn string `json:"returned_on,omitempty"`
	Status     string `json:"status"`
	Renewals   int    `json:"renewals"`
}

func validStatus(s string) bool {
	switch s {
	case OnLoan, Returned, Lost:
		return true
	}
	return false
}

func parseDate(s string) (time.Time, error) { return time.Parse(dateLayout, s) }

// Validate checks the loan's required fields, status and dates.
func (l Loan) Validate() error {
	if l.ID == "" || l.OrgUnit == "" || l.BookID == "" || l.CopyID == "" || l.MemberID == "" {
		return errors.New("library: id, org_unit, book_id, copy_id and member_id are required")
	}
	if !validStatus(l.Status) {
		return errors.New("library: invalid status " + l.Status)
	}
	issued, err := parseDate(l.IssuedOn)
	if err != nil {
		return errors.New("library: invalid issued_on (want YYYY-MM-DD)")
	}
	due, err := parseDate(l.DueOn)
	if err != nil {
		return errors.New("library: invalid due_on (want YYYY-MM-DD)")
	}
	if due.Before(issued) {
		return errors.New("library: due_on cannot precede issued_on")
	}
	if l.ReturnedOn != "" {
		if _, err := parseDate(l.ReturnedOn); err != nil {
			return errors.New("library: invalid returned_on (want YYYY-MM-DD)")
		}
	}
	return nil
}

// NewLoan builds an on-loan record, computing the due date from the default circulation period.
func NewLoan(id, org, bookID, title, copyID, member, issuedOn string) (Loan, error) {
	issued, err := parseDate(issuedOn)
	if err != nil {
		return Loan{}, errors.New("library: invalid issued_on (want YYYY-MM-DD)")
	}
	l := Loan{
		ID: id, OrgUnit: org, BookID: bookID, Title: title, CopyID: copyID, MemberID: member,
		IssuedOn: issuedOn, DueOn: issued.AddDate(0, 0, LoanPeriodDays).Format(dateLayout), Status: OnLoan,
	}
	if err := l.Validate(); err != nil {
		return Loan{}, err
	}
	return l, nil
}

// ApplyReturn marks an on-loan copy returned on the given date.
func ApplyReturn(l Loan, on string) (Loan, error) {
	if l.Status != OnLoan {
		return Loan{}, errors.New("library: only an on-loan copy can be returned")
	}
	if _, err := parseDate(on); err != nil {
		return Loan{}, errors.New("library: invalid return date (want YYYY-MM-DD)")
	}
	l.Status = Returned
	l.ReturnedOn = on
	return l, nil
}

// ApplyRenew extends an on-loan copy's due date by one circulation period, up to MaxRenewals times.
func ApplyRenew(l Loan) (Loan, error) {
	if l.Status != OnLoan {
		return Loan{}, errors.New("library: only an on-loan copy can be renewed")
	}
	if l.Renewals >= MaxRenewals {
		return Loan{}, errors.New("library: renewal limit reached")
	}
	due, err := parseDate(l.DueOn)
	if err != nil {
		return Loan{}, errors.New("library: invalid due_on (want YYYY-MM-DD)")
	}
	l.DueOn = due.AddDate(0, 0, LoanPeriodDays).Format(dateLayout)
	l.Renewals++
	return l, nil
}

// ApplyLost marks an on-loan copy lost (it leaves circulation; the member owes a replacement).
func ApplyLost(l Loan) (Loan, error) {
	if l.Status != OnLoan {
		return Loan{}, errors.New("library: only an on-loan copy can be marked lost")
	}
	l.Status = Lost
	return l, nil
}

// IsOverdue reports whether an on-loan copy is past its due date as of the given day (YYYY-MM-DD).
func IsOverdue(l Loan, asOf string) bool {
	return l.Status == OnLoan && l.DueOn < asOf
}

// Filter narrows a listing.
type Filter struct {
	OrgUnit string
	Member  string
	BookID  string
	CopyID  string
	Status  string
}

// Match reports whether a loan satisfies a filter (exported for persistence adapters).
func Match(f Filter, l Loan) bool {
	if f.OrgUnit != "" && l.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Member != "" && l.MemberID != f.Member {
		return false
	}
	if f.BookID != "" && l.BookID != f.BookID {
		return false
	}
	if f.CopyID != "" && l.CopyID != f.CopyID {
		return false
	}
	if f.Status != "" && l.Status != f.Status {
		return false
	}
	return true
}

// Store is the in-memory circulation store (credential-free demo).
type Store struct{ loans map[string]Loan }

// NewStore returns an empty store.
func NewStore() *Store { return &Store{loans: map[string]Loan{}} }

// copyOnLoan returns the id of an active loan holding the same physical copy (other than excludeID), if any.
func (s *Store) copyOnLoan(org, copyID, excludeID string) (string, bool) {
	for id, l := range s.loans {
		if id == excludeID {
			continue
		}
		if l.OrgUnit == org && l.CopyID == copyID && l.Status == OnLoan {
			return id, true
		}
	}
	return "", false
}

// Issue records a new loan, enforcing that the physical copy is not already on loan to someone else.
func (s *Store) Issue(l Loan) (Loan, error) {
	if err := l.Validate(); err != nil {
		return Loan{}, err
	}
	if holder, busy := s.copyOnLoan(l.OrgUnit, l.CopyID, l.ID); busy {
		return Loan{}, errors.New("library: copy " + l.CopyID + " is already on loan (" + holder + ")")
	}
	s.loans[l.ID] = l
	return l, nil
}

// Return applies a return transition to a stored loan.
func (s *Store) Return(id, on string) (Loan, error) {
	l, ok := s.loans[id]
	if !ok {
		return Loan{}, errors.New("library: no such loan " + id)
	}
	out, err := ApplyReturn(l, on)
	if err != nil {
		return Loan{}, err
	}
	s.loans[id] = out
	return out, nil
}

// Renew applies a renewal transition to a stored loan.
func (s *Store) Renew(id string) (Loan, error) {
	l, ok := s.loans[id]
	if !ok {
		return Loan{}, errors.New("library: no such loan " + id)
	}
	out, err := ApplyRenew(l)
	if err != nil {
		return Loan{}, err
	}
	s.loans[id] = out
	return out, nil
}

// MarkLost applies a lost transition to a stored loan.
func (s *Store) MarkLost(id string) (Loan, error) {
	l, ok := s.loans[id]
	if !ok {
		return Loan{}, errors.New("library: no such loan " + id)
	}
	out, err := ApplyLost(l)
	if err != nil {
		return Loan{}, err
	}
	s.loans[id] = out
	return out, nil
}

// Get returns a loan by id.
func (s *Store) Get(id string) (Loan, bool) { l, ok := s.loans[id]; return l, ok }

// List returns the filtered loans ordered by issue date (most recent first) then id.
func (s *Store) List(f Filter) []Loan {
	var out []Loan
	for _, l := range s.loans {
		if Match(f, l) {
			out = append(out, l)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].IssuedOn != out[j].IssuedOn {
			return out[i].IssuedOn > out[j].IssuedOn
		}
		return out[i].ID < out[j].ID
	})
	return out
}

// Count returns the number of loans.
func (s *Store) Count() int { return len(s.loans) }

// OverdueCount returns how many loans in a set are overdue as of the given day.
func OverdueCount(loans []Loan, asOf string) int {
	n := 0
	for _, l := range loans {
		if IsOverdue(l, asOf) {
			n++
		}
	}
	return n
}

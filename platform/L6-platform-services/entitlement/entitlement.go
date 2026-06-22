// Package entitlement is the L6 Free-Supply Entitlement Distribution service: the durable record of what each
// student is entitled to under Tamil Nadu's free-supply schemes (textbooks, notebooks, uniforms, shoes, bags,
// cycles) and what has actually been issued, with the accountability invariant a distribution register must
// hold — a student can never be issued MORE than their entitlement (the over-issue / leakage gate). Quantities
// are whole units; a re-issue against the same record corrects idempotently. Fulfilment status (pending →
// partial → fulfilled) is derived. Pure + stdlib-only.
package entitlement

import (
	"errors"
	"sort"
	"strconv"
	"time"
)

// Entitlement fulfilment statuses.
const (
	Pending   = "pending"   // granted, nothing issued
	Partial   = "partial"   // some issued, balance remains
	Fulfilled = "fulfilled" // fully supplied
	Cancelled = "cancelled" // granted in error
)

const dateLayout = "2006-01-02"

func parseDate(s string) (time.Time, error) { return time.Parse(dateLayout, s) }

func validStatus(s string) bool {
	switch s {
	case Pending, Partial, Fulfilled, Cancelled:
		return true
	}
	return false
}

// Entitlement is what one student is owed of one item under a scheme for a term.
type Entitlement struct {
	ID          string `json:"id"`
	OrgUnit     string `json:"org_unit"` // the school (T6 tenancy node)
	StudentID   string `json:"student_id"`
	Item        string `json:"item"` // textbook | notebook | uniform | shoes | bag | cycle | ...
	EntitledQty int    `json:"entitled_qty"`
	Term        string `json:"term"`
	Status      string `json:"status"`
}

// Validate checks an entitlement's required fields, quantity and status.
func (e Entitlement) Validate() error {
	if e.ID == "" || e.OrgUnit == "" || e.StudentID == "" {
		return errors.New("entitlement: id, org_unit and student_id are required")
	}
	if e.Item == "" {
		return errors.New("entitlement: item is required")
	}
	if e.EntitledQty <= 0 || e.EntitledQty > 1000 {
		return errors.New("entitlement: entitled_qty must be 1..1000")
	}
	if !validStatus(e.Status) {
		return errors.New("entitlement: invalid status " + e.Status)
	}
	return nil
}

// Open reports whether an entitlement can still take an issue (granted and not closed).
func (e Entitlement) Open() bool { return e.Status == Pending || e.Status == Partial }

// Issue is one distribution event against an entitlement.
type Issue struct {
	ID            string `json:"id"`
	EntitlementID string `json:"entitlement_id"`
	OrgUnit       string `json:"org_unit"`
	StudentID     string `json:"student_id"`
	Qty           int    `json:"qty"`
	IssuedOn      string `json:"issued_on"` // YYYY-MM-DD
	Reference     string `json:"reference,omitempty"`
}

// Validate checks an issue's required fields, quantity and date.
func (i Issue) Validate() error {
	if i.ID == "" || i.EntitlementID == "" {
		return errors.New("entitlement: issue id and entitlement_id are required")
	}
	if i.Qty <= 0 {
		return errors.New("entitlement: issue qty must be positive")
	}
	if _, err := parseDate(i.IssuedOn); err != nil {
		return errors.New("entitlement: invalid issued_on (want YYYY-MM-DD)")
	}
	return nil
}

// IssuedSoFar totals the units issued against an entitlement (optionally excluding one issue id, so a re-issue
// can be computed idempotently).
func IssuedSoFar(issues []Issue, entitlementID, excludeID string) int {
	total := 0
	for _, i := range issues {
		if i.EntitlementID == entitlementID && i.ID != excludeID {
			total += i.Qty
		}
	}
	return total
}

// statusFor derives an entitlement's status from how much has been issued against its quantity.
func statusFor(entitled, issued int) string {
	if issued >= entitled {
		return Fulfilled
	}
	if issued > 0 {
		return Partial
	}
	return Pending
}

// EntitlementFilter narrows an entitlement listing.
type EntitlementFilter struct {
	OrgUnit string
	Student string
	Item    string
	Status  string
}

// MatchEntitlement reports whether an entitlement satisfies a filter (exported for persistence adapters).
func MatchEntitlement(f EntitlementFilter, e Entitlement) bool {
	if f.OrgUnit != "" && e.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Student != "" && e.StudentID != f.Student {
		return false
	}
	if f.Item != "" && e.Item != f.Item {
		return false
	}
	if f.Status != "" && e.Status != f.Status {
		return false
	}
	return true
}

// IssueFilter narrows an issue listing.
type IssueFilter struct {
	OrgUnit       string
	EntitlementID string
	Student       string
}

// MatchIssue reports whether an issue satisfies a filter (exported for persistence adapters).
func MatchIssue(f IssueFilter, i Issue) bool {
	if f.OrgUnit != "" && i.OrgUnit != f.OrgUnit {
		return false
	}
	if f.EntitlementID != "" && i.EntitlementID != f.EntitlementID {
		return false
	}
	if f.Student != "" && i.StudentID != f.Student {
		return false
	}
	return true
}

// Store is the in-memory entitlement register holding entitlements and their issues (credential-free demo).
type Store struct {
	ents   map[string]Entitlement
	issues map[string]Issue
}

// NewStore returns an empty store.
func NewStore() *Store {
	return &Store{ents: map[string]Entitlement{}, issues: map[string]Issue{}}
}

func (s *Store) listIssues() []Issue {
	out := make([]Issue, 0, len(s.issues))
	for _, i := range s.issues {
		out = append(out, i)
	}
	return out
}

// GrantEntitlement validates and stores (or updates) an entitlement by id.
func (s *Store) GrantEntitlement(e Entitlement) (Entitlement, error) {
	if e.Status == "" {
		e.Status = Pending
	}
	if err := e.Validate(); err != nil {
		return Entitlement{}, err
	}
	s.ents[e.ID] = e
	return e, nil
}

// GetEntitlement returns an entitlement by id.
func (s *Store) GetEntitlement(id string) (Entitlement, bool) { e, ok := s.ents[id]; return e, ok }

// IssueSupply records a distribution against an entitlement, enforcing the over-issue gate: the entitlement must
// be open and the issue cannot take the issued total above the entitled quantity. The status is recomputed.
// Idempotent: re-recording the same issue id corrects.
func (s *Store) IssueSupply(i Issue) (Issue, error) {
	if err := i.Validate(); err != nil {
		return Issue{}, err
	}
	e, ok := s.ents[i.EntitlementID]
	if !ok {
		return Issue{}, errors.New("entitlement: unknown entitlement " + i.EntitlementID)
	}
	if !e.Open() {
		return Issue{}, errors.New("entitlement: " + e.ID + " is " + e.Status + " and takes no more issues")
	}
	priorOthers := IssuedSoFar(s.listIssues(), i.EntitlementID, i.ID)
	if priorOthers+i.Qty > e.EntitledQty {
		return Issue{}, errors.New("entitlement: issue would over-issue " + e.ID +
			" — remaining " + strconv.Itoa(e.EntitledQty-priorOthers) + ", tendered " + strconv.Itoa(i.Qty))
	}
	if i.OrgUnit == "" {
		i.OrgUnit = e.OrgUnit
	}
	if i.StudentID == "" {
		i.StudentID = e.StudentID
	}
	s.issues[i.ID] = i
	e.Status = statusFor(e.EntitledQty, priorOthers+i.Qty)
	s.ents[e.ID] = e
	return i, nil
}

// Remaining returns the unissued balance on an entitlement (0 for closed entitlements).
func (s *Store) Remaining(id string) int {
	e, ok := s.ents[id]
	if !ok || !e.Open() {
		return 0
	}
	return e.EntitledQty - IssuedSoFar(s.listIssues(), id, "")
}

// ListEntitlements returns the filtered entitlements ordered by student then id.
func (s *Store) ListEntitlements(f EntitlementFilter) []Entitlement {
	var out []Entitlement
	for _, e := range s.ents {
		if MatchEntitlement(f, e) {
			out = append(out, e)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].StudentID != out[j].StudentID {
			return out[i].StudentID < out[j].StudentID
		}
		return out[i].ID < out[j].ID
	})
	return out
}

// ListIssues returns the filtered issues ordered by date (most recent first) then id.
func (s *Store) ListIssues(f IssueFilter) []Issue {
	var out []Issue
	for _, i := range s.issues {
		if MatchIssue(f, i) {
			out = append(out, i)
		}
	}
	sort.Slice(out, func(a, b int) bool {
		if out[a].IssuedOn != out[b].IssuedOn {
			return out[a].IssuedOn > out[b].IssuedOn
		}
		return out[a].ID < out[b].ID
	})
	return out
}

// CountEntitlements returns the number of entitlements.
func (s *Store) CountEntitlements() int { return len(s.ents) }

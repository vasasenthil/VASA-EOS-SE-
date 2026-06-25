// Package infra is the L6 Infrastructure & Asset Register service: the durable register of a school's physical
// assets and rooms (with a condition grade) and the maintenance tickets raised against them, as a
// constraint-checked state machine. It holds the operational invariants an asset register must keep — a ticket
// can only be raised against a known, non-decommissioned asset; a ticket walks open → in_progress → resolved →
// closed (no skips); and an asset can NEVER be decommissioned while it still has open maintenance tickets (you
// cannot retire a room mid-repair). Pure + stdlib-only.
package infra

import (
	"errors"
	"sort"
	"time"
)

// Asset condition grades.
const (
	Good     = "good"
	Fair     = "fair"
	Poor     = "poor"
	Unusable = "unusable"
)

// Asset lifecycle statuses.
const (
	InService        = "in_service"
	UnderMaintenance = "under_maintenance"
	Decommissioned   = "decommissioned"
)

// Maintenance-ticket lifecycle statuses.
const (
	TicketOpen       = "open"
	TicketInProgress = "in_progress"
	TicketResolved   = "resolved"
	TicketClosed     = "closed"
)

// Ticket severities.
const (
	SevLow      = "low"
	SevMedium   = "medium"
	SevHigh     = "high"
	SevCritical = "critical"
)

const dateLayout = "2006-01-02"

func parseDate(s string) (time.Time, error) { return time.Parse(dateLayout, s) }

func validCondition(c string) bool {
	switch c {
	case Good, Fair, Poor, Unusable:
		return true
	}
	return false
}

func validAssetStatus(s string) bool {
	switch s {
	case InService, UnderMaintenance, Decommissioned:
		return true
	}
	return false
}

func validSeverity(s string) bool {
	switch s {
	case SevLow, SevMedium, SevHigh, SevCritical:
		return true
	}
	return false
}

// Asset is one physical asset or room in a school's register.
type Asset struct {
	ID         string `json:"id"`
	OrgUnit    string `json:"org_unit"` // the school (T6 tenancy node)
	Name       string `json:"name"`
	Category   string `json:"category"` // room | furniture | equipment | ict | sanitation | ...
	Condition  string `json:"condition"`
	Status     string `json:"status"`
	AcquiredOn string `json:"acquired_on,omitempty"` // YYYY-MM-DD
}

// Validate checks an asset's required fields, condition and status.
func (a Asset) Validate() error {
	if a.ID == "" || a.OrgUnit == "" || a.Name == "" {
		return errors.New("infra: asset id, org_unit and name are required")
	}
	if a.Category == "" {
		return errors.New("infra: asset category is required")
	}
	if !validCondition(a.Condition) {
		return errors.New("infra: invalid condition " + a.Condition)
	}
	if !validAssetStatus(a.Status) {
		return errors.New("infra: invalid status " + a.Status)
	}
	if a.AcquiredOn != "" {
		if _, err := parseDate(a.AcquiredOn); err != nil {
			return errors.New("infra: invalid acquired_on (want YYYY-MM-DD)")
		}
	}
	return nil
}

// Ticket is a maintenance request against an asset.
type Ticket struct {
	ID         string `json:"id"`
	AssetID    string `json:"asset_id"`
	OrgUnit    string `json:"org_unit"`
	Issue      string `json:"issue"`
	Severity   string `json:"severity"`
	Status     string `json:"status"`
	RaisedOn   string `json:"raised_on"`
	Assignee   string `json:"assignee,omitempty"`
	ResolvedOn string `json:"resolved_on,omitempty"`
}

// Validate checks a ticket's required fields, severity and date.
func (t Ticket) Validate() error {
	if t.ID == "" || t.AssetID == "" || t.OrgUnit == "" {
		return errors.New("infra: ticket id, asset_id and org_unit are required")
	}
	if t.Issue == "" {
		return errors.New("infra: ticket issue is required")
	}
	if !validSeverity(t.Severity) {
		return errors.New("infra: invalid severity " + t.Severity)
	}
	if _, err := parseDate(t.RaisedOn); err != nil {
		return errors.New("infra: invalid raised_on (want YYYY-MM-DD)")
	}
	return nil
}

// Active reports whether a ticket is still open work (open or in_progress).
func (t Ticket) Active() bool { return t.Status == TicketOpen || t.Status == TicketInProgress }

// ApplyAssign moves an open ticket into progress, recording the assignee.
func ApplyAssign(t Ticket, assignee string) (Ticket, error) {
	if t.Status != TicketOpen {
		return Ticket{}, errors.New("infra: only an open ticket can be assigned")
	}
	if assignee == "" {
		return Ticket{}, errors.New("infra: an assignee is required")
	}
	t.Status = TicketInProgress
	t.Assignee = assignee
	return t, nil
}

// ApplyResolve moves an in-progress ticket to resolved on the given date.
func ApplyResolve(t Ticket, on string) (Ticket, error) {
	if t.Status != TicketInProgress {
		return Ticket{}, errors.New("infra: only an in-progress ticket can be resolved")
	}
	if _, err := parseDate(on); err != nil {
		return Ticket{}, errors.New("infra: invalid resolve date (want YYYY-MM-DD)")
	}
	t.Status = TicketResolved
	t.ResolvedOn = on
	return t, nil
}

// ApplyClose closes a resolved ticket (the verification step).
func ApplyClose(t Ticket) (Ticket, error) {
	if t.Status != TicketResolved {
		return Ticket{}, errors.New("infra: only a resolved ticket can be closed")
	}
	t.Status = TicketClosed
	return t, nil
}

// AssetFilter narrows an asset listing.
type AssetFilter struct {
	OrgUnit   string
	Category  string
	Condition string
	Status    string
}

// MatchAsset reports whether an asset satisfies a filter (exported for persistence adapters).
func MatchAsset(f AssetFilter, a Asset) bool {
	if f.OrgUnit != "" && a.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Category != "" && a.Category != f.Category {
		return false
	}
	if f.Condition != "" && a.Condition != f.Condition {
		return false
	}
	if f.Status != "" && a.Status != f.Status {
		return false
	}
	return true
}

// TicketFilter narrows a ticket listing.
type TicketFilter struct {
	OrgUnit  string
	AssetID  string
	Status   string
	Severity string
}

// MatchTicket reports whether a ticket satisfies a filter (exported for persistence adapters).
func MatchTicket(f TicketFilter, t Ticket) bool {
	if f.OrgUnit != "" && t.OrgUnit != f.OrgUnit {
		return false
	}
	if f.AssetID != "" && t.AssetID != f.AssetID {
		return false
	}
	if f.Status != "" && t.Status != f.Status {
		return false
	}
	if f.Severity != "" && t.Severity != f.Severity {
		return false
	}
	return true
}

// OpenTicketCount counts the active tickets for an asset across a set of tickets.
func OpenTicketCount(tickets []Ticket, assetID string) int {
	n := 0
	for _, t := range tickets {
		if t.AssetID == assetID && t.Active() {
			n++
		}
	}
	return n
}

// Store is the in-memory infrastructure store holding assets and their maintenance tickets.
type Store struct {
	assets  map[string]Asset
	tickets map[string]Ticket
}

// NewStore returns an empty store.
func NewStore() *Store {
	return &Store{assets: map[string]Asset{}, tickets: map[string]Ticket{}}
}

// UpsertAsset validates and stores (or updates) an asset by id.
func (s *Store) UpsertAsset(a Asset) (Asset, error) {
	if err := a.Validate(); err != nil {
		return Asset{}, err
	}
	s.assets[a.ID] = a
	return a, nil
}

// GetAsset returns an asset by id.
func (s *Store) GetAsset(id string) (Asset, bool) { a, ok := s.assets[id]; return a, ok }

func (s *Store) listTickets() []Ticket {
	out := make([]Ticket, 0, len(s.tickets))
	for _, t := range s.tickets {
		out = append(out, t)
	}
	return out
}

// RaiseTicket opens a maintenance ticket against an asset, enforcing that the asset exists and is not
// decommissioned. A critical ticket auto-flips the asset to under_maintenance (it should not stay in service).
func (s *Store) RaiseTicket(t Ticket) (Ticket, error) {
	t.Status = TicketOpen
	t.Assignee = ""
	t.ResolvedOn = ""
	if err := t.Validate(); err != nil {
		return Ticket{}, err
	}
	a, ok := s.assets[t.AssetID]
	if !ok {
		return Ticket{}, errors.New("infra: unknown asset " + t.AssetID)
	}
	if a.Status == Decommissioned {
		return Ticket{}, errors.New("infra: cannot raise a ticket against a decommissioned asset")
	}
	s.tickets[t.ID] = t
	if t.Severity == SevCritical && a.Status == InService {
		a.Status = UnderMaintenance
		s.assets[a.ID] = a
	}
	return t, nil
}

// AssignTicket assigns an open ticket (open → in_progress).
func (s *Store) AssignTicket(id, assignee string) (Ticket, error) {
	t, ok := s.tickets[id]
	if !ok {
		return Ticket{}, errors.New("infra: no such ticket " + id)
	}
	out, err := ApplyAssign(t, assignee)
	if err != nil {
		return Ticket{}, err
	}
	s.tickets[id] = out
	return out, nil
}

// ResolveTicket resolves an in-progress ticket (in_progress → resolved).
func (s *Store) ResolveTicket(id, on string) (Ticket, error) {
	t, ok := s.tickets[id]
	if !ok {
		return Ticket{}, errors.New("infra: no such ticket " + id)
	}
	out, err := ApplyResolve(t, on)
	if err != nil {
		return Ticket{}, err
	}
	s.tickets[id] = out
	return out, nil
}

// CloseTicket closes a resolved ticket (resolved → closed).
func (s *Store) CloseTicket(id string) (Ticket, error) {
	t, ok := s.tickets[id]
	if !ok {
		return Ticket{}, errors.New("infra: no such ticket " + id)
	}
	out, err := ApplyClose(t)
	if err != nil {
		return Ticket{}, err
	}
	s.tickets[id] = out
	return out, nil
}

// DecommissionAsset retires an asset — but only if it has no open maintenance tickets (you cannot retire a room
// mid-repair). This is the core register invariant.
func (s *Store) DecommissionAsset(id string) (Asset, error) {
	a, ok := s.assets[id]
	if !ok {
		return Asset{}, errors.New("infra: unknown asset " + id)
	}
	if n := OpenTicketCount(s.listTickets(), id); n > 0 {
		return Asset{}, errors.New("infra: cannot decommission an asset with open maintenance tickets — close them first")
	}
	a.Status = Decommissioned
	s.assets[id] = a
	return a, nil
}

// ReturnAssetToService returns a non-decommissioned asset to service, optionally updating its condition. It is
// refused while open tickets remain (the repair is not finished).
func (s *Store) ReturnAssetToService(id, condition string) (Asset, error) {
	a, ok := s.assets[id]
	if !ok {
		return Asset{}, errors.New("infra: unknown asset " + id)
	}
	if a.Status == Decommissioned {
		return Asset{}, errors.New("infra: a decommissioned asset cannot return to service")
	}
	if n := OpenTicketCount(s.listTickets(), id); n > 0 {
		return Asset{}, errors.New("infra: cannot return an asset to service with open tickets")
	}
	if condition != "" {
		if !validCondition(condition) {
			return Asset{}, errors.New("infra: invalid condition " + condition)
		}
		a.Condition = condition
	}
	a.Status = InService
	s.assets[id] = a
	return a, nil
}

// GetTicket returns a ticket by id.
func (s *Store) GetTicket(id string) (Ticket, bool) { t, ok := s.tickets[id]; return t, ok }

// ListAssets returns the filtered assets ordered by id.
func (s *Store) ListAssets(f AssetFilter) []Asset {
	var out []Asset
	for _, a := range s.assets {
		if MatchAsset(f, a) {
			out = append(out, a)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out
}

// ListTickets returns the filtered tickets ordered by raised date (most recent first) then id.
func (s *Store) ListTickets(f TicketFilter) []Ticket {
	var out []Ticket
	for _, t := range s.tickets {
		if MatchTicket(f, t) {
			out = append(out, t)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].RaisedOn != out[j].RaisedOn {
			return out[i].RaisedOn > out[j].RaisedOn
		}
		return out[i].ID < out[j].ID
	})
	return out
}

// CountAssets returns the number of assets.
func (s *Store) CountAssets() int { return len(s.assets) }

// Package mdm is the L6 Mid-Day Meal (PM-POSHAN) service: the durable per-school foodgrain stock ledger and the
// daily meal-service register, with the two accountability invariants the scheme must hold — foodgrain stock
// can never go NEGATIVE (a day's cooking can never consume more grain than is on hand, the core leakage gate),
// and meals served can never exceed the day's enrolment (a data-quality gate). Foodgrain is tracked in GRAMS
// (int64, never floats), mirroring the money-in-paise discipline. Pure + stdlib-only.
package mdm

import (
	"errors"
	"sort"
	"strconv"
	"time"
)

// Ledger entry kinds.
const (
	Receipt     = "receipt"     // grain allotted in (FCI / TPDS lifting)
	Consumption = "consumption" // grain cooked out (a day's meal)
)

// PM-POSHAN per-child cooking norm (grams of foodgrain per meal): 100g primary, 150g upper-primary.
const (
	GramsPrimary      = 100
	GramsUpperPrimary = 150
)

const dateLayout = "2006-01-02"

func parseDate(s string) (time.Time, error) { return time.Parse(dateLayout, s) }

// LedgerEntry is one movement of foodgrain stock at a school (a receipt in, or a day's consumption out).
type LedgerEntry struct {
	ID         string `json:"id"`
	OrgUnit    string `json:"org_unit"` // the school (T6 tenancy node)
	Date       string `json:"date"`     // YYYY-MM-DD
	Kind       string `json:"kind"`     // receipt | consumption
	GrainGrams int64  `json:"grain_grams"`
	Note       string `json:"note,omitempty"`
}

func validKind(k string) bool { return k == Receipt || k == Consumption }

// Validate checks a ledger entry's required fields, kind, date and grain.
func (e LedgerEntry) Validate() error {
	if e.ID == "" || e.OrgUnit == "" {
		return errors.New("mdm: ledger id and org_unit are required")
	}
	if !validKind(e.Kind) {
		return errors.New("mdm: invalid ledger kind " + e.Kind)
	}
	if _, err := parseDate(e.Date); err != nil {
		return errors.New("mdm: invalid date (want YYYY-MM-DD)")
	}
	if e.GrainGrams <= 0 {
		return errors.New("mdm: grain_grams must be positive")
	}
	return nil
}

// MealDay is one day's meal service at a school.
type MealDay struct {
	ID          string `json:"id"`
	OrgUnit     string `json:"org_unit"`
	Date        string `json:"date"`
	MealsServed int    `json:"meals_served"`
	Enrolment   int    `json:"enrolment"`
	GrainGrams  int64  `json:"grain_grams"` // grain cooked for this day's service
}

// Validate checks a meal day's required fields, counts and grain.
func (m MealDay) Validate() error {
	if m.ID == "" || m.OrgUnit == "" {
		return errors.New("mdm: meal id and org_unit are required")
	}
	if _, err := parseDate(m.Date); err != nil {
		return errors.New("mdm: invalid date (want YYYY-MM-DD)")
	}
	if m.Enrolment <= 0 {
		return errors.New("mdm: enrolment must be positive")
	}
	if m.MealsServed < 0 {
		return errors.New("mdm: meals_served cannot be negative")
	}
	if m.GrainGrams < 0 {
		return errors.New("mdm: grain_grams cannot be negative")
	}
	return nil
}

// CoverageRate returns meals served as a percentage of enrolment for a meal day.
func (m MealDay) CoverageRate() float64 {
	if m.Enrolment == 0 {
		return 0
	}
	return float64(m.MealsServed) * 100 / float64(m.Enrolment)
}

// Balance returns the running foodgrain stock for a school across a set of ledger entries (receipts minus
// consumptions), optionally excluding one entry id (so a re-serve can be computed idempotently).
func Balance(entries []LedgerEntry, org, excludeID string) int64 {
	var bal int64
	for _, e := range entries {
		if e.OrgUnit != org || e.ID == excludeID {
			continue
		}
		switch e.Kind {
		case Receipt:
			bal += e.GrainGrams
		case Consumption:
			bal -= e.GrainGrams
		}
	}
	return bal
}

// LedgerFilter narrows a ledger listing.
type LedgerFilter struct {
	OrgUnit string
	Kind    string
}

// MatchLedger reports whether a ledger entry satisfies a filter (exported for persistence adapters).
func MatchLedger(f LedgerFilter, e LedgerEntry) bool {
	if f.OrgUnit != "" && e.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Kind != "" && e.Kind != f.Kind {
		return false
	}
	return true
}

// MealFilter narrows a meal-day listing.
type MealFilter struct {
	OrgUnit string
	Date    string
}

// MatchMeal reports whether a meal day satisfies a filter (exported for persistence adapters).
func MatchMeal(f MealFilter, m MealDay) bool {
	if f.OrgUnit != "" && m.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Date != "" && m.Date != f.Date {
		return false
	}
	return true
}

// Store is the in-memory MDM store holding the stock ledger and the meal register (credential-free demo).
type Store struct {
	ledger map[string]LedgerEntry
	meals  map[string]MealDay
}

// NewStore returns an empty store.
func NewStore() *Store {
	return &Store{ledger: map[string]LedgerEntry{}, meals: map[string]MealDay{}}
}

func (s *Store) listLedger() []LedgerEntry {
	out := make([]LedgerEntry, 0, len(s.ledger))
	for _, e := range s.ledger {
		out = append(out, e)
	}
	return out
}

// Balance returns a school's current foodgrain stock (grams).
func (s *Store) Balance(org string) int64 { return Balance(s.listLedger(), org, "") }

// Receive records a foodgrain receipt (grain lifted in), increasing the school's stock.
func (s *Store) Receive(e LedgerEntry) (LedgerEntry, error) {
	e.Kind = Receipt
	if err := e.Validate(); err != nil {
		return LedgerEntry{}, err
	}
	s.ledger[e.ID] = e
	return e, nil
}

// Serve records a day's meal service, enforcing the two invariants: meals served cannot exceed enrolment, and
// the grain cooked cannot exceed the stock on hand. It writes the meal record AND a matching consumption ledger
// entry (sharing the meal id) so the stock draws down. Idempotent: re-serving the same id corrects in place.
func (s *Store) Serve(m MealDay) (MealDay, error) {
	if err := m.Validate(); err != nil {
		return MealDay{}, err
	}
	if m.MealsServed > m.Enrolment {
		return MealDay{}, errors.New("mdm: meals served (" + strconv.Itoa(m.MealsServed) + ") cannot exceed enrolment (" + strconv.Itoa(m.Enrolment) + ")")
	}
	// available excludes this meal's own prior consumption entry, so a correction recomputes cleanly.
	avail := Balance(s.listLedger(), m.OrgUnit, m.ID)
	if m.GrainGrams > avail {
		return MealDay{}, errors.New("mdm: insufficient foodgrain stock — need " + strconv.FormatInt(m.GrainGrams, 10) + "g, have " + strconv.FormatInt(avail, 10) + "g")
	}
	s.meals[m.ID] = m
	s.ledger[m.ID] = LedgerEntry{ID: m.ID, OrgUnit: m.OrgUnit, Date: m.Date, Kind: Consumption, GrainGrams: m.GrainGrams, Note: "MDM service " + m.Date}
	return m, nil
}

// GetMeal returns a meal day by id.
func (s *Store) GetMeal(id string) (MealDay, bool) { m, ok := s.meals[id]; return m, ok }

// ListLedger returns the filtered ledger entries ordered by date then id.
func (s *Store) ListLedger(f LedgerFilter) []LedgerEntry {
	var out []LedgerEntry
	for _, e := range s.ledger {
		if MatchLedger(f, e) {
			out = append(out, e)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Date != out[j].Date {
			return out[i].Date < out[j].Date
		}
		return out[i].ID < out[j].ID
	})
	return out
}

// ListMeals returns the filtered meal days ordered by date (most recent first) then id.
func (s *Store) ListMeals(f MealFilter) []MealDay {
	var out []MealDay
	for _, m := range s.meals {
		if MatchMeal(f, m) {
			out = append(out, m)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Date != out[j].Date {
			return out[i].Date > out[j].Date
		}
		return out[i].ID < out[j].ID
	})
	return out
}

// CountMeals returns the number of meal-day records.
func (s *Store) CountMeals() int { return len(s.meals) }

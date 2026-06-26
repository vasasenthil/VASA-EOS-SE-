// Package rbsk is the L12 Child-Health Screening service (Rashtriya Bal Swasthya Karyakram): every student is
// screened for the FOUR Ds — Defects at birth, Diseases, Deficiencies, Developmental delays incl. Disability —
// and any finding is auto-referred to the District Early Intervention Centre (DEIC), then followed through
// treatment to closure. A child-welfare referral pipeline. Pure + stdlib-only.
package rbsk

import (
	"errors"
	"sort"
	"time"
)

// The four Ds (RBSK condition categories).
const (
	Defect     = "defect"     // defects at birth
	Disease    = "disease"    // childhood diseases
	Deficiency = "deficiency" // nutritional deficiencies (anaemia, VAD, …)
	Disability = "disability" // developmental delays including disability
)

// Screening statuses (the referral pipeline).
const (
	Healthy        = "healthy"         // screened, no finding
	Referred       = "referred"        // finding → referred to the DEIC
	UnderTreatment = "under-treatment" // referral accepted, treatment in progress
	Closed         = "closed"          // referral resolved
)

// DEIC is the District Early Intervention Centre a finding is referred to.
const DEIC = "DEIC"

func validFinding(f string) bool {
	switch f {
	case Defect, Disease, Deficiency, Disability:
		return true
	}
	return false
}

const dateLayout = "2006-01-02"

// Screening is one student's RBSK screening and its referral lifecycle.
type Screening struct {
	ID            string   `json:"id"`
	StudentID     string   `json:"student_id"`
	OrgUnit       string   `json:"org_unit"` // the school (T6 tenancy node)
	ScreenedOn    string   `json:"screened_on"`
	Findings      []string `json:"findings"` // subset of the four Ds; empty = healthy
	Status        string   `json:"status"`
	ReferredTo    string   `json:"referred_to,omitempty"`
	ClosedOutcome string   `json:"closed_outcome,omitempty"`
	UpdatedAt     string   `json:"updated_at"`
}

// ActiveReferral reports whether the screening has an open referral needing follow-up.
func (s Screening) ActiveReferral() bool { return s.Status == Referred || s.Status == UnderTreatment }

// NewScreening validates and builds a screening: a finding auto-refers to the DEIC; no finding is healthy (pure).
func NewScreening(id, studentID, orgUnit, screenedOn string, findings []string, now string) (Screening, error) {
	if id == "" || studentID == "" || orgUnit == "" {
		return Screening{}, errors.New("rbsk: id, student_id and org_unit are required")
	}
	if _, err := time.Parse(dateLayout, screenedOn); err != nil {
		return Screening{}, errors.New("rbsk: screened_on must be YYYY-MM-DD")
	}
	for _, f := range findings {
		if !validFinding(f) {
			return Screening{}, errors.New("rbsk: invalid finding " + f)
		}
	}
	s := Screening{ID: id, StudentID: studentID, OrgUnit: orgUnit, ScreenedOn: screenedOn, Findings: findings, UpdatedAt: now}
	if len(findings) == 0 {
		s.Status = Healthy
	} else {
		s.Status = Referred
		s.ReferredTo = DEIC
	}
	return s, nil
}

// ApplyTreat moves an accepted referral into treatment (pure).
func ApplyTreat(s Screening, now string) (Screening, error) {
	if s.Status != Referred {
		return Screening{}, errors.New("rbsk: only a referred screening can enter treatment")
	}
	s.Status = UnderTreatment
	s.UpdatedAt = now
	return s, nil
}

// ApplyClose resolves an open referral with an outcome (pure).
func ApplyClose(s Screening, outcome, now string) (Screening, error) {
	if !s.ActiveReferral() {
		return Screening{}, errors.New("rbsk: only an open referral can be closed")
	}
	s.Status = Closed
	s.ClosedOutcome = outcome
	s.UpdatedAt = now
	return s, nil
}

// Filter narrows a listing.
type Filter struct {
	OrgUnit string
	Student string
	Status  string
	Finding string // a screening that includes this finding
}

// Match reports whether a screening satisfies a filter (exported for persistence adapters).
func Match(f Filter, s Screening) bool {
	if f.OrgUnit != "" && s.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Student != "" && s.StudentID != f.Student {
		return false
	}
	if f.Status != "" && s.Status != f.Status {
		return false
	}
	if f.Finding != "" {
		has := false
		for _, x := range s.Findings {
			if x == f.Finding {
				has = true
			}
		}
		if !has {
			return false
		}
	}
	return true
}

// Store is the in-memory store (credential-free demo).
type Store struct {
	items map[string]Screening
	now   func() time.Time
}

// NewStore returns an empty store.
func NewStore() *Store { return &Store{items: map[string]Screening{}, now: time.Now} }

// NewStoreWithClock returns a store with an injected clock.
func NewStoreWithClock(now func() time.Time) *Store {
	return &Store{items: map[string]Screening{}, now: now}
}

func (s *Store) stamp() string { return s.now().UTC().Format(time.RFC3339) }

// File validates and stores a new screening (auto-referring any finding).
func (s *Store) File(id, studentID, orgUnit, screenedOn string, findings []string) (Screening, error) {
	if _, exists := s.items[id]; exists {
		return Screening{}, errors.New("rbsk: duplicate id " + id)
	}
	sc, err := NewScreening(id, studentID, orgUnit, screenedOn, findings, s.stamp())
	if err != nil {
		return Screening{}, err
	}
	s.items[id] = sc
	return sc, nil
}

// Get returns a screening by id.
func (s *Store) Get(id string) (Screening, bool) { sc, ok := s.items[id]; return sc, ok }

func (s *Store) mutate(id string, fn func(Screening, string) (Screening, error)) (Screening, error) {
	sc, ok := s.items[id]
	if !ok {
		return Screening{}, errors.New("rbsk: not found")
	}
	out, err := fn(sc, s.stamp())
	if err != nil {
		return Screening{}, err
	}
	s.items[id] = out
	return out, nil
}

// Treat moves a referral into treatment.
func (s *Store) Treat(id string) (Screening, error) {
	return s.mutate(id, func(sc Screening, now string) (Screening, error) { return ApplyTreat(sc, now) })
}

// Close resolves an open referral.
func (s *Store) Close(id, outcome string) (Screening, error) {
	return s.mutate(id, func(sc Screening, now string) (Screening, error) { return ApplyClose(sc, outcome, now) })
}

// List returns the filtered screenings, most recent first.
func (s *Store) List(f Filter) []Screening {
	var out []Screening
	for _, sc := range s.items {
		if Match(f, sc) {
			out = append(out, sc)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].ScreenedOn != out[j].ScreenedOn {
			return out[i].ScreenedOn > out[j].ScreenedOn
		}
		return out[i].ID < out[j].ID
	})
	return out
}

// Count returns the number of screenings.
func (s *Store) Count() int { return len(s.items) }

// Package cpd is the L6 Teacher Continuing Professional Development service: the durable record of the in-service
// training a teacher completes (NISHTHA / SCERT / DIET / DIKSHA courses), with the compliance analytics NEP 2020
// requires — every teacher should complete AnnualTargetHours (50) of CPD per year, and the platform tracks who
// is compliant vs deficient. A data+analytics plane, not an approval workflow. Pure + stdlib-only.
package cpd

import (
	"errors"
	"sort"
	"time"
)

// AnnualTargetHours is the NEP 2020 minimum CPD a teacher should complete per year.
const AnnualTargetHours = 50

// Record statuses.
const (
	Enrolled  = "enrolled"
	Completed = "completed"
	Certified = "certified" // completed + certificate issued (counts toward the target)
)

// Providers (the in-service training institutions).
const (
	NISHTHA = "NISHTHA"
	SCERT   = "SCERT"
	DIET    = "DIET"
	DIKSHA  = "DIKSHA"
)

func validProvider(p string) bool {
	switch p {
	case NISHTHA, SCERT, DIET, DIKSHA:
		return true
	}
	return false
}

func validStatus(s string) bool {
	switch s {
	case Enrolled, Completed, Certified:
		return true
	}
	return false
}

// Record is one CPD course a teacher engaged with.
type Record struct {
	ID          string `json:"id"`
	TeacherID   string `json:"teacher_id"` // HRMS employee id
	OrgUnit     string `json:"org_unit"`   // the teacher's school (T6 tenancy node)
	Course      string `json:"course"`
	Provider    string `json:"provider"`
	Hours       int    `json:"hours"`
	Year        int    `json:"year"`
	Status      string `json:"status"`
	CompletedOn string `json:"completed_on,omitempty"` // YYYY-MM-DD
	RecordedAt  string `json:"recorded_at,omitempty"`
}

// Validate checks the record's required fields, provider, status and hours.
func (r Record) Validate() error {
	if r.ID == "" || r.TeacherID == "" || r.OrgUnit == "" {
		return errors.New("cpd: id, teacher_id and org_unit are required")
	}
	if !validProvider(r.Provider) {
		return errors.New("cpd: invalid provider " + r.Provider)
	}
	if !validStatus(r.Status) {
		return errors.New("cpd: invalid status " + r.Status)
	}
	if r.Hours < 0 || r.Hours > 1000 {
		return errors.New("cpd: hours out of range")
	}
	if r.Year < 2000 || r.Year > 2100 {
		return errors.New("cpd: invalid year")
	}
	return nil
}

// Counts toward the annual target only when the course was completed or certified.
func (r Record) counts() bool { return r.Status == Completed || r.Status == Certified }

// HoursFor returns the total CPD hours that count toward the target across a set of records (already filtered
// to one teacher/year by the caller).
func HoursFor(records []Record) int {
	total := 0
	for _, r := range records {
		if r.counts() {
			total += r.Hours
		}
	}
	return total
}

// IsCompliant reports whether a teacher's records meet the annual CPD target.
func IsCompliant(records []Record) bool { return HoursFor(records) >= AnnualTargetHours }

// Filter narrows a listing.
type Filter struct {
	Teacher string
	OrgUnit string
	Year    int // 0 = any
	Status  string
}

// Match reports whether a record satisfies a filter (exported for persistence adapters).
func Match(f Filter, r Record) bool {
	if f.Teacher != "" && r.TeacherID != f.Teacher {
		return false
	}
	if f.OrgUnit != "" && r.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Year != 0 && r.Year != f.Year {
		return false
	}
	if f.Status != "" && r.Status != f.Status {
		return false
	}
	return true
}

// Store is the in-memory store (credential-free demo).
type Store struct {
	recs map[string]Record
	now  func() time.Time
}

// NewStore returns an empty store.
func NewStore() *Store { return &Store{recs: map[string]Record{}, now: time.Now} }

// NewStoreWithClock returns a store with an injected clock.
func NewStoreWithClock(now func() time.Time) *Store {
	return &Store{recs: map[string]Record{}, now: now}
}

// Record stores (or updates) a CPD record by id.
func (s *Store) Record(r Record) (Record, error) {
	if err := r.Validate(); err != nil {
		return Record{}, err
	}
	if r.RecordedAt == "" {
		r.RecordedAt = s.now().UTC().Format(time.RFC3339)
	}
	s.recs[r.ID] = r
	return r, nil
}

// Get returns a record by id.
func (s *Store) Get(id string) (Record, bool) { r, ok := s.recs[id]; return r, ok }

// List returns the filtered records, most recent first (by completed date then id).
func (s *Store) List(f Filter) []Record {
	var out []Record
	for _, r := range s.recs {
		if Match(f, r) {
			out = append(out, r)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].CompletedOn != out[j].CompletedOn {
			return out[i].CompletedOn > out[j].CompletedOn
		}
		return out[i].ID < out[j].ID
	})
	return out
}

// Count returns the number of records.
func (s *Store) Count() int { return len(s.recs) }

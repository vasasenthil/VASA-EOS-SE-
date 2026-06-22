// Package attendance is the L6 Student Attendance service: the high-volume daily record of who was present at
// each school, with the analytics the RTE no-detention/retention regime needs — per-student attendance rate
// and CHRONIC-ABSENTEE detection (the early-warning signal for dropout, RTE 2009). Unlike the approval-chain
// verticals this is a data plane (one record per student per day), not a workflow. Pure + stdlib-only.
package attendance

import (
	"errors"
	"sort"
	"time"
)

// Attendance statuses for a student on a day.
const (
	Present = "present"
	Absent  = "absent"
	Late    = "late"    // counts toward attendance
	Excused = "excused" // does not count against attendance (medical/sanctioned)
)

// ChronicThreshold is the attendance-rate floor (percent) below which a student is a chronic absentee (RTE
// early-warning). MinDays is the minimum attendable days before the flag is meaningful.
const (
	ChronicThreshold = 75.0
	MinDays          = 10
)

func validStatus(s string) bool {
	switch s {
	case Present, Absent, Late, Excused:
		return true
	}
	return false
}

const dateLayout = "2006-01-02"

// Record is one student's attendance on one day at a school.
type Record struct {
	StudentID string `json:"student_id"` // APAAR-anchored learner id
	OrgUnit   string `json:"org_unit"`   // the school (T6 tenancy node)
	Date      string `json:"date"`       // YYYY-MM-DD
	Status    string `json:"status"`
	Source    string `json:"source,omitempty"` // biometric | manual | rfid
	MarkedBy  string `json:"marked_by,omitempty"`
	MarkedAt  string `json:"marked_at,omitempty"`
}

// Validate checks the record's required fields, date format and status.
func (r Record) Validate() error {
	if r.StudentID == "" || r.OrgUnit == "" {
		return errors.New("attendance: student_id and org_unit are required")
	}
	if _, err := time.Parse(dateLayout, r.Date); err != nil {
		return errors.New("attendance: date must be YYYY-MM-DD")
	}
	if !validStatus(r.Status) {
		return errors.New("attendance: invalid status " + r.Status)
	}
	return nil
}

// key uniquely identifies a student's mark on a day (so re-marking corrects, not duplicates).
func key(student, date string) string { return student + "|" + date }

// Filter narrows a listing.
type Filter struct {
	OrgUnit string
	Date    string
	Student string
	Status  string
}

// Match reports whether a record satisfies a filter (exported for persistence adapters).
func Match(f Filter, r Record) bool {
	if f.OrgUnit != "" && r.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Date != "" && r.Date != f.Date {
		return false
	}
	if f.Student != "" && r.StudentID != f.Student {
		return false
	}
	if f.Status != "" && r.Status != f.Status {
		return false
	}
	return true
}

// AttendanceRate returns (present+late)/attendable as a percent over a set of a student's records, where
// attendable = present+absent+late (excused days are not counted against the student). 0 attendable → 0.
func AttendanceRate(records []Record) float64 {
	attendable, attended := 0, 0
	for _, r := range records {
		switch r.Status {
		case Present, Late:
			attendable++
			attended++
		case Absent:
			attendable++
		}
	}
	if attendable == 0 {
		return 0
	}
	return float64(attended) * 100 / float64(attendable)
}

// IsChronicAbsentee reports whether a student's records breach the chronic-absentee threshold (with enough
// attendable days to be meaningful).
func IsChronicAbsentee(records []Record) bool {
	attendable := 0
	for _, r := range records {
		if r.Status == Present || r.Status == Late || r.Status == Absent {
			attendable++
		}
	}
	return attendable >= MinDays && AttendanceRate(records) < ChronicThreshold
}

// Store is the in-memory attendance store (credential-free demo).
type Store struct {
	recs map[string]Record
	now  func() time.Time
}

// NewStore returns an empty store using the wall clock.
func NewStore() *Store { return &Store{recs: map[string]Record{}, now: time.Now} }

// NewStoreWithClock returns a store with an injected clock.
func NewStoreWithClock(now func() time.Time) *Store {
	return &Store{recs: map[string]Record{}, now: now}
}

// Mark records (or corrects) a student's attendance for a day. Idempotent on (student, date).
func (s *Store) Mark(r Record) (Record, error) {
	if err := r.Validate(); err != nil {
		return Record{}, err
	}
	if r.MarkedAt == "" {
		r.MarkedAt = s.now().UTC().Format(time.RFC3339)
	}
	s.recs[key(r.StudentID, r.Date)] = r
	return r, nil
}

// Get returns a student's mark for a date.
func (s *Store) Get(student, date string) (Record, bool) {
	r, ok := s.recs[key(student, date)]
	return r, ok
}

// List returns the filtered records, ordered by date then student.
func (s *Store) List(f Filter) []Record {
	var out []Record
	for _, r := range s.recs {
		if Match(f, r) {
			out = append(out, r)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Date != out[j].Date {
			return out[i].Date < out[j].Date
		}
		return out[i].StudentID < out[j].StudentID
	})
	return out
}

// Count returns the number of records.
func (s *Store) Count() int { return len(s.recs) }

// DaySummary is the present/absent picture for a school on a single day.
type DaySummary struct {
	Date    string  `json:"date"`
	Marked  int     `json:"marked"`
	Present int     `json:"present"`
	Absent  int     `json:"absent"`
	Late    int     `json:"late"`
	Excused int     `json:"excused"`
	Rate    float64 `json:"present_rate"`
}

// SummariseDay rolls up a day's records (already filtered to one school/day by the caller).
func SummariseDay(date string, records []Record) DaySummary {
	d := DaySummary{Date: date, Marked: len(records)}
	for _, r := range records {
		switch r.Status {
		case Present:
			d.Present++
		case Absent:
			d.Absent++
		case Late:
			d.Late++
		case Excused:
			d.Excused++
		}
	}
	d.Rate = AttendanceRate(records)
	return d
}

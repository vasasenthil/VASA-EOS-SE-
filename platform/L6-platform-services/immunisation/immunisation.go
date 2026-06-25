// Package immunisation is the L6 School Health Immunisation service: the durable record of vaccine doses
// administered to students under the school-health schedule (UIP / RBSK school-age vaccines), with the clinical
// invariants an immunisation register must hold — a dose can only be recorded in SEQUENCE (dose N requires
// doses 1..N-1 already given), a vaccine can never exceed its scheduled dose count, and a dose cannot be
// future-dated. Immunisation status (complete / partial / due) is derived against the schedule. Health data is
// sensitive: callers surface aggregate coverage publicly and the per-child worklist only to the governing
// officer. Pure + stdlib-only.
package immunisation

import (
	"errors"
	"sort"
	"strconv"
	"time"
)

// Immunisation status against the schedule.
const (
	Complete = "complete"
	Partial  = "partial"
	Due      = "due"
)

const dateLayout = "2006-01-02"

func parseDate(s string) (time.Time, error) { return time.Parse(dateLayout, s) }

// Vaccine is one entry in the school-health immunisation schedule.
type Vaccine struct {
	Code          string `json:"code"`
	Name          string `json:"name"`
	RequiredDoses int    `json:"required_doses"`
}

// schedule is the school-age immunisation schedule (UIP / RBSK). Kept internal; exposed via Schedule().
var schedule = map[string]Vaccine{
	"Td10":        {Code: "Td10", Name: "Td (Tetanus-diphtheria), 10 years", RequiredDoses: 1},
	"Td16":        {Code: "Td16", Name: "Td (Tetanus-diphtheria), 16 years", RequiredDoses: 1},
	"MR":          {Code: "MR", Name: "Measles-Rubella", RequiredDoses: 2},
	"JE":          {Code: "JE", Name: "Japanese Encephalitis", RequiredDoses: 2},
	"VitA":        {Code: "VitA", Name: "Vitamin A supplementation", RequiredDoses: 1},
	"Albendazole": {Code: "Albendazole", Name: "Deworming (Albendazole)", RequiredDoses: 1},
}

// Schedule returns the immunisation schedule ordered by code.
func Schedule() []Vaccine {
	out := make([]Vaccine, 0, len(schedule))
	for _, v := range schedule {
		out = append(out, v)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Code < out[j].Code })
	return out
}

// RequiredDoses returns how many doses a vaccine needs, and whether it is in the schedule.
func RequiredDoses(code string) (int, bool) {
	v, ok := schedule[code]
	if !ok {
		return 0, false
	}
	return v.RequiredDoses, true
}

// DoseRecord is one administered vaccine dose for a student.
type DoseRecord struct {
	ID             string `json:"id"`
	StudentID      string `json:"student_id"`
	OrgUnit        string `json:"org_unit"` // the school (T6 tenancy node)
	Vaccine        string `json:"vaccine"`  // schedule code
	DoseNumber     int    `json:"dose_number"`
	AdministeredOn string `json:"administered_on"` // YYYY-MM-DD
	Batch          string `json:"batch,omitempty"`
}

// Validate checks a dose record's required fields, vaccine, dose number and date (against the schedule and the
// as-of day so a dose cannot be future-dated).
func (d DoseRecord) Validate(asOf string) error {
	if d.ID == "" || d.StudentID == "" || d.OrgUnit == "" {
		return errors.New("immunisation: id, student_id and org_unit are required")
	}
	req, ok := RequiredDoses(d.Vaccine)
	if !ok {
		return errors.New("immunisation: vaccine " + d.Vaccine + " is not in the schedule")
	}
	if d.DoseNumber < 1 || d.DoseNumber > req {
		return errors.New("immunisation: dose_number " + strconv.Itoa(d.DoseNumber) + " out of range for " + d.Vaccine + " (1.." + strconv.Itoa(req) + ")")
	}
	at, err := parseDate(d.AdministeredOn)
	if err != nil {
		return errors.New("immunisation: invalid administered_on (want YYYY-MM-DD)")
	}
	if asOf != "" {
		if today, err := parseDate(asOf); err == nil && at.After(today) {
			return errors.New("immunisation: a dose cannot be future-dated")
		}
	}
	return nil
}

// Filter narrows a dose listing.
type Filter struct {
	OrgUnit string
	Student string
	Vaccine string
}

// Match reports whether a dose record satisfies a filter (exported for persistence adapters).
func Match(f Filter, d DoseRecord) bool {
	if f.OrgUnit != "" && d.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Student != "" && d.StudentID != f.Student {
		return false
	}
	if f.Vaccine != "" && d.Vaccine != f.Vaccine {
		return false
	}
	return true
}

// DosesGiven returns the distinct dose numbers recorded for a student+vaccine across a set of records.
func DosesGiven(records []DoseRecord, student, vaccine string) map[int]bool {
	given := map[int]bool{}
	for _, d := range records {
		if d.StudentID == student && d.Vaccine == vaccine {
			given[d.DoseNumber] = true
		}
	}
	return given
}

// StatusFor derives a student's immunisation status for a vaccine from the doses given against the schedule.
func StatusFor(records []DoseRecord, student, vaccine string) string {
	req, ok := RequiredDoses(vaccine)
	if !ok {
		return Due
	}
	n := len(DosesGiven(records, student, vaccine))
	if n >= req {
		return Complete
	}
	if n > 0 {
		return Partial
	}
	return Due
}

// Store is the in-memory immunisation register (credential-free demo).
type Store struct {
	recs map[string]DoseRecord
	now  func() time.Time
}

// NewStore returns an empty store using the wall clock.
func NewStore() *Store { return &Store{recs: map[string]DoseRecord{}, now: time.Now} }

// NewStoreWithClock returns a store with an injected clock (for tests).
func NewStoreWithClock(now func() time.Time) *Store {
	return &Store{recs: map[string]DoseRecord{}, now: now}
}

func (s *Store) today() string { return s.now().UTC().Format(dateLayout) }

func (s *Store) list() []DoseRecord {
	out := make([]DoseRecord, 0, len(s.recs))
	for _, d := range s.recs {
		out = append(out, d)
	}
	return out
}

// AdministerDose records a vaccine dose, enforcing the schedule, the no-future-date rule, the sequence rule
// (dose N requires doses 1..N-1 already given) and no duplicate dose slot. Idempotent: re-recording the same id
// corrects in place.
func (s *Store) AdministerDose(d DoseRecord) (DoseRecord, error) {
	if err := d.Validate(s.today()); err != nil {
		return DoseRecord{}, err
	}
	given := DosesGivenExcluding(s.list(), d.StudentID, d.Vaccine, d.ID)
	// sequence: every earlier dose must already be present.
	for n := 1; n < d.DoseNumber; n++ {
		if !given[n] {
			return DoseRecord{}, errors.New("immunisation: out-of-sequence dose — " + d.Vaccine + " dose " +
				strconv.Itoa(d.DoseNumber) + " requires dose " + strconv.Itoa(n) + " first")
		}
	}
	// no two records may fill the same dose slot for a student+vaccine.
	if given[d.DoseNumber] {
		return DoseRecord{}, errors.New("immunisation: " + d.Vaccine + " dose " + strconv.Itoa(d.DoseNumber) + " is already recorded for this student")
	}
	s.recs[d.ID] = d
	return d, nil
}

// DosesGivenExcluding is DosesGiven but skipping one record id (so a re-record can be validated against the rest).
func DosesGivenExcluding(records []DoseRecord, student, vaccine, excludeID string) map[int]bool {
	given := map[int]bool{}
	for _, d := range records {
		if d.ID == excludeID {
			continue
		}
		if d.StudentID == student && d.Vaccine == vaccine {
			given[d.DoseNumber] = true
		}
	}
	return given
}

// Get returns a dose record by id.
func (s *Store) Get(id string) (DoseRecord, bool) { d, ok := s.recs[id]; return d, ok }

// Status returns a student's immunisation status for a vaccine.
func (s *Store) Status(student, vaccine string) string {
	return StatusFor(s.list(), student, vaccine)
}

// List returns the filtered dose records ordered by date then id.
func (s *Store) List(f Filter) []DoseRecord {
	var out []DoseRecord
	for _, d := range s.recs {
		if Match(f, d) {
			out = append(out, d)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].AdministeredOn != out[j].AdministeredOn {
			return out[i].AdministeredOn < out[j].AdministeredOn
		}
		return out[i].ID < out[j].ID
	})
	return out
}

// Count returns the number of dose records.
func (s *Store) Count() int { return len(s.recs) }

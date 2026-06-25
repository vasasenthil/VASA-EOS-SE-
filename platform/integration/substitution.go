package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sync"

	"github.com/vasa-eos-se-tn/platform/timetable"
)

// Substitution is the durable port of the reference /timetable page's "substitution" feature onto the Class
// Timetable module: a date-specific override that assigns a SUBSTITUTE teacher for a scheduled period when the
// regular teacher is absent. It is durable, audited, and enforces two invariants server-side against the live
// timetable (#11):
//   - The period must be SCHEDULED in the class timetable for that day (you can't substitute a free period).
//   - The substitute must be FREE — not the regular teacher of another class at the same day+period (no clash).
// Lifecycle: assigned → cancelled. Downward-governance scoped. Synthetic ids only.

// Substitution status.
const (
	SubAssigned  = "assigned"
	SubCancelled = "cancelled"
)

// Substitution is one date-specific substitute assignment for a class period.
type Substitution struct {
	ID                string `json:"id"`
	OrgUnit           string `json:"org_unit"`
	Class             string `json:"class"`
	Day               string `json:"day"`
	Period            int    `json:"period"`
	Date              string `json:"date"`
	Subject           string `json:"subject"`          // snapshotted from the slot
	OriginalTeacher   string `json:"original_teacher"` // snapshotted from the slot
	SubstituteTeacher string `json:"substitute_teacher"`
	Reason            string `json:"reason,omitempty"`
	Status            string `json:"status"`
	CreatedOn         string `json:"created_on"`
	UpdatedAt         string `json:"updated_at"`
}

type subFilter struct{ OrgUnit, Class, Date, Status string }

func matchSub(f subFilter, s Substitution) bool {
	if f.OrgUnit != "" && s.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Class != "" && s.Class != f.Class {
		return false
	}
	if f.Date != "" && s.Date != f.Date {
		return false
	}
	if f.Status != "" && s.Status != f.Status {
		return false
	}
	return true
}

type subStore interface {
	Upsert(Substitution) (Substitution, error)
	Get(id string) (Substitution, bool)
	List(subFilter) []Substitution
}

type memSubStore struct {
	mu sync.Mutex
	m  map[string]Substitution
}

func newMemSubStore() *memSubStore { return &memSubStore{m: map[string]Substitution{}} }

func (s *memSubStore) Upsert(x Substitution) (Substitution, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[x.ID] = x
	return x, nil
}

func (s *memSubStore) Get(id string) (Substitution, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	x, ok := s.m[id]
	return x, ok
}

func (s *memSubStore) List(f subFilter) []Substitution {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]Substitution, 0, len(s.m))
	for _, x := range s.m {
		if matchSub(f, x) {
			out = append(out, x)
		}
	}
	return out
}

var (
	subOnce sync.Once
	subBack subStore
)

func subState() subStore {
	subOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgSubStore(dsn); err == nil {
				subBack = pg
				log.Printf("substitution: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("substitution: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				subBack = newMemSubStore()
			}
		} else {
			subBack = newMemSubStore()
		}
		seedSubstitution(subBack)
	})
	return subBack
}

func subNow() string { return "2026-06-25T00:00:00Z" }

// slotForClassPeriod returns the scheduled slot for a class on a day+period, if any.
func slotForClassPeriod(org, class, day string, period int) (timetable.Slot, bool) {
	for _, sl := range ttState().List(timetable.Filter{OrgUnit: org, Class: class, Day: day}) {
		if sl.Period == period {
			return sl, true
		}
	}
	return timetable.Slot{}, false
}

// teacherBusyAt reports whether a teacher is the regular teacher of any slot at the given day+period.
func teacherBusyAt(org, teacher, day string, period int) bool {
	for _, sl := range ttState().List(timetable.Filter{OrgUnit: org, Teacher: teacher, Day: day}) {
		if sl.Period == period {
			return true
		}
	}
	return false
}

// AssignSubstitution assigns a substitute — rejecting an unscheduled period or a busy substitute. Audited.
func (p *Platform) AssignSubstitution(in Substitution) (Substitution, error) {
	if in.ID == "" || in.OrgUnit == "" || in.Class == "" || in.Day == "" || in.Date == "" || in.SubstituteTeacher == "" {
		return Substitution{}, errors.New("substitution: id, org_unit, class, day, date and substitute_teacher are required")
	}
	if in.Period < 1 {
		return Substitution{}, errors.New("substitution: a valid period is required")
	}
	slot, ok := slotForClassPeriod(in.OrgUnit, in.Class, in.Day, in.Period)
	if !ok {
		err := fmt.Errorf("substitution: no scheduled period %d for %s on %s — cannot substitute a free period", in.Period, in.Class, in.Day)
		p.appendAudit("timetable-officer", "substitution.assign.denied", in.OrgUnit, "deny", err.Error())
		return Substitution{}, err
	}
	if in.SubstituteTeacher == slot.TeacherID {
		return Substitution{}, errors.New("substitution: substitute is the regular teacher — no substitution needed")
	}
	if teacherBusyAt(in.OrgUnit, in.SubstituteTeacher, in.Day, in.Period) {
		err := fmt.Errorf("substitution: %s is already teaching another class at %s period %d (clash)", in.SubstituteTeacher, in.Day, in.Period)
		p.appendAudit("timetable-officer", "substitution.assign.denied", in.OrgUnit, "deny", err.Error())
		return Substitution{}, err
	}
	in.Subject = slot.Subject
	in.OriginalTeacher = slot.TeacherID
	in.Status = SubAssigned
	if in.CreatedOn == "" {
		in.CreatedOn = "2026-06-25"
	}
	in.UpdatedAt = subNow()
	out, err := subState().Upsert(in)
	if err != nil {
		return Substitution{}, err
	}
	p.appendAudit("timetable-officer", "substitution.assign", in.ID, "executed", fmt.Sprintf("%s → %s for %s P%d", slot.TeacherID, in.SubstituteTeacher, in.Class, in.Period))
	return out, nil
}

// CancelSubstitution cancels an assigned substitution. Audited.
func (p *Platform) CancelSubstitution(id string) (Substitution, error) {
	cur, ok := subState().Get(id)
	if !ok {
		return Substitution{}, errors.New("substitution: not found")
	}
	if cur.Status != SubAssigned {
		return Substitution{}, errors.New("substitution: only an assigned substitution can be cancelled")
	}
	cur.Status = SubCancelled
	cur.UpdatedAt = subNow()
	if _, err := subState().Upsert(cur); err != nil {
		return Substitution{}, err
	}
	p.appendAudit("timetable-officer", "substitution.cancel", id, "executed", "cancelled")
	return cur, nil
}

// ScopedSubstitutions lists substitutions a tenant node governs (optionally by status).
func (p *Platform) ScopedSubstitutions(scopeOrg, status string) []Substitution {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []Substitution
	for _, s := range subState().List(subFilter{Status: status}) {
		if h.Governs(scopeOrg, s.OrgUnit) {
			out = append(out, s)
		}
	}
	return out
}

// seedSubstitution plants one substitution per school (a free substitute covering a Monday period). Synthetic ids.
func seedSubstitution(s subStore) {
	schools := pilotSchools(4)
	if len(schools) == 0 {
		if only := tenancyLeafUnder(pilotDistrict()); only != "" {
			schools = []string{only}
		} else {
			return
		}
	}
	for si, school := range schools {
		tag := schoolTag(si)
		sub := Substitution{
			ID: fmt.Sprintf("SUB-%s-01", tag), OrgUnit: school, Class: "Grade 8-A", Day: "monday", Period: 2, Date: "2026-06-29",
			SubstituteTeacher: "SYN-T-019", Reason: "regular teacher on RBSK duty", CreatedOn: "2026-06-25", UpdatedAt: subNow(),
		}
		if slot, ok := slotForClassPeriod(school, sub.Class, sub.Day, sub.Period); ok && !teacherBusyAt(school, sub.SubstituteTeacher, sub.Day, sub.Period) && sub.SubstituteTeacher != slot.TeacherID {
			sub.Subject = slot.Subject
			sub.OriginalTeacher = slot.TeacherID
			sub.Status = SubAssigned
			s.Upsert(sub)
		}
	}
}

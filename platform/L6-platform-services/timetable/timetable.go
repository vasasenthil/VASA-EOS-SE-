// Package timetable is the L6 School Timetable service: it assigns a (class · day · period) slot to a subject
// and a teacher, enforcing the two hard constraints of any real timetable — one subject per class-slot, and a
// teacher can never be in two classes at the same time (clash detection). A constraint-checked data plane, not
// an approval workflow. Pure + stdlib-only.
package timetable

import (
	"errors"
	"sort"
)

// Working days and the periods-per-day cap.
const MaxPeriod = 8

var workingDays = map[string]bool{
	"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": true,
}

// Slot is one period in a class's week: a subject taught by a teacher.
type Slot struct {
	OrgUnit   string `json:"org_unit"` // the school (T6 tenancy node)
	Class     string `json:"class"`    // e.g. "Grade 8-A"
	Day       string `json:"day"`      // monday..saturday
	Period    int    `json:"period"`   // 1..MaxPeriod
	Subject   string `json:"subject"`
	TeacherID string `json:"teacher_id"`
}

// Validate checks the slot's fields and ranges.
func (s Slot) Validate() error {
	if s.OrgUnit == "" || s.Class == "" || s.Subject == "" || s.TeacherID == "" {
		return errors.New("timetable: org_unit, class, subject and teacher_id are required")
	}
	if !workingDays[s.Day] {
		return errors.New("timetable: invalid day " + s.Day)
	}
	if s.Period < 1 || s.Period > MaxPeriod {
		return errors.New("timetable: period out of range")
	}
	return nil
}

// key uniquely identifies a class's slot (one subject per class per day+period).
func key(class, day string, period int) string {
	return class + "|" + day + "|" + string(rune('0'+period))
}

// Filter narrows a listing.
type Filter struct {
	OrgUnit string
	Class   string
	Teacher string
	Day     string
}

// Match reports whether a slot satisfies a filter (exported for persistence adapters).
func Match(f Filter, s Slot) bool {
	if f.OrgUnit != "" && s.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Class != "" && s.Class != f.Class {
		return false
	}
	if f.Teacher != "" && s.TeacherID != f.Teacher {
		return false
	}
	if f.Day != "" && s.Day != f.Day {
		return false
	}
	return true
}

// Store is the in-memory timetable (credential-free demo), keyed by class-slot.
type Store struct {
	slots map[string]Slot
}

// NewStore returns an empty timetable.
func NewStore() *Store { return &Store{slots: map[string]Slot{}} }

// teacherClash reports whether the teacher is already booked in a DIFFERENT class at the same day+period (within
// the same school) — the core timetable invariant.
func (s *Store) teacherClash(slot Slot) (Slot, bool) {
	for _, ex := range s.slots {
		if ex.OrgUnit == slot.OrgUnit && ex.TeacherID == slot.TeacherID && ex.Day == slot.Day &&
			ex.Period == slot.Period && ex.Class != slot.Class {
			return ex, true
		}
	}
	return Slot{}, false
}

// Set assigns (or reassigns) a class-slot, rejecting a teacher clash. Idempotent on (class, day, period).
func (s *Store) Set(slot Slot) (Slot, error) {
	if err := slot.Validate(); err != nil {
		return Slot{}, err
	}
	if c, clash := s.teacherClash(slot); clash {
		return Slot{}, errors.New("timetable: teacher " + slot.TeacherID + " is already teaching " + c.Class + " at " + slot.Day + " period " + string(rune('0'+slot.Period)))
	}
	s.slots[key(slot.Class, slot.Day, slot.Period)] = slot
	return slot, nil
}

// Get returns a class's slot.
func (s *Store) Get(class, day string, period int) (Slot, bool) {
	slot, ok := s.slots[key(class, day, period)]
	return slot, ok
}

// Clear removes a class-slot. Returns false if it does not exist.
func (s *Store) Clear(class, day string, period int) bool {
	k := key(class, day, period)
	if _, ok := s.slots[k]; !ok {
		return false
	}
	delete(s.slots, k)
	return true
}

// List returns the filtered slots, ordered by day then period then class.
func (s *Store) List(f Filter) []Slot {
	dayOrder := map[string]int{"monday": 1, "tuesday": 2, "wednesday": 3, "thursday": 4, "friday": 5, "saturday": 6}
	var out []Slot
	for _, slot := range s.slots {
		if Match(f, slot) {
			out = append(out, slot)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Day != out[j].Day {
			return dayOrder[out[i].Day] < dayOrder[out[j].Day]
		}
		if out[i].Period != out[j].Period {
			return out[i].Period < out[j].Period
		}
		return out[i].Class < out[j].Class
	})
	return out
}

// Count returns the number of assigned slots.
func (s *Store) Count() int { return len(s.slots) }

// TeacherLoad returns the number of periods a teacher is assigned across a set of slots (their weekly load).
func TeacherLoad(slots []Slot, teacher string) int {
	n := 0
	for _, s := range slots {
		if s.TeacherID == teacher {
			n++
		}
	}
	return n
}

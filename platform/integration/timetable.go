package integration

import (
	"fmt"
	"log"
	"os"
	"sync"

	"github.com/vasa-eos-se-tn/platform/timetable"
)

// School Timetable is an L6 constraint-checked operational vertical: it assigns class-slots to subjects and
// teachers and rejects clashes (a teacher in two classes at once). Durable to PostgreSQL.
var (
	ttOnce sync.Once
	ttBack ttStore
)

// ttStore is the persistence port.
type ttStore interface {
	Set(timetable.Slot) (timetable.Slot, error)
	Get(class, day string, period int) (timetable.Slot, bool)
	Clear(class, day string, period int) bool
	List(timetable.Filter) []timetable.Slot
}

func ttState() ttStore {
	ttOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgTtStore(dsn); err == nil {
				ttBack = pg
				log.Printf("timetable: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("timetable: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				ttBack = timetable.NewStore()
			}
		} else {
			ttBack = timetable.NewStore()
		}
		seedTimetable(ttBack)
	})
	return ttBack
}

// seedTimetable plants a clash-free weekly grid for one class at a real Chennai school (3 teachers across 5
// days × 6 periods), so the load/coverage analytics have signal. Synthetic SYN-T teacher ids.
func seedTimetable(s ttStore) {
	// Plant a weekly grid at several schools over more than one district. Teachers are per-school (the clash
	// invariant is per teacher across the whole estate, so a teacher cannot be shared between two schools).
	schools := pilotSchools(4)
	if len(schools) == 0 {
		if only := tenancyLeafUnder(pilotDistrict()); only != "" {
			schools = []string{only}
		} else {
			return
		}
	}
	days := []string{"monday", "tuesday", "wednesday", "thursday", "friday"}
	for si, school := range schools {
		// teacher ids: school 0 keeps SYN-T-0n (existing proofs reference them); later schools get a suffix.
		t := func(n string) string {
			if si == 0 {
				return n
			}
			return fmt.Sprintf("%s-%s", n, schoolTag(si))
		}
		subjects := []struct{ subject, teacher string }{
			{"Tamil", t("SYN-T-01")}, {"English", t("SYN-T-02")}, {"Mathematics", t("SYN-T-03")},
			{"Science", t("SYN-T-01")}, {"Social Science", t("SYN-T-02")}, {"Computer Science", t("SYN-T-03")},
		}
		for _, day := range days {
			for p, sub := range subjects {
				s.Set(timetable.Slot{OrgUnit: school, Class: "Grade 8-A", Day: day, Period: p + 1, Subject: sub.subject, TeacherID: sub.teacher})
			}
		}
	}
}

// SetTimetableSlot assigns a class-slot (rejecting a teacher clash). Audited.
func (p *Platform) SetTimetableSlot(slot timetable.Slot) (timetable.Slot, error) {
	out, err := ttState().Set(slot)
	if err != nil {
		p.appendAudit("scheduler", "timetable.set.denied", slot.Class, "deny", err.Error())
		return timetable.Slot{}, err
	}
	p.appendAudit("scheduler", "timetable.set", slot.Class, "executed", fmt.Sprintf("%s P%d %s", slot.Day, slot.Period, slot.Subject))
	return out, nil
}

// ClassTimetable returns a class's ordered weekly grid at a school.
func (p *Platform) ClassTimetable(org, class string) []timetable.Slot {
	return ttState().List(timetable.Filter{OrgUnit: org, Class: class})
}

// TeacherTimetable returns a teacher's assigned periods.
func (p *Platform) TeacherTimetable(teacher string) []timetable.Slot {
	return ttState().List(timetable.Filter{Teacher: teacher})
}

// TimetableDashboard is the jurisdiction-scoped timetabling picture: assigned slots, distinct classes/teachers,
// per-teacher weekly load and any teacher with an overload (> the recommended weekly cap). Scoped.
type TimetableDashboard struct {
	Scope       string         `json:"scope"`
	Slots       int            `json:"slots"`
	Classes     int            `json:"classes"`
	Teachers    int            `json:"teachers"`
	TeacherLoad map[string]int `json:"teacher_load"`
	Overloaded  []string       `json:"overloaded_teachers"`
	Synthetic   bool           `json:"synthetic"`
}

// recommendedWeeklyLoad is the soft cap on a teacher's weekly periods (beyond this is an overload signal).
const recommendedWeeklyLoad = 30

// TimetableDashboard rolls up the timetable for the schools a tenant node governs.
func (p *Platform) TimetableDashboard(scopeOrg string) TimetableDashboard {
	d := TimetableDashboard{Scope: scopeOrg, TeacherLoad: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	classes := map[string]bool{}
	for _, slot := range ttState().List(timetable.Filter{}) {
		if !h.Governs(scopeOrg, slot.OrgUnit) {
			continue
		}
		d.Slots++
		classes[slot.OrgUnit+"|"+slot.Class] = true
		d.TeacherLoad[slot.TeacherID]++
	}
	d.Classes = len(classes)
	d.Teachers = len(d.TeacherLoad)
	for teacher, load := range d.TeacherLoad {
		if load > recommendedWeeklyLoad {
			d.Overloaded = append(d.Overloaded, teacher)
		}
	}
	return d
}

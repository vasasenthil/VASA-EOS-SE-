package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/vasa-eos-se-tn/platform/timetable"
)

// Period (Lesson-wise) Attendance is an L7 academic vertical that ties the Class Timetable (#10) and Lesson
// Plans (#27) together: a single class-period that was actually conducted, keyed by (org, class, date, period).
// It REFERENCES the timetable slot — you cannot mark a period that is not scheduled for that class on that day —
// and SNAPSHOTS the slot's subject + teacher at mark-time so a later timetable edit never rewrites history. When
// the period was delivered it can link a PUBLISHED lesson plan (the lesson actually taught). Day is derived from
// the date and Start/End from the bell schedule. It yields subject-wise attendance and teacher engagement —
// complementary to (not a replacement for) the daily RTE student-attendance and payroll staff-attendance.
// Durable to PostgreSQL; downward-scoped. Synthetic ids only, never real PII.

// Period status.
const (
	PeriodDelivered = "delivered"
	PeriodNotHeld   = "not_held" // e.g. teacher absent / mass leave — no attendance taken
)

// PeriodAttendance is one conducted (or not-held) class-period with its attendance snapshot.
type PeriodAttendance struct {
	ID           string   `json:"id"` // org|class|date|period
	OrgUnit      string   `json:"org_unit"`
	Class        string   `json:"class"`
	Date         string   `json:"date"`
	Day          string   `json:"day"` // derived from date
	Period       int      `json:"period"`
	Subject      string   `json:"subject"`    // snapshot from the timetable slot
	TeacherID    string   `json:"teacher_id"` // snapshot from the timetable slot
	Start        string   `json:"start"`      // from the bell schedule
	End          string   `json:"end"`
	LessonPlanID string   `json:"lesson_plan_id,omitempty"` // a published plan, when delivered
	Status       string   `json:"status"`
	Strength     int      `json:"strength"`      // students expected
	PresentCount int      `json:"present_count"` // strength - len(absentees) when delivered
	Absentees    []string `json:"absentees,omitempty"`
	UpdatedAt    string   `json:"updated_at"`
}

func periodKey(org, class, date string, period int) string {
	return fmt.Sprintf("%s|%s|%s|%d", org, class, date, period)
}

// bellSchedule returns the start/end clock time for a period — contiguous 45-minute periods from 09:00.
func bellSchedule(period int) (string, string) {
	hhmm := func(m int) string { return fmt.Sprintf("%02d:%02d", m/60, m%60) }
	start := 9*60 + (period-1)*45
	return hhmm(start), hhmm(start + 45)
}

type periodFilter struct{ OrgUnit, Class, Date, Subject string }

func matchPeriod(f periodFilter, r PeriodAttendance) bool {
	if f.OrgUnit != "" && r.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Class != "" && r.Class != f.Class {
		return false
	}
	if f.Date != "" && r.Date != f.Date {
		return false
	}
	if f.Subject != "" && r.Subject != f.Subject {
		return false
	}
	return true
}

// periodStore is the persistence port. *memPeriodStore and *pgPeriodStore satisfy it.
type periodStore interface {
	Upsert(PeriodAttendance) (PeriodAttendance, error)
	Get(id string) (PeriodAttendance, bool)
	List(periodFilter) []PeriodAttendance
}

type memPeriodStore struct {
	mu sync.Mutex
	m  map[string]PeriodAttendance
}

func newMemPeriodStore() *memPeriodStore { return &memPeriodStore{m: map[string]PeriodAttendance{}} }

func (s *memPeriodStore) Upsert(r PeriodAttendance) (PeriodAttendance, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[r.ID] = r
	return r, nil
}

func (s *memPeriodStore) Get(id string) (PeriodAttendance, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	r, ok := s.m[id]
	return r, ok
}

func (s *memPeriodStore) List(f periodFilter) []PeriodAttendance {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]PeriodAttendance, 0, len(s.m))
	for _, r := range s.m {
		if matchPeriod(f, r) {
			out = append(out, r)
		}
	}
	return out
}

var (
	periodOnce sync.Once
	periodBack periodStore
)

func periodState() periodStore {
	periodOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgPeriodStore(dsn); err == nil {
				periodBack = pg
				log.Printf("periodattendance: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("periodattendance: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				periodBack = newMemPeriodStore()
			}
		} else {
			periodBack = newMemPeriodStore()
		}
		seedPeriodAttendance(periodBack)
	})
	return periodBack
}

func dayOf(date string) (string, error) {
	t, err := time.Parse("2006-01-02", date)
	if err != nil {
		return "", err
	}
	return strings.ToLower(t.Weekday().String()), nil
}

// slotFor finds the timetable slot for a class on a given day+period (or false if not scheduled).
func (p *Platform) slotForPeriod(org, class, day string, period int) (subject, teacher string, ok bool) {
	for _, s := range p.ClassTimetable(org, class) {
		if s.Day == day && s.Period == period {
			return s.Subject, s.TeacherID, true
		}
	}
	return "", "", false
}

// PeriodMarkInput is the request to record a class-period.
type PeriodMarkInput struct {
	OrgUnit      string
	Class        string
	Date         string
	Period       int
	Status       string
	Strength     int
	Absentees    []string
	LessonPlanID string
}

// MarkPeriod records (or corrects) a class-period — validated against the timetable + (if delivered) a published
// lesson plan; subject/teacher are snapshotted from the slot; day/start/end are derived. Audited.
func (p *Platform) MarkPeriod(in PeriodMarkInput) (PeriodAttendance, error) {
	if in.OrgUnit == "" || in.Class == "" {
		return PeriodAttendance{}, errors.New("period: org_unit and class are required")
	}
	day, err := dayOf(in.Date)
	if err != nil {
		return PeriodAttendance{}, errors.New("period: invalid date (want YYYY-MM-DD)")
	}
	if in.Period < 1 {
		return PeriodAttendance{}, errors.New("period: period must be at least 1")
	}
	if in.Status == "" {
		in.Status = PeriodDelivered
	}
	if in.Status != PeriodDelivered && in.Status != PeriodNotHeld {
		return PeriodAttendance{}, errors.New("period: status must be delivered or not_held")
	}
	subject, teacher, ok := p.slotForPeriod(in.OrgUnit, in.Class, day, in.Period)
	if !ok {
		err := fmt.Errorf("period: no scheduled period for %s on %s period %d", in.Class, day, in.Period)
		p.appendAudit("teacher", "period.mark.denied", in.Class, "deny", err.Error())
		return PeriodAttendance{}, err
	}
	rec := PeriodAttendance{
		ID: periodKey(in.OrgUnit, in.Class, in.Date, in.Period), OrgUnit: in.OrgUnit, Class: in.Class,
		Date: in.Date, Day: day, Period: in.Period, Subject: subject, TeacherID: teacher,
		Status: in.Status, Strength: in.Strength, UpdatedAt: tcNow(),
	}
	rec.Start, rec.End = bellSchedule(in.Period)
	if in.Status == PeriodDelivered {
		if in.LessonPlanID != "" {
			lp, found := p.LessonPlanRecord(in.LessonPlanID)
			if !found || lp.Status != LPPublished || lp.OrgUnit != in.OrgUnit {
				err := fmt.Errorf("period: lesson_plan %s must be a published plan at %s", in.LessonPlanID, in.OrgUnit)
				p.appendAudit("teacher", "period.mark.denied", in.Class, "deny", err.Error())
				return PeriodAttendance{}, err
			}
			rec.LessonPlanID = in.LessonPlanID
		}
		rec.Absentees = in.Absentees
		rec.PresentCount = in.Strength - len(in.Absentees)
		if rec.PresentCount < 0 {
			return PeriodAttendance{}, errors.New("period: absentees exceed class strength")
		}
	}
	out, err := periodState().Upsert(rec)
	if err != nil {
		return PeriodAttendance{}, err
	}
	p.appendAudit("teacher:"+teacher, "period.mark", rec.ID, rec.Status, fmt.Sprintf("%s P%d %d/%d", subject, in.Period, rec.PresentCount, in.Strength))
	return out, nil
}

// PeriodRecord returns a single period record by id.
func (p *Platform) PeriodRecord(id string) (PeriodAttendance, bool) { return periodState().Get(id) }

// SubjectAttendance is one subject's period-wise attendance picture.
type SubjectAttendance struct {
	Subject    string  `json:"subject"`
	Periods    int     `json:"periods"`
	Present    int     `json:"present"`
	Possible   int     `json:"possible"` // sum of strength over delivered periods
	PresentPct float64 `json:"present_pct"`
}

// PeriodDashboard is the jurisdiction-scoped period-attendance picture: periods recorded, delivered vs not-held,
// overall present rate, subject-wise attendance, and teacher engagement (delivered periods per teacher).
type PeriodDashboard struct {
	Scope             string              `json:"scope"`
	Periods           int                 `json:"periods"`
	Delivered         int                 `json:"delivered"`
	NotHeld           int                 `json:"not_held"`
	PresentRate       float64             `json:"present_rate"`
	BySubject         []SubjectAttendance `json:"by_subject,omitempty"`
	TeacherEngagement map[string]int      `json:"teacher_engagement,omitempty"`
	Synthetic         bool                `json:"synthetic"`
}

// PeriodDashboard rolls up period attendance across the schools a tenant node governs (fail-closed for others).
func (p *Platform) PeriodDashboard(scopeOrg string) PeriodDashboard {
	d := PeriodDashboard{Scope: scopeOrg, TeacherEngagement: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	type subj struct{ periods, present, possible int }
	bySubj := map[string]*subj{}
	var present, possible int
	for _, r := range periodState().List(periodFilter{}) {
		if !h.Governs(scopeOrg, r.OrgUnit) {
			continue
		}
		d.Periods++
		if r.Status == PeriodNotHeld {
			d.NotHeld++
			continue
		}
		d.Delivered++
		d.TeacherEngagement[r.TeacherID]++
		present += r.PresentCount
		possible += r.Strength
		s := bySubj[r.Subject]
		if s == nil {
			s = &subj{}
			bySubj[r.Subject] = s
		}
		s.periods++
		s.present += r.PresentCount
		s.possible += r.Strength
	}
	if possible > 0 {
		d.PresentRate = float64(present) * 100 / float64(possible)
	}
	for name, s := range bySubj {
		sa := SubjectAttendance{Subject: name, Periods: s.periods, Present: s.present, Possible: s.possible}
		if s.possible > 0 {
			sa.PresentPct = float64(s.present) * 100 / float64(s.possible)
		}
		d.BySubject = append(d.BySubject, sa)
	}
	return d
}

// ScopedPeriods lists period records a tenant node governs for a class+date (the period attendance sheet).
func (p *Platform) ScopedPeriods(scopeOrg, class, date string) []PeriodAttendance {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []PeriodAttendance
	for _, r := range periodState().List(periodFilter{Class: class, Date: date}) {
		if h.Governs(scopeOrg, r.OrgUnit) {
			out = append(out, r)
		}
	}
	return out
}

// seedPeriodAttendance records a day's periods for the seeded Grade 8-A timetable across schools, linking the
// matching published lesson plans. 2026-06-01 is a Monday, so the seeded monday slots apply.
func seedPeriodAttendance(s periodStore) {
	schools := pilotSchools(4)
	if len(schools) == 0 {
		if only := tenancyLeafUnder(pilotDistrict()); only != "" {
			schools = []string{only}
		} else {
			return
		}
	}
	const date = "2026-06-01" // Monday
	day, err := dayOf(date)
	if err != nil {
		return
	}
	for si, school := range schools {
		tag := schoolTag(si)
		// derive the monday slots straight from the seeded timetable (subject+teacher snapshot).
		for period := 1; period <= 6; period++ {
			subject, teacher, ok := platformSlotLookup(school, "Grade 8-A", day, period)
			if !ok {
				continue
			}
			absent := period % 4 // a little variation
			rec := PeriodAttendance{
				ID: periodKey(school, "Grade 8-A", date, period), OrgUnit: school, Class: "Grade 8-A",
				Date: date, Day: day, Period: period, Subject: subject, TeacherID: teacher,
				Status: PeriodDelivered, Strength: 30, PresentCount: 30 - absent, UpdatedAt: tcNow(),
			}
			rec.Start, rec.End = bellSchedule(period)
			for a := 0; a < absent; a++ {
				rec.Absentees = append(rec.Absentees, fmt.Sprintf("SYN-S-%03d-%s", a+1, tag))
			}
			// link the Mathematics published plan (LP-<tag>-01) to its Maths period.
			if subject == "Mathematics" {
				rec.LessonPlanID = fmt.Sprintf("LP-%s-01", tag)
			}
			s.Upsert(rec)
		}
	}
}

// platformSlotLookup is a package-level helper used by the seed to read the timetable store directly (the seed
// runs before any Platform is available). It mirrors slotForPeriod over ttState().
func platformSlotLookup(org, class, day string, period int) (subject, teacher string, ok bool) {
	for _, s := range ttState().List(timetable.Filter{OrgUnit: org, Class: class}) {
		if s.Day == day && s.Period == period {
			return s.Subject, s.TeacherID, true
		}
	}
	return "", "", false
}

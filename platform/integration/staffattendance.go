package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sync"
	"time"
)

// Staff Attendance is an L6 HR data plane: one record per employee per day, keyed by (employee, date) so a
// re-mark corrects rather than duplicates. Unlike student attendance (an RTE retention signal), its purpose is
// payroll-grade — the monthly summary computes PAYABLE days (present + on-duty + half-day×0.5 + sanctioned leave)
// and flags LWP (unauthorised absence → leave-without-pay). Durable to PostgreSQL; downward-governance scoped.
// Synthetic employee ids (SYN-T/SYN-U), never real PII.

// Staff attendance statuses.
const (
	StaffPresent = "present"
	StaffAbsent  = "absent" // unauthorised → LWP
	StaffHalfDay = "half_day"
	StaffLeave   = "leave" // sanctioned, paid
	StaffOnDuty  = "on_duty"
)

func validStaffStatus(s string) bool {
	switch s {
	case StaffPresent, StaffAbsent, StaffHalfDay, StaffLeave, StaffOnDuty:
		return true
	}
	return false
}

// StaffAttendance is one employee's mark for a day.
type StaffAttendance struct {
	EmployeeID string `json:"employee_id"`
	OrgUnit    string `json:"org_unit"` // the school (T6 tenancy node)
	Date       string `json:"date"`     // YYYY-MM-DD
	Status     string `json:"status"`
	MarkedBy   string `json:"marked_by,omitempty"`
	MarkedAt   string `json:"marked_at,omitempty"`
}

// Validate checks an employee mark's required fields, status and date.
func (r StaffAttendance) Validate() error {
	if r.EmployeeID == "" || r.OrgUnit == "" {
		return errors.New("staffattendance: employee_id and org_unit are required")
	}
	if _, err := time.Parse("2006-01-02", r.Date); err != nil {
		return errors.New("staffattendance: invalid date (want YYYY-MM-DD)")
	}
	if !validStaffStatus(r.Status) {
		return errors.New("staffattendance: invalid status " + r.Status)
	}
	return nil
}

// payableDay returns the payroll weight of a status (1, 0.5 or 0).
func payableDay(status string) float64 {
	switch status {
	case StaffPresent, StaffOnDuty, StaffLeave:
		return 1
	case StaffHalfDay:
		return 0.5
	default: // absent → LWP
		return 0
	}
}

type staffAttFilter struct{ OrgUnit, Employee, Date, Status string }

func matchStaffAtt(f staffAttFilter, r StaffAttendance) bool {
	if f.OrgUnit != "" && r.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Employee != "" && r.EmployeeID != f.Employee {
		return false
	}
	if f.Date != "" && r.Date != f.Date {
		return false
	}
	if f.Status != "" && r.Status != f.Status {
		return false
	}
	return true
}

func staffKey(employee, date string) string { return employee + "|" + date }

// staffAttStore is the persistence port. *memStaffAttStore and *pgStaffAttStore satisfy it.
type staffAttStore interface {
	Mark(StaffAttendance) (StaffAttendance, error)
	List(staffAttFilter) []StaffAttendance
}

type memStaffAttStore struct {
	mu sync.Mutex
	m  map[string]StaffAttendance
}

func newMemStaffAttStore() *memStaffAttStore {
	return &memStaffAttStore{m: map[string]StaffAttendance{}}
}

func (s *memStaffAttStore) Mark(r StaffAttendance) (StaffAttendance, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[staffKey(r.EmployeeID, r.Date)] = r
	return r, nil
}

func (s *memStaffAttStore) List(f staffAttFilter) []StaffAttendance {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]StaffAttendance, 0, len(s.m))
	for _, r := range s.m {
		if matchStaffAtt(f, r) {
			out = append(out, r)
		}
	}
	return out
}

var (
	staffAttOnce sync.Once
	staffAttBack staffAttStore
)

func staffAttState() staffAttStore {
	staffAttOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgStaffAttStore(dsn); err == nil {
				staffAttBack = pg
				log.Printf("staffattendance: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("staffattendance: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				staffAttBack = newMemStaffAttStore()
			}
		} else {
			staffAttBack = newMemStaffAttStore()
		}
		seedStaffAttendance(staffAttBack)
	})
	return staffAttBack
}

// MarkStaffAttendance marks (or corrects) an employee's attendance for a day. Audited.
func (p *Platform) MarkStaffAttendance(r StaffAttendance) (StaffAttendance, error) {
	if r.MarkedAt == "" {
		r.MarkedAt = "2026-06-22T00:00:00Z"
	}
	if err := r.Validate(); err != nil {
		p.appendAudit("hr:"+r.MarkedBy, "staffattendance.mark.denied", r.EmployeeID, "deny", err.Error())
		return StaffAttendance{}, err
	}
	out, err := staffAttState().Mark(r)
	if err != nil {
		return StaffAttendance{}, err
	}
	p.appendAudit("hr:"+orEmpty(r.MarkedBy), "staffattendance.mark", r.EmployeeID, r.Status, r.OrgUnit+" "+r.Date)
	return out, nil
}

// StaffMonthly is one employee's payroll-relevant attendance picture.
type StaffMonthly struct {
	EmployeeID  string  `json:"employee_id"`
	OrgUnit     string  `json:"org_unit"`
	Days        int     `json:"days_marked"`
	PayableDays float64 `json:"payable_days"`
	LWPDays     int     `json:"lwp_days"` // unauthorised-absence days (leave-without-pay)
	PresentPct  float64 `json:"present_pct"`
}

// StaffAttendanceProfile assembles an employee's payable-days + LWP picture across all their marks.
func (p *Platform) StaffAttendanceProfile(employee string) StaffMonthly {
	recs := staffAttState().List(staffAttFilter{Employee: employee})
	m := StaffMonthly{EmployeeID: employee}
	var presentish int
	for _, r := range recs {
		m.Days++
		m.PayableDays += payableDay(r.Status)
		if r.OrgUnit != "" {
			m.OrgUnit = r.OrgUnit
		}
		if r.Status == StaffAbsent {
			m.LWPDays++
		}
		if r.Status == StaffPresent || r.Status == StaffOnDuty {
			presentish++
		}
	}
	if m.Days > 0 {
		m.PresentPct = float64(presentish) * 100 / float64(m.Days)
	}
	return m
}

// StaffAttendanceDashboard is the jurisdiction-scoped HR picture for a day, plus the LWP roster across history.
type StaffAttendanceDashboard struct {
	Scope       string   `json:"scope"`
	Date        string   `json:"date"`
	Schools     int      `json:"schools"`
	Employees   int      `json:"employees"`
	MarkedToday int      `json:"marked_today"`
	PresentRate float64  `json:"present_rate"`
	OnLeave     int      `json:"on_leave"`
	LWPStaff    []string `json:"lwp_staff,omitempty"` // employees with ≥1 unauthorised absence in history
	Synthetic   bool     `json:"synthetic"`
}

// StaffAttendanceDashboard rolls up staff attendance for a date across the schools a tenant node governs.
func (p *Platform) StaffAttendanceDashboard(scopeOrg, date string) StaffAttendanceDashboard {
	d := StaffAttendanceDashboard{Scope: scopeOrg, Date: date, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	schools := map[string]bool{}
	employees := map[string]bool{}
	var presentish, attendable int
	for _, r := range staffAttState().List(staffAttFilter{Date: date}) {
		if !h.Governs(scopeOrg, r.OrgUnit) {
			continue
		}
		d.MarkedToday++
		schools[r.OrgUnit] = true
		employees[r.EmployeeID] = true
		switch r.Status {
		case StaffPresent, StaffOnDuty:
			presentish++
			attendable++
		case StaffHalfDay:
			attendable++
		case StaffAbsent:
			attendable++
		case StaffLeave:
			d.OnLeave++
		}
	}
	d.Schools = len(schools)
	d.Employees = len(employees)
	if attendable > 0 {
		d.PresentRate = float64(presentish) * 100 / float64(attendable)
	}
	// LWP roster: any governed employee with an unauthorised absence anywhere in their history.
	lwp := map[string]bool{}
	for _, r := range staffAttState().List(staffAttFilter{Status: StaffAbsent}) {
		if h.Governs(scopeOrg, r.OrgUnit) {
			lwp[r.EmployeeID] = true
		}
	}
	for e := range lwp {
		d.LWPStaff = append(d.LWPStaff, e)
	}
	return d
}

// seedStaffAttendance plants ~10 working days of staff attendance across several schools over more than one
// district, with one engineered LWP employee per school (unauthorised absences). Synthetic ids.
func seedStaffAttendance(s staffAttStore) {
	schools := pilotSchools(4)
	if len(schools) == 0 {
		if only := tenancyLeafUnder(pilotDistrict()); only != "" {
			schools = []string{only}
		} else {
			return
		}
	}
	base, _ := time.Parse("2006-01-02", "2026-06-01")
	for si, school := range schools {
		tag := schoolTag(si)
		for n := 0; n < 6; n++ {
			emp := fmt.Sprintf("SYN-T-%02d-%s", n+1, tag)
			for d := 0; d < 10; d++ {
				date := base.AddDate(0, 0, d).Format("2006-01-02")
				status := StaffPresent
				switch {
				case n == 1 && d%3 == 0: // employee #2 has unauthorised absences (LWP signal)
					status = StaffAbsent
				case n == 2 && d == 4: // a sanctioned leave day
					status = StaffLeave
				case n == 3 && d == 2: // on official duty
					status = StaffOnDuty
				case n == 4 && d == 6: // a half day
					status = StaffHalfDay
				}
				s.Mark(StaffAttendance{EmployeeID: emp, OrgUnit: school, Date: date, Status: status, MarkedBy: "SYN-U-HM"})
			}
		}
	}
}

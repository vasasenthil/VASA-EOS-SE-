package integration

import (
	"fmt"
	"hash/fnv"
	"log"
	"os"
	"sync"
	"time"

	"github.com/vasa-eos-se-tn/platform/attendance"
)

// Student Attendance is a high-volume L6 data plane (one record per student per day) with the analytics the RTE
// retention regime needs — per-student attendance rate and chronic-absentee early-warning. Durable to Postgres.
var (
	attOnce sync.Once
	attBack attStore
)

// attStore is the persistence port. *attendance.Store (in-memory) and *pgAttStore (PostgreSQL) satisfy it.
type attStore interface {
	Mark(attendance.Record) (attendance.Record, error)
	Get(student, date string) (attendance.Record, bool)
	List(attendance.Filter) []attendance.Record
}

func attState() attStore {
	attOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgAttStore(dsn); err == nil {
				attBack = pg
				log.Printf("attendance: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("attendance: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				attBack = attendance.NewStore()
			}
		} else {
			attBack = attendance.NewStore()
		}
		seedAttendance(attBack)
	})
	return attBack
}

// seedAttendance plants ~20 school days of synthetic attendance for a small cohort at a real Chennai school —
// deterministic, including one engineered chronic absentee so the early-warning analytics have signal. Never
// real PII (SYN-STU ids).
func seedAttendance(s attStore) {
	// Spread the daily marks across several schools in more than one district so the district/state roll-up
	// aggregates real data from many schools (bottom-up) while each school still scopes to its own (top-down).
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
		for n := 0; n < 12; n++ {
			// school 0 keeps the canonical SYN-STU ids (existing proofs reference them); later schools get a
			// per-school suffix so learners stay distinct across the estate.
			student := fnvStudent(n)
			if si > 0 {
				student = fmt.Sprintf("%s-S%d", student, si)
			}
			for d := 0; d < 20; d++ {
				date := base.AddDate(0, 0, d).Format("2006-01-02")
				status := attendance.Present
				h := fnv.New32a()
				h.Write([]byte(student + date))
				r := h.Sum32() % 100
				switch {
				case n == 3 && r < 60: // one engineered chronic absentee per school (~40% present)
					status = attendance.Absent
				case r < 6:
					status = attendance.Absent
				case r < 10:
					status = attendance.Late
				case r < 12:
					status = attendance.Excused
				}
				s.Mark(attendance.Record{StudentID: student, OrgUnit: school, Date: date, Status: status, Source: "biometric", MarkedBy: "SYN-U-TCH"})
			}
		}
	}
}

func fnvStudent(n int) string {
	return "SYN-STU-" + string(rune('A'+n))
}

// MarkAttendance records a student's attendance for a day (idempotent). Audited.
func (p *Platform) MarkAttendance(r attendance.Record) (attendance.Record, error) {
	out, err := attState().Mark(r)
	if err != nil {
		return attendance.Record{}, err
	}
	p.appendAudit("marker:"+orEmpty(r.MarkedBy), "attendance.mark", r.StudentID, r.Status, r.OrgUnit+" "+r.Date)
	return out, nil
}

func orEmpty(s string) string {
	if s == "" {
		return "system"
	}
	return s
}

// StudentAttendance is one learner's attendance picture: their rate, chronic-absentee flag and recent marks.
type StudentAttendance struct {
	StudentID string              `json:"student_id"`
	OrgUnit   string              `json:"org_unit"`
	Rate      float64             `json:"attendance_rate"`
	Chronic   bool                `json:"chronic_absentee"`
	Days      int                 `json:"days_recorded"`
	Records   []attendance.Record `json:"records,omitempty"`
}

// StudentAttendanceProfile assembles a learner's attendance rate + chronic-absentee flag across all their marks.
func (p *Platform) StudentAttendanceProfile(student string) StudentAttendance {
	recs := attState().List(attendance.Filter{Student: student})
	return StudentAttendance{
		StudentID: student, Rate: attendance.AttendanceRate(recs), Chronic: attendance.IsChronicAbsentee(recs),
		Days: len(recs), OrgUnit: orgOf(recs), Records: recs,
	}
}

func orgOf(recs []attendance.Record) string {
	if len(recs) > 0 {
		return recs[0].OrgUnit
	}
	return ""
}

// AttendanceDashboard is the jurisdiction-scoped attendance operating picture: per-school marked/present rates
// for a day, plus the chronic-absentee roll-up (the RTE early-warning), downward-governance scoped.
type AttendanceDashboard struct {
	Scope            string                  `json:"scope"`
	Date             string                  `json:"date"`
	Schools          int                     `json:"schools"`
	Marked           int                     `json:"marked"`
	OverallRate      float64                 `json:"overall_present_rate"`
	ChronicAbsentees []string                `json:"chronic_absentees"`
	PerSchool        []attendance.DaySummary `json:"per_school"`
	Synthetic        bool                    `json:"synthetic"`
}

// AttendanceDashboard rolls up attendance for a date across the schools a tenant node governs. Chronic
// absentees are computed across ALL of each student's history (not just the day).
func (p *Platform) AttendanceDashboard(scopeOrg, date string) AttendanceDashboard {
	d := AttendanceDashboard{Scope: scopeOrg, Date: date, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	dayRecs := attState().List(attendance.Filter{Date: date})
	bySchool := map[string][]attendance.Record{}
	students := map[string]bool{}
	var present, attendable int
	for _, r := range dayRecs {
		if !h.Governs(scopeOrg, r.OrgUnit) {
			continue
		}
		bySchool[r.OrgUnit] = append(bySchool[r.OrgUnit], r)
		students[r.StudentID] = true
		switch r.Status {
		case attendance.Present, attendance.Late:
			present++
			attendable++
		case attendance.Absent:
			attendable++
		}
	}
	d.Schools = len(bySchool)
	for sch, recs := range bySchool {
		ds := attendance.SummariseDay(date, recs)
		ds.Date = sch // surface which school in the per-school line
		d.Marked += ds.Marked
		d.PerSchool = append(d.PerSchool, ds)
	}
	if attendable > 0 {
		d.OverallRate = float64(present) * 100 / float64(attendable)
	}
	// chronic absentees across the governed students (full history).
	for student := range students {
		hist := attState().List(attendance.Filter{Student: student})
		if attendance.IsChronicAbsentee(hist) {
			d.ChronicAbsentees = append(d.ChronicAbsentees, student)
		}
	}
	return d
}

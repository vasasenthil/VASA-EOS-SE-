package integration

import (
	"os"
	"testing"

	"github.com/vasa-eos-se-tn/platform/attendance"
)

// TestPgAttendanceDurable proves attendance marks persist + correct (upsert) across fresh store instances, and
// that the rate / chronic-absentee analytics compute over the persisted history. Runs only with DATABASE_URL.
func TestPgAttendanceDurable(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set; durable PostgreSQL attendance test runs against a live database only")
	}
	s1, err := newPgAttStore(dsn)
	if err != nil {
		t.Fatalf("connect/migrate: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM attendance_records WHERE student_id LIKE 'PGA-%'`); err != nil {
		t.Fatalf("cleanup: %v", err)
	}

	base := "2026-06-"
	day := func(n int) string {
		d := "0" + string(rune('0'+n/10)) + string(rune('0'+n%10))
		return base + d[len(d)-2:]
	}
	// a chronic absentee: 4 present + 12 absent over 16 attendable days = 25%.
	for n := 1; n <= 16; n++ {
		st := attendance.Absent
		if n <= 4 {
			st = attendance.Present
		}
		if _, err := s1.Mark(attendance.Record{StudentID: "PGA-1", OrgUnit: "33000000001", Date: day(n), Status: st, Source: "manual"}); err != nil {
			t.Fatalf("mark: %v", err)
		}
	}
	// re-mark day 1 as absent (correction) — upsert, not duplicate.
	if _, err := s1.Mark(attendance.Record{StudentID: "PGA-1", OrgUnit: "33000000001", Date: day(1), Status: attendance.Absent}); err != nil {
		t.Fatalf("correction: %v", err)
	}

	// fresh instance: history + correction durable.
	s2, _ := newPgAttStore(dsn)
	hist := s2.List(attendance.Filter{Student: "PGA-1"})
	if len(hist) != 16 {
		t.Fatalf("expected 16 durable records (no duplicate on re-mark), got %d", len(hist))
	}
	if r, _ := s2.Get("PGA-1", day(1)); r.Status != attendance.Absent {
		t.Fatalf("correction not durable: %+v", r)
	}
	// after the correction it is 3/16 ≈ 18.75% → still a chronic absentee.
	if !attendance.IsChronicAbsentee(hist) {
		t.Fatalf("durable history must flag the chronic absentee: rate=%g", attendance.AttendanceRate(hist))
	}
	// a healthy student is not flagged.
	for n := 1; n <= 16; n++ {
		s2.Mark(attendance.Record{StudentID: "PGA-2", OrgUnit: "33000000001", Date: day(n), Status: attendance.Present})
	}
	s3, _ := newPgAttStore(dsn)
	if attendance.IsChronicAbsentee(s3.List(attendance.Filter{Student: "PGA-2"})) {
		t.Fatal("a fully-present student must not be flagged")
	}
}

// TestAttendanceDashboardScoped proves the live workflow (in-memory path) rolls up attendance + chronic
// absentees, downward-governance scoped.
func TestAttendanceDashboardScoped(t *testing.T) {
	p := newPlatform(t)
	// the seed planted ~20 days for a cohort at a Chennai school, with one engineered chronic absentee.
	d := p.AttendanceDashboard("TN-DIST-Chennai", "2026-06-10")
	if d.Schools == 0 || d.Marked == 0 {
		t.Fatalf("the seeded school day must roll up: %+v", d)
	}
	if d.OverallRate <= 0 || d.OverallRate > 100 {
		t.Fatalf("present rate out of range: %v", d.OverallRate)
	}
	if len(d.ChronicAbsentees) == 0 {
		t.Fatalf("the engineered chronic absentee must surface in the early-warning roll-up: %+v", d)
	}
	// an unknown scope sees nothing (fail-closed).
	if u := p.AttendanceDashboard("TN-DIST-Nowhere", "2026-06-10"); u.Schools != 0 || u.Marked != 0 {
		t.Fatalf("unknown scope must see nothing: %+v", u)
	}
	// a learner profile carries the rate + flag.
	prof := p.StudentAttendanceProfile("SYN-STU-D") // the engineered chronic absentee (index 3 -> 'D')
	if prof.Days == 0 {
		t.Fatalf("the chronic student must have records: %+v", prof)
	}
}

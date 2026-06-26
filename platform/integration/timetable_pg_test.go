package integration

import (
	"os"
	"testing"

	"github.com/vasa-eos-se-tn/platform/timetable"
)

// TestPgTimetableDurable proves slots persist + reassign (upsert) across fresh store instances, and that the
// teacher-clash invariant is enforced in SQL. Runs only with DATABASE_URL set.
func TestPgTimetableDurable(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set; durable PostgreSQL timetable test runs against a live database only")
	}
	s1, err := newPgTtStore(dsn)
	if err != nil {
		t.Fatalf("connect/migrate: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM timetable_slots WHERE org_unit='PGT-SCH'`); err != nil {
		t.Fatalf("cleanup: %v", err)
	}
	sl := func(class, day string, period int, subject, teacher string) timetable.Slot {
		return timetable.Slot{OrgUnit: "PGT-SCH", Class: class, Day: day, Period: period, Subject: subject, TeacherID: teacher}
	}

	if _, err := s1.Set(sl("8-A", "monday", 1, "Maths", "PGT-T1")); err != nil {
		t.Fatalf("set: %v", err)
	}
	// teacher clash: PGT-T1 in a different class at the same day+period → rejected (durable invariant).
	if _, err := s1.Set(sl("8-B", "monday", 1, "Maths", "PGT-T1")); err == nil {
		t.Fatal("a durable teacher clash must be rejected")
	}
	// a different teacher in 8-B at the same slot is fine.
	if _, err := s1.Set(sl("8-B", "monday", 1, "Science", "PGT-T2")); err != nil {
		t.Fatalf("different teacher same slot: %v", err)
	}

	// fresh instance: slots durable, clash still enforced.
	s2, _ := newPgTtStore(dsn)
	if g, ok := s2.Get("8-A", "monday", 1); !ok || g.TeacherID != "PGT-T1" {
		t.Fatalf("slot not durable: %+v", g)
	}
	if _, err := s2.Set(sl("8-C", "monday", 1, "Maths", "PGT-T1")); err == nil {
		t.Fatal("clash must persist across instances")
	}
	// reassign 8-A's slot (upsert), durable.
	if _, err := s2.Set(sl("8-A", "monday", 1, "Tamil", "PGT-T3")); err != nil {
		t.Fatalf("reassign: %v", err)
	}
	s3, _ := newPgTtStore(dsn)
	if g, _ := s3.Get("8-A", "monday", 1); g.Subject != "Tamil" || g.TeacherID != "PGT-T3" {
		t.Fatalf("reassign not durable: %+v", g)
	}
	// list/load survive.
	if timetable.TeacherLoad(s3.List(timetable.Filter{OrgUnit: "PGT-SCH"}), "PGT-T2") != 1 {
		t.Fatal("durable teacher load wrong")
	}
}

// TestTimetableDashboardScoped proves the seeded grid rolls up + computes teacher load (in-memory path).
func TestTimetableDashboardScoped(t *testing.T) {
	p := newPlatform(t)
	d := p.TimetableDashboard("TN-DIST-Chennai")
	if d.Slots == 0 || d.Classes == 0 || d.Teachers == 0 {
		t.Fatalf("seeded timetable must roll up: %+v", d)
	}
	if len(d.TeacherLoad) == 0 {
		t.Fatalf("per-teacher load must be computed: %+v", d)
	}
	// a teacher's timetable is non-empty for a seeded teacher.
	if len(p.TeacherTimetable("SYN-T-01")) == 0 {
		t.Fatal("a seeded teacher must have assigned periods")
	}
	// unknown scope → nothing (fail-closed).
	if u := p.TimetableDashboard("TN-DIST-Nowhere"); u.Slots != 0 {
		t.Fatalf("unknown scope must see nothing: %+v", u)
	}
}

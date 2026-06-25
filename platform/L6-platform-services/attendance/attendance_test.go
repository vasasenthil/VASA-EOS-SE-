package attendance

import (
	"testing"
	"time"
)

func clk() func() time.Time {
	t, _ := time.Parse(time.RFC3339, "2026-06-01T00:00:00Z")
	return func() time.Time { return t }
}

func TestMarkValidationAndCorrection(t *testing.T) {
	s := NewStoreWithClock(clk())
	if _, err := s.Mark(Record{StudentID: "S1", OrgUnit: "SCH1", Date: "2026-13-40", Status: Present}); err == nil {
		t.Fatal("bad date must be rejected")
	}
	if _, err := s.Mark(Record{StudentID: "S1", OrgUnit: "SCH1", Date: "2026-06-01", Status: "vacation"}); err == nil {
		t.Fatal("invalid status must be rejected")
	}
	if _, err := s.Mark(Record{StudentID: "", OrgUnit: "SCH1", Date: "2026-06-01", Status: Present}); err == nil {
		t.Fatal("missing student must be rejected")
	}
	// mark, then correct same student+day (idempotent).
	s.Mark(Record{StudentID: "S1", OrgUnit: "SCH1", Date: "2026-06-01", Status: Absent})
	s.Mark(Record{StudentID: "S1", OrgUnit: "SCH1", Date: "2026-06-01", Status: Present})
	if s.Count() != 1 {
		t.Fatalf("re-marking must correct, not duplicate: %d", s.Count())
	}
	if r, _ := s.Get("S1", "2026-06-01"); r.Status != Present {
		t.Fatalf("correction not applied: %+v", r)
	}
}

func TestAttendanceRateAndChronic(t *testing.T) {
	// 8 present, 1 late, 6 absent, 2 excused → attendable=15, attended=9 → 60%.
	var recs []Record
	mk := func(n int, st string) {
		for i := 0; i < n; i++ {
			recs = append(recs, Record{Status: st})
		}
	}
	mk(8, Present)
	mk(1, Late)
	mk(6, Absent)
	mk(2, Excused)
	if rate := AttendanceRate(recs); rate != 60 {
		t.Fatalf("rate must be 60%%: %g", rate)
	}
	if !IsChronicAbsentee(recs) {
		t.Fatal("60%% over 15 attendable days is a chronic absentee")
	}
	// excused-heavy student is NOT penalised: 5 present, 0 absent, 20 excused → 100% over 5 attendable.
	good := []Record{}
	for i := 0; i < 5; i++ {
		good = append(good, Record{Status: Present})
	}
	for i := 0; i < 20; i++ {
		good = append(good, Record{Status: Excused})
	}
	if AttendanceRate(good) != 100 || IsChronicAbsentee(good) {
		t.Fatalf("excused days must not penalise: rate=%g chronic=%v", AttendanceRate(good), IsChronicAbsentee(good))
	}
	// too few attendable days → not flagged even if low.
	few := []Record{{Status: Absent}, {Status: Absent}, {Status: Present}}
	if IsChronicAbsentee(few) {
		t.Fatal("fewer than MinDays must not be flagged")
	}
}

func TestListFilterAndDaySummary(t *testing.T) {
	s := NewStoreWithClock(clk())
	s.Mark(Record{StudentID: "A", OrgUnit: "SCH1", Date: "2026-06-01", Status: Present})
	s.Mark(Record{StudentID: "B", OrgUnit: "SCH1", Date: "2026-06-01", Status: Absent})
	s.Mark(Record{StudentID: "C", OrgUnit: "SCH2", Date: "2026-06-01", Status: Late})
	// org filter.
	if got := s.List(Filter{OrgUnit: "SCH1", Date: "2026-06-01"}); len(got) != 2 {
		t.Fatalf("org+date filter wrong: %d", len(got))
	}
	// day summary for SCH1.
	d := SummariseDay("2026-06-01", s.List(Filter{OrgUnit: "SCH1", Date: "2026-06-01"}))
	if d.Marked != 2 || d.Present != 1 || d.Absent != 1 || d.Rate != 50 {
		t.Fatalf("day summary wrong: %+v", d)
	}
	// student filter.
	if got := s.List(Filter{Student: "C"}); len(got) != 1 || got[0].OrgUnit != "SCH2" {
		t.Fatalf("student filter wrong: %+v", got)
	}
}

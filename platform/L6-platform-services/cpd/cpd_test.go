package cpd

import (
	"testing"
	"time"
)

func clk() func() time.Time {
	t, _ := time.Parse(time.RFC3339, "2026-06-01T00:00:00Z")
	return func() time.Time { return t }
}

func TestValidationAndStore(t *testing.T) {
	s := NewStoreWithClock(clk())
	if _, err := s.Record(Record{ID: "C1", TeacherID: "T1", OrgUnit: "SCH1", Provider: "BOGUS", Status: Completed, Hours: 10, Year: 2026}); err == nil {
		t.Fatal("invalid provider rejected")
	}
	if _, err := s.Record(Record{ID: "C1", TeacherID: "T1", OrgUnit: "SCH1", Provider: NISHTHA, Status: "x", Hours: 10, Year: 2026}); err == nil {
		t.Fatal("invalid status rejected")
	}
	if _, err := s.Record(Record{ID: "C1", TeacherID: "T1", OrgUnit: "SCH1", Provider: NISHTHA, Status: Completed, Hours: 10, Year: 2026}); err != nil {
		t.Fatalf("valid record: %v", err)
	}
	// upsert by id.
	s.Record(Record{ID: "C1", TeacherID: "T1", OrgUnit: "SCH1", Provider: NISHTHA, Status: Certified, Hours: 12, Year: 2026})
	if s.Count() != 1 {
		t.Fatalf("upsert must not duplicate: %d", s.Count())
	}
	if r, _ := s.Get("C1"); r.Status != Certified || r.Hours != 12 {
		t.Fatalf("upsert wrong: %+v", r)
	}
}

func TestHoursAndCompliance(t *testing.T) {
	// completed/certified hours count; enrolled does not.
	recs := []Record{
		{Status: Certified, Hours: 20},
		{Status: Completed, Hours: 25},
		{Status: Enrolled, Hours: 30}, // does NOT count (not completed)
	}
	if HoursFor(recs) != 45 {
		t.Fatalf("only completed/certified count: %d", HoursFor(recs))
	}
	if IsCompliant(recs) {
		t.Fatal("45 < 50 target → not compliant")
	}
	recs = append(recs, Record{Status: Completed, Hours: 6})
	if !IsCompliant(recs) {
		t.Fatalf("51 hours → compliant: %d", HoursFor(recs))
	}
}

func TestListFilter(t *testing.T) {
	s := NewStoreWithClock(clk())
	s.Record(Record{ID: "A", TeacherID: "T1", OrgUnit: "SCH1", Provider: NISHTHA, Status: Completed, Hours: 10, Year: 2026, CompletedOn: "2026-03-01"})
	s.Record(Record{ID: "B", TeacherID: "T2", OrgUnit: "SCH1", Provider: SCERT, Status: Completed, Hours: 10, Year: 2025, CompletedOn: "2025-03-01"})
	if got := s.List(Filter{Teacher: "T1"}); len(got) != 1 || got[0].ID != "A" {
		t.Fatalf("teacher filter wrong: %+v", got)
	}
	if got := s.List(Filter{Year: 2025}); len(got) != 1 || got[0].ID != "B" {
		t.Fatalf("year filter wrong: %+v", got)
	}
	if got := s.List(Filter{OrgUnit: "SCH1"}); len(got) != 2 {
		t.Fatalf("org filter wrong: %d", len(got))
	}
}

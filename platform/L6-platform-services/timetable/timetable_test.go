package timetable

import "testing"

func slot(class, day string, period int, subject, teacher string) Slot {
	return Slot{OrgUnit: "SCH1", Class: class, Day: day, Period: period, Subject: subject, TeacherID: teacher}
}

func TestValidationAndSet(t *testing.T) {
	s := NewStore()
	if _, err := s.Set(slot("8-A", "funday", 1, "Maths", "T1")); err == nil {
		t.Fatal("invalid day rejected")
	}
	if _, err := s.Set(slot("8-A", "monday", 9, "Maths", "T1")); err == nil {
		t.Fatal("period out of range rejected")
	}
	if _, err := s.Set(Slot{OrgUnit: "SCH1", Class: "8-A", Day: "monday", Period: 1, Subject: "Maths"}); err == nil {
		t.Fatal("missing teacher rejected")
	}
	if _, err := s.Set(slot("8-A", "monday", 1, "Maths", "T1")); err != nil {
		t.Fatalf("valid set: %v", err)
	}
	// reassign the same class-slot (idempotent, not a clash with itself).
	if _, err := s.Set(slot("8-A", "monday", 1, "Science", "T1")); err != nil {
		t.Fatalf("reassign same slot: %v", err)
	}
	if g, _ := s.Get("8-A", "monday", 1); g.Subject != "Science" {
		t.Fatalf("reassign wrong: %+v", g)
	}
	if s.Count() != 1 {
		t.Fatalf("reassign must not duplicate: %d", s.Count())
	}
}

func TestTeacherClashDetection(t *testing.T) {
	s := NewStore()
	s.Set(slot("8-A", "monday", 1, "Maths", "T1"))
	// the SAME teacher in a DIFFERENT class at the same day+period → clash, rejected.
	if _, err := s.Set(slot("8-B", "monday", 1, "Maths", "T1")); err == nil {
		t.Fatal("a teacher cannot be in two classes at once — clash must be rejected")
	}
	// a different teacher in 8-B at the same slot is fine.
	if _, err := s.Set(slot("8-B", "monday", 1, "Maths", "T2")); err != nil {
		t.Fatalf("different teacher same slot must be allowed: %v", err)
	}
	// the same teacher at a DIFFERENT period is fine.
	if _, err := s.Set(slot("8-B", "monday", 2, "Maths", "T1")); err != nil {
		t.Fatalf("same teacher different period must be allowed: %v", err)
	}
}

func TestListAndTeacherLoad(t *testing.T) {
	s := NewStore()
	s.Set(slot("8-A", "monday", 1, "Maths", "T1"))
	s.Set(slot("8-A", "monday", 2, "Maths", "T1"))
	s.Set(slot("8-A", "tuesday", 1, "Science", "T2"))
	// list ordered by day then period.
	got := s.List(Filter{Class: "8-A"})
	if len(got) != 3 || got[0].Day != "monday" || got[2].Day != "tuesday" {
		t.Fatalf("list order wrong: %+v", got)
	}
	// teacher load.
	if TeacherLoad(s.List(Filter{}), "T1") != 2 {
		t.Fatalf("T1 load should be 2: %d", TeacherLoad(s.List(Filter{}), "T1"))
	}
	// clear a slot.
	if !s.Clear("8-A", "monday", 1) || s.Count() != 2 {
		t.Fatalf("clear failed: count=%d", s.Count())
	}
}

package immunisation

import (
	"testing"
	"time"
)

func fixedClock() func() time.Time {
	return func() time.Time { return time.Date(2026, 6, 22, 0, 0, 0, 0, time.UTC) }
}

func dose(id, student, vaccine string, n int, on string) DoseRecord {
	return DoseRecord{ID: id, StudentID: student, OrgUnit: "SCH1", Vaccine: vaccine, DoseNumber: n, AdministeredOn: on, Batch: "B-" + id}
}

func TestValidationAgainstSchedule(t *testing.T) {
	s := NewStoreWithClock(fixedClock())
	// unknown vaccine.
	if _, err := s.AdministerDose(dose("R1", "ST-1", "COVID", 1, "2026-06-01")); err == nil {
		t.Fatal("a vaccine not in the schedule must be rejected")
	}
	// dose number out of range (MR needs 2; dose 3 invalid).
	if _, err := s.AdministerDose(dose("R1", "ST-1", "MR", 3, "2026-06-01")); err == nil {
		t.Fatal("a dose number beyond the schedule must be rejected")
	}
	// future-dated.
	if _, err := s.AdministerDose(dose("R1", "ST-1", "MR", 1, "2026-07-01")); err == nil {
		t.Fatal("a future-dated dose must be rejected")
	}
	// valid.
	if _, err := s.AdministerDose(dose("R1", "ST-1", "MR", 1, "2026-06-01")); err != nil {
		t.Fatalf("valid dose: %v", err)
	}
}

func TestSequenceInvariant(t *testing.T) {
	s := NewStoreWithClock(fixedClock())
	// MR dose 2 before dose 1 → rejected.
	if _, err := s.AdministerDose(dose("R2", "ST-1", "MR", 2, "2026-06-05")); err == nil {
		t.Fatal("an out-of-sequence dose (2 before 1) must be rejected")
	}
	// record dose 1, then dose 2 is allowed.
	if _, err := s.AdministerDose(dose("R1", "ST-1", "MR", 1, "2026-06-01")); err != nil {
		t.Fatalf("dose 1: %v", err)
	}
	if _, err := s.AdministerDose(dose("R2", "ST-1", "MR", 2, "2026-06-05")); err != nil {
		t.Fatalf("dose 2 after 1: %v", err)
	}
	if s.Status("ST-1", "MR") != Complete {
		t.Fatalf("two of two doses → complete: %s", s.Status("ST-1", "MR"))
	}
}

func TestNoDuplicateDoseSlot(t *testing.T) {
	s := NewStoreWithClock(fixedClock())
	s.AdministerDose(dose("R1", "ST-1", "JE", 1, "2026-06-01"))
	// a different record filling the same JE dose-1 slot → rejected.
	if _, err := s.AdministerDose(dose("R2", "ST-1", "JE", 1, "2026-06-02")); err == nil {
		t.Fatal("a duplicate dose slot must be rejected")
	}
	// re-recording the SAME id (correction) is allowed (idempotent).
	if _, err := s.AdministerDose(dose("R1", "ST-1", "JE", 1, "2026-06-03")); err != nil {
		t.Fatalf("idempotent correction of the same record: %v", err)
	}
	if g, _ := s.Get("R1"); g.AdministeredOn != "2026-06-03" {
		t.Fatalf("correction not applied: %+v", g)
	}
}

func TestStatusAndPartial(t *testing.T) {
	s := NewStoreWithClock(fixedClock())
	// single-dose vaccine fully covered after one dose.
	s.AdministerDose(dose("R1", "ST-1", "Td10", 1, "2026-06-01"))
	if s.Status("ST-1", "Td10") != Complete {
		t.Fatalf("single dose vaccine should be complete: %s", s.Status("ST-1", "Td10"))
	}
	// two-dose vaccine with only one dose → partial.
	s.AdministerDose(dose("R2", "ST-1", "MR", 1, "2026-06-01"))
	if s.Status("ST-1", "MR") != Partial {
		t.Fatalf("one of two doses → partial: %s", s.Status("ST-1", "MR"))
	}
	// untouched vaccine → due.
	if s.Status("ST-1", "JE") != Due {
		t.Fatalf("no doses → due: %s", s.Status("ST-1", "JE"))
	}
}

func TestScheduleAndListing(t *testing.T) {
	if len(Schedule()) != 6 {
		t.Fatalf("schedule should have 6 vaccines: %d", len(Schedule()))
	}
	if r, ok := RequiredDoses("MR"); !ok || r != 2 {
		t.Fatalf("MR should require 2 doses: %d ok=%v", r, ok)
	}
	if _, ok := RequiredDoses("NOPE"); ok {
		t.Fatal("unknown vaccine must not be in the schedule")
	}
	s := NewStoreWithClock(fixedClock())
	s.AdministerDose(dose("R1", "ST-1", "MR", 1, "2026-06-01"))
	s.AdministerDose(dose("R2", "ST-1", "MR", 2, "2026-06-15"))
	s.AdministerDose(dose("R3", "ST-2", "Td10", 1, "2026-06-10"))
	if len(s.List(Filter{Student: "ST-1"})) != 2 {
		t.Fatal("student filter wrong")
	}
	if len(s.List(Filter{Vaccine: "Td10"})) != 1 {
		t.Fatal("vaccine filter wrong")
	}
	if got := s.List(Filter{Student: "ST-1"}); got[0].AdministeredOn != "2026-06-01" {
		t.Fatalf("list should be date-ordered: %+v", got)
	}
	if s.Count() != 3 {
		t.Fatalf("count wrong: %d", s.Count())
	}
}

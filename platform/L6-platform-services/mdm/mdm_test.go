package mdm

import "testing"

func receipt(id string, grams int64) LedgerEntry {
	return LedgerEntry{ID: id, OrgUnit: "SCH1", Date: "2026-06-01", Kind: Receipt, GrainGrams: grams, Note: "lifting"}
}

func meal(id string, served, enrol int, grams int64) MealDay {
	return MealDay{ID: id, OrgUnit: "SCH1", Date: "2026-06-02", MealsServed: served, Enrolment: enrol, GrainGrams: grams}
}

func TestReceiveAndBalance(t *testing.T) {
	s := NewStore()
	if _, err := s.Receive(receipt("R1", 0)); err == nil {
		t.Fatal("non-positive receipt rejected")
	}
	if _, err := s.Receive(LedgerEntry{ID: "R1", OrgUnit: "SCH1", Date: "bad", Kind: Receipt, GrainGrams: 100}); err == nil {
		t.Fatal("bad date rejected")
	}
	s.Receive(receipt("R1", 50000)) // 50 kg
	s.Receive(receipt("R2", 30000)) // 30 kg
	if s.Balance("SCH1") != 80000 {
		t.Fatalf("balance wrong: %d", s.Balance("SCH1"))
	}
	// another school's stock is independent.
	if s.Balance("SCH2") != 0 {
		t.Fatalf("other school balance must be zero: %d", s.Balance("SCH2"))
	}
}

func TestServeDrawsDownStock(t *testing.T) {
	s := NewStore()
	s.Receive(receipt("R1", 100000)) // 100 kg
	// serve 300 children @ 100g = 30 kg.
	if _, err := s.Serve(meal("M1", 300, 320, 30000)); err != nil {
		t.Fatalf("serve: %v", err)
	}
	if s.Balance("SCH1") != 70000 {
		t.Fatalf("stock should draw down to 70kg: %d", s.Balance("SCH1"))
	}
	// the meal record persists with coverage.
	m, _ := s.GetMeal("M1")
	if m.MealsServed != 300 || m.CoverageRate() < 93 || m.CoverageRate() > 94 {
		t.Fatalf("coverage wrong: %+v rate=%v", m, m.CoverageRate())
	}
}

func TestStockCannotGoNegative(t *testing.T) {
	s := NewStore()
	s.Receive(receipt("R1", 20000)) // only 20 kg on hand
	// a day needing 25 kg must be REJECTED (the core leakage gate).
	if _, err := s.Serve(meal("M1", 250, 300, 25000)); err == nil {
		t.Fatal("serving more grain than stock on hand must be rejected")
	}
	// stock unchanged after a rejected serve.
	if s.Balance("SCH1") != 20000 {
		t.Fatalf("rejected serve must not draw down stock: %d", s.Balance("SCH1"))
	}
	// within stock is fine.
	if _, err := s.Serve(meal("M1", 200, 300, 20000)); err != nil {
		t.Fatalf("serving within stock: %v", err)
	}
	if s.Balance("SCH1") != 0 {
		t.Fatalf("stock should be exactly drawn down: %d", s.Balance("SCH1"))
	}
}

func TestServeIdempotentCorrection(t *testing.T) {
	s := NewStore()
	s.Receive(receipt("R1", 100000))
	s.Serve(meal("M1", 300, 320, 30000)) // -30kg → 70kg
	// correct the same day's record to a smaller serving; balance must recompute, not double-deduct.
	if _, err := s.Serve(meal("M1", 250, 320, 25000)); err != nil {
		t.Fatalf("correction: %v", err)
	}
	if s.Balance("SCH1") != 75000 {
		t.Fatalf("idempotent correction wrong, want 75kg: %d", s.Balance("SCH1"))
	}
}

func TestMealsCannotExceedEnrolment(t *testing.T) {
	s := NewStore()
	s.Receive(receipt("R1", 100000))
	if _, err := s.Serve(meal("M1", 400, 300, 30000)); err == nil {
		t.Fatal("meals served cannot exceed enrolment")
	}
	if _, err := s.Serve(MealDay{ID: "M2", OrgUnit: "SCH1", Date: "2026-06-02", MealsServed: 10, Enrolment: 0, GrainGrams: 1000}); err == nil {
		t.Fatal("zero enrolment rejected")
	}
}

func TestListsAndFilters(t *testing.T) {
	s := NewStore()
	s.Receive(receipt("R1", 100000))
	s.Serve(meal("M1", 300, 320, 30000))
	s.Serve(MealDay{ID: "M2", OrgUnit: "SCH1", Date: "2026-06-03", MealsServed: 290, Enrolment: 320, GrainGrams: 29000})
	if len(s.ListLedger(LedgerFilter{Kind: Consumption})) != 2 {
		t.Fatalf("consumption filter wrong: %d", len(s.ListLedger(LedgerFilter{Kind: Consumption})))
	}
	if len(s.ListLedger(LedgerFilter{Kind: Receipt})) != 1 {
		t.Fatal("receipt filter wrong")
	}
	if ms := s.ListMeals(MealFilter{}); len(ms) != 2 || ms[0].Date != "2026-06-03" {
		t.Fatalf("meals order/count wrong: %+v", ms)
	}
	if len(s.ListMeals(MealFilter{Date: "2026-06-02"})) != 1 {
		t.Fatal("meal date filter wrong")
	}
	if s.CountMeals() != 2 {
		t.Fatalf("count wrong: %d", s.CountMeals())
	}
}

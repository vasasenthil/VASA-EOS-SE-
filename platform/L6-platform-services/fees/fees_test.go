package fees

import "testing"

func demand(id string, amount int64) Demand {
	return Demand{ID: id, OrgUnit: "SCH1", StudentID: "SYN-S-1", Category: "exam", Term: "2026-T1", AmountPaise: amount, Status: Pending, DueOn: "2026-07-01"}
}

func payment(id, demandID string, amount int64) Payment {
	return Payment{ID: id, DemandID: demandID, OrgUnit: "SCH1", StudentID: "SYN-S-1", AmountPaise: amount, Mode: Online, Reference: "TXN-" + id, PaidOn: "2026-06-20"}
}

func TestRaiseDemandValidation(t *testing.T) {
	s := NewStore()
	if _, err := s.RaiseDemand(Demand{ID: "D1", OrgUnit: "SCH1", StudentID: "S1", Category: "exam", AmountPaise: 0, Status: Pending, DueOn: "2026-07-01"}); err == nil {
		t.Fatal("zero amount rejected")
	}
	if _, err := s.RaiseDemand(Demand{ID: "D1", OrgUnit: "SCH1", StudentID: "S1", Category: "", AmountPaise: 100, Status: Pending, DueOn: "2026-07-01"}); err == nil {
		t.Fatal("missing category rejected")
	}
	if _, err := s.RaiseDemand(demand("D1", 50000)); err != nil {
		t.Fatalf("valid demand: %v", err)
	}
}

func TestPaymentDrawsDownAndStatus(t *testing.T) {
	s := NewStore()
	s.RaiseDemand(demand("D1", 50000)) // Rs 500.00
	// part payment → partial.
	if _, err := s.RecordPayment(payment("P1", "D1", 20000)); err != nil {
		t.Fatalf("part payment: %v", err)
	}
	if d, _ := s.GetDemand("D1"); d.Status != Partial {
		t.Fatalf("status should be partial: %s", d.Status)
	}
	if s.Outstanding("D1") != 30000 {
		t.Fatalf("outstanding should be 30000p: %d", s.Outstanding("D1"))
	}
	// pay the rest → paid.
	if _, err := s.RecordPayment(payment("P2", "D1", 30000)); err != nil {
		t.Fatalf("final payment: %v", err)
	}
	if d, _ := s.GetDemand("D1"); d.Status != Paid {
		t.Fatalf("status should be paid: %s", d.Status)
	}
	if s.Outstanding("D1") != 0 {
		t.Fatalf("outstanding should be 0: %d", s.Outstanding("D1"))
	}
}

func TestNoOverpayment(t *testing.T) {
	s := NewStore()
	s.RaiseDemand(demand("D1", 50000))
	s.RecordPayment(payment("P1", "D1", 40000))
	// a payment that would take the total above the demand is rejected.
	if _, err := s.RecordPayment(payment("P2", "D1", 20000)); err == nil {
		t.Fatal("an overpayment must be rejected")
	}
	// the rejected payment must not have been recorded.
	if PaidSoFar(s.ListPayments(PaymentFilter{}), "D1", "") != 40000 {
		t.Fatalf("rejected payment must not be recorded: %d", PaidSoFar(s.ListPayments(PaymentFilter{}), "D1", ""))
	}
	// paying exactly the outstanding is fine.
	if _, err := s.RecordPayment(payment("P2", "D1", 10000)); err != nil {
		t.Fatalf("exact balance payment: %v", err)
	}
	// a paid demand takes no more payment.
	if _, err := s.RecordPayment(payment("P3", "D1", 100)); err == nil {
		t.Fatal("a paid demand cannot take more payment")
	}
}

func TestPaymentIdempotentCorrection(t *testing.T) {
	s := NewStore()
	s.RaiseDemand(demand("D1", 50000))
	s.RecordPayment(payment("P1", "D1", 30000))
	// correct P1 down to 20000 — recompute, do not double-count.
	if _, err := s.RecordPayment(payment("P1", "D1", 20000)); err != nil {
		t.Fatalf("correction: %v", err)
	}
	if got := PaidSoFar(s.ListPayments(PaymentFilter{}), "D1", ""); got != 20000 {
		t.Fatalf("idempotent correction wrong, want 20000: %d", got)
	}
	if d, _ := s.GetDemand("D1"); d.Status != Partial {
		t.Fatalf("status should drop back to partial: %s", d.Status)
	}
}

func TestWaiverAndPaymentGuards(t *testing.T) {
	s := NewStore()
	s.RaiseDemand(demand("D1", 50000))
	// payment against an unknown demand fails.
	if _, err := s.RecordPayment(payment("P0", "GHOST", 100)); err == nil {
		t.Fatal("payment against unknown demand must fail")
	}
	// waive the demand → no further payment.
	if d, err := s.WaiveDemand("D1"); err != nil || d.Status != Waived {
		t.Fatalf("waive: %+v err=%v", d, err)
	}
	if _, err := s.RecordPayment(payment("P1", "D1", 100)); err == nil {
		t.Fatal("a waived demand cannot take payment")
	}
	// a paid demand cannot be waived.
	s.RaiseDemand(demand("D2", 10000))
	s.RecordPayment(payment("P2", "D2", 10000))
	if _, err := s.WaiveDemand("D2"); err == nil {
		t.Fatal("a paid demand cannot be waived")
	}
	// unknown demand waive fails.
	if _, err := s.WaiveDemand("GHOST"); err == nil {
		t.Fatal("waiving unknown demand must fail")
	}
}

func TestListsFiltersAndCounts(t *testing.T) {
	s := NewStore()
	s.RaiseDemand(demand("D1", 50000))
	s.RaiseDemand(Demand{ID: "D2", OrgUnit: "SCH1", StudentID: "SYN-S-2", Category: "hostel", Term: "2026-T1", AmountPaise: 100000, Status: Pending, DueOn: "2026-06-01"})
	s.RecordPayment(payment("P1", "D1", 20000))
	if got := s.ListDemands(DemandFilter{}); len(got) != 2 || got[0].ID != "D2" { // ordered by due date
		t.Fatalf("demand order/count wrong: %+v", got)
	}
	if len(s.ListDemands(DemandFilter{Category: "hostel"})) != 1 {
		t.Fatal("category filter wrong")
	}
	if len(s.ListDemands(DemandFilter{Status: Partial})) != 1 {
		t.Fatal("status filter wrong")
	}
	if len(s.ListPayments(PaymentFilter{DemandID: "D1"})) != 1 {
		t.Fatal("payment demand filter wrong")
	}
	if s.CountDemands() != 2 {
		t.Fatalf("count wrong: %d", s.CountDemands())
	}
}

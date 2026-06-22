package integration

import (
	"os"
	"testing"

	"github.com/vasa-eos-se-tn/platform/fees"
)

// TestPgFeesDurable proves demands + payments persist across fresh instances, the no-overpayment invariant is
// enforced durably (and atomically with the status recompute), and a re-recorded payment corrects idempotently.
// Runs only with DATABASE_URL set.
func TestPgFeesDurable(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set; durable PostgreSQL fees test runs against a live database only")
	}
	s1, err := newPgFeesStore(dsn)
	if err != nil {
		t.Fatalf("connect/migrate: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM fee_payments WHERE org_unit='PGF-SCH'`); err != nil {
		t.Fatalf("cleanup payments: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM fee_demands WHERE org_unit='PGF-SCH'`); err != nil {
		t.Fatalf("cleanup demands: %v", err)
	}
	dem := func(id string, amount int64) fees.Demand {
		return fees.Demand{ID: id, OrgUnit: "PGF-SCH", StudentID: "ST-1", Category: "exam", Term: "T1", AmountPaise: amount, Status: fees.Pending, DueOn: "2026-06-01"}
	}
	pay := func(id, demandID string, amount int64) fees.Payment {
		return fees.Payment{ID: id, DemandID: demandID, OrgUnit: "PGF-SCH", StudentID: "ST-1", AmountPaise: amount, Mode: fees.UPI, Reference: "R-" + id, PaidOn: "2026-05-28"}
	}

	if _, err := s1.RaiseDemand(dem("PGF-D1", 50000)); err != nil { // Rs 500.00
		t.Fatalf("raise: %v", err)
	}
	if _, err := s1.RecordPayment(pay("PGF-P1", "PGF-D1", 40000)); err != nil {
		t.Fatalf("payment: %v", err)
	}
	if s1.Outstanding("PGF-D1") != 10000 {
		t.Fatalf("outstanding wrong: %d", s1.Outstanding("PGF-D1"))
	}
	// an overpayment (10001 > 10000 remaining) is rejected durably.
	if _, err := s1.RecordPayment(pay("PGF-P2", "PGF-D1", 10001)); err == nil {
		t.Fatal("a durable overpayment must be rejected")
	}

	// fresh instance: demand + payment durable, partial status, invariant still enforced.
	s2, _ := newPgFeesStore(dsn)
	if d, _ := s2.GetDemand("PGF-D1"); d.Status != fees.Partial {
		t.Fatalf("durable status should be partial: %s", d.Status)
	}
	if s2.Outstanding("PGF-D1") != 10000 {
		t.Fatalf("durable outstanding wrong: %d", s2.Outstanding("PGF-D1"))
	}
	if _, err := s2.RecordPayment(pay("PGF-P2", "PGF-D1", 50000)); err == nil {
		t.Fatal("the overpayment guard must persist across instances")
	}
	// pay the exact balance → paid, durable.
	if _, err := s2.RecordPayment(pay("PGF-P2", "PGF-D1", 10000)); err != nil {
		t.Fatalf("balance payment: %v", err)
	}
	s3, _ := newPgFeesStore(dsn)
	if d, _ := s3.GetDemand("PGF-D1"); d.Status != fees.Paid {
		t.Fatalf("durable status should be paid: %s", d.Status)
	}
	// a paid demand takes no more payment.
	if _, err := s3.RecordPayment(pay("PGF-P3", "PGF-D1", 100)); err == nil {
		t.Fatal("a paid demand cannot take more payment")
	}

	// idempotent correction: re-record P1 down to 20000 on a second demand and confirm no double-count.
	s3.RaiseDemand(dem("PGF-D2", 50000))
	s3.RecordPayment(pay("PGF-Q1", "PGF-D2", 30000))
	if _, err := s3.RecordPayment(pay("PGF-Q1", "PGF-D2", 20000)); err != nil {
		t.Fatalf("correction: %v", err)
	}
	s4, _ := newPgFeesStore(dsn)
	if s4.Outstanding("PGF-D2") != 30000 {
		t.Fatalf("idempotent correction wrong, want 30000 outstanding: %d", s4.Outstanding("PGF-D2"))
	}

	// waiver closes a demand to payment, durable.
	s4.RaiseDemand(dem("PGF-D3", 25000))
	if _, err := s4.WaiveDemand("PGF-D3"); err != nil {
		t.Fatalf("waive: %v", err)
	}
	s5, _ := newPgFeesStore(dsn)
	if d, _ := s5.GetDemand("PGF-D3"); d.Status != fees.Waived {
		t.Fatalf("waiver not durable: %s", d.Status)
	}
	if _, err := s5.RecordPayment(pay("PGF-W1", "PGF-D3", 100)); err == nil {
		t.Fatal("a waived demand cannot take payment, durably")
	}
}

// TestFeeDashboardScoped proves the seeded ledger rolls up collection + the defaulter roster (in-memory path).
func TestFeeDashboardScoped(t *testing.T) {
	p := newPlatform(t)
	d := p.FeeDashboard("TN-DIST-Chennai")
	if d.Demands == 0 || d.DemandedP == 0 {
		t.Fatalf("seeded ledger must roll up: %+v", d)
	}
	if d.CollectedP == 0 || d.OutstandingP == 0 {
		t.Fatalf("collected + outstanding must be computed: %+v", d)
	}
	if d.CollectionPct <= 0 || d.CollectionPct >= 100 {
		t.Fatalf("a partial-collection ledger must be between 0 and 100 pct: %v", d.CollectionPct)
	}
	// the seed has two unpaid past-due demands → defaulters surface.
	if len(d.Defaulters) < 2 {
		t.Fatalf("past-due unpaid demands must surface as defaulters: %+v", d.Defaulters)
	}
	// the seed waives one demand.
	if d.ByStatus[fees.Waived] == 0 || d.WaivedP == 0 {
		t.Fatalf("the waived concession must be accounted: %+v", d)
	}
	// a seeded fully-paid student has both a demand and a payment in their ledger.
	dems, pays := p.StudentFeeLedger("", "SYN-S-001")
	if len(dems) == 0 || len(pays) == 0 {
		t.Fatalf("a seeded payer must have demands and payments: demands=%d payments=%d", len(dems), len(pays))
	}
	// unknown scope → nothing (fail-closed).
	if u := p.FeeDashboard("TN-DIST-Nowhere"); u.Demands != 0 {
		t.Fatalf("unknown scope must see nothing: %+v", u)
	}
}

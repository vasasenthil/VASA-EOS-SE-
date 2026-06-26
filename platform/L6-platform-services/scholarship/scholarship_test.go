package scholarship

import (
	"testing"
	"time"
)

func clk() func() time.Time {
	t, _ := time.Parse(time.RFC3339, "2026-06-01T00:00:00Z")
	return func() time.Time { return t }
}

func rupees(n int64) int64 { return n * 100 }

func TestAmountDrivenChain(t *testing.T) {
	if got := ChainFor(rupees(10_000)); len(got) != 2 {
		t.Fatalf("small amount = school+block: %+v", got)
	}
	if got := ChainFor(rupees(60_000)); len(got) != 3 || got[2].Role != "DEO" {
		t.Fatalf(">50k adds the DEO: %+v", got)
	}
	if got := ChainFor(rupees(250_000)); len(got) != 4 || got[3].Role != "DIRECTOR" {
		t.Fatalf(">2L adds the directorate: %+v", got)
	}
}

func TestFileValidationAndFullLifecycle(t *testing.T) {
	s := NewStoreWithClock(clk())
	if _, err := s.File("X", "STU1", "nope", rupees(1000), "SCH1"); err == nil {
		t.Fatal("invalid scheme rejected")
	}
	if _, err := s.File("X", "STU1", PreMatric, 0, "SCH1"); err == nil {
		t.Fatal("non-positive amount rejected")
	}
	// a ₹60,000 post-matric needs school -> BEO -> DEO.
	d, err := s.File("D1", "STU1", PostMatric, rupees(60_000), "SCH1")
	if err != nil || len(d.Chain) != 3 || d.Status != Pending {
		t.Fatalf("file: %+v err=%v", d, err)
	}
	if d.Rupees() != 60_000 {
		t.Fatalf("rupees conversion wrong: %d", d.Rupees())
	}
	// wrong tier rejected.
	if _, err := s.Decide("D1", true, "DEO", "x", ""); err == nil {
		t.Fatal("the head teacher must sanction first")
	}
	// walk the chain to sanctioned.
	for i, role := range []string{"HEAD_TEACHER", "BEO", "DEO"} {
		out, err := s.Decide("D1", true, role, "officer", "ok")
		if err != nil {
			t.Fatalf("tier %d (%s): %v", i, role, err)
		}
		if i < 2 && out.Status != Pending {
			t.Fatalf("still pending after tier %d: %+v", i, out)
		}
	}
	if d, _ := s.Get("D1"); d.Status != Sanctioned {
		t.Fatalf("must be sanctioned: %+v", d)
	}
	// cannot disburse without a payment ref.
	if _, err := s.Disburse("D1", ""); err == nil {
		t.Fatal("disburse needs a payment ref")
	}
	if d, err := s.Disburse("D1", "PFMS-TXN-9001"); err != nil || d.Status != Disbursed || d.PaymentRef == "" {
		t.Fatalf("disburse: %+v err=%v", d, err)
	}
	// reconcile matched.
	if d, err := s.Reconcile("D1", true); err != nil || d.Status != Reconciled {
		t.Fatalf("reconcile: %+v err=%v", d, err)
	}
}

func TestRejectAndLeakageFlag(t *testing.T) {
	s := NewStoreWithClock(clk())
	s.File("D2", "STU2", Merit, rupees(5_000), "SCH1")
	if d, _ := s.Decide("D2", false, "HEAD_TEACHER", "p", "ineligible"); d.Status != Rejected {
		t.Fatalf("reject must stop sanction: %+v", d)
	}
	// a disbursed case that the rail does not confirm is flagged (leakage signal).
	s.File("D3", "STU3", Maintenance, rupees(2_000), "SCH1")
	s.Decide("D3", true, "HEAD_TEACHER", "p", "")
	s.Decide("D3", true, "BEO", "b", "")
	s.Disburse("D3", "PFMS-TXN-3")
	if d, err := s.Reconcile("D3", false); err != nil || d.Status != Flagged {
		t.Fatalf("unmatched disbursement must be flagged: %+v err=%v", d, err)
	}
}

func TestListFilter(t *testing.T) {
	s := NewStoreWithClock(clk())
	s.File("A", "S1", PreMatric, rupees(1000), "SCH1")
	s.File("B", "S2", Merit, rupees(1000), "SCH2")
	if got := s.List(Filter{Scheme: Merit}); len(got) != 1 || got[0].ID != "B" {
		t.Fatalf("scheme filter wrong: %+v", got)
	}
	if got := s.List(Filter{Orgs: map[string]bool{"SCH1": true}}); len(got) != 1 || got[0].ID != "A" {
		t.Fatalf("org filter wrong: %+v", got)
	}
}

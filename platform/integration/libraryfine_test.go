package integration

import "testing"

// Unit tests for the Library Fine Ledger invariants (pure transitions; money in paise).

func baseLedger() MemberFines {
	return MemberFines{ID: "FINE-T", OrgUnit: "SCH-T", MemberID: "SYN-S-T", BlockThresholdPaise: 100_00}
}

func TestLibraryFineNoOverpay(t *testing.T) {
	m, _ := applyAccrue(baseLedger(), "F1", "Wings of Fire", 5, 2_00, "now") // ₹10 fine
	if _, err := applyPayFine(m, "F1", 10_01, "now"); err == nil {
		t.Fatal("expected a payment exceeding the outstanding to be rejected (no overpay)")
	}
	out, err := applyPayFine(m, "F1", 10_00, "now")
	if err != nil || out.Fines[0].Status != FinePaid {
		t.Fatalf("expected a full payment to settle the fine, status=%s err=%v", out.Fines[0].Status, err)
	}
}

func TestLibraryFineNoReSettle(t *testing.T) {
	m, _ := applyAccrue(baseLedger(), "F1", "Book", 5, 2_00, "now")
	paid, _ := applyPayFine(m, "F1", 10_00, "now")
	if _, err := applyPayFine(paid, "F1", 1_00, "now"); err == nil {
		t.Fatal("expected paying an already-paid fine to be rejected")
	}
	if _, err := applyWaiveFine(paid, "F1", "now"); err == nil {
		t.Fatal("expected waiving an already-paid fine to be rejected")
	}
}

func TestLibraryFineBorrowBlock(t *testing.T) {
	// Outstanding ₹160 > ₹100 threshold → blocked.
	blocked, _ := applyAccrue(baseLedger(), "F1", "Atlas", 80, 2_00, "now")
	if blocked.BorrowEligible() {
		t.Fatal("expected the member to be borrow-blocked while over the threshold")
	}
	// Pay it down to within the threshold → eligible again.
	cleared, _ := applyPayFine(blocked, "F1", 70_00, "now") // outstanding now ₹90 ≤ ₹100
	if !cleared.BorrowEligible() {
		t.Fatalf("expected the member to be eligible once outstanding (%d) is within the threshold", cleared.OutstandingPaise())
	}
}

func TestLibraryFineWaiveClearsOutstanding(t *testing.T) {
	blocked, _ := applyAccrue(baseLedger(), "F1", "Atlas", 80, 2_00, "now")
	waived, err := applyWaiveFine(blocked, "F1", "now")
	if err != nil {
		t.Fatalf("waive should succeed: %v", err)
	}
	if waived.OutstandingPaise() != 0 || !waived.BorrowEligible() {
		t.Fatalf("expected a waived fine to clear the outstanding, got %d", waived.OutstandingPaise())
	}
}

package integration

import "testing"

// Unit tests for the Petty Cash / Imprest invariants (pure transitions; money in paise).

func baseImprest() ImprestBook {
	return ImprestBook{ID: "IMP-T", OrgUnit: "SCH-T", SanctionedPaise: 10_000_00, CashPaise: 10_000_00, Status: ImprestOpen}
}

func voucher(amt int64) Voucher {
	return Voucher{ID: "V-T", Payee: "SYN-VEN", Purpose: "Stationery", AmountPaise: amt}
}

func TestImprestNoOverspend(t *testing.T) {
	b := baseImprest()
	if _, err := applySpend(b, voucher(10_000_01), "now"); err == nil {
		t.Fatal("expected a voucher exceeding cash on hand to be rejected (no negative cash)")
	}
	out, err := applySpend(b, voucher(1_200_00), "now")
	if err != nil || out.CashPaise != 8_800_00 {
		t.Fatalf("expected a valid voucher to leave 8_800_00 cash, got %d (err=%v)", out.CashPaise, err)
	}
}

func TestImprestCeiling(t *testing.T) {
	b, _ := applySpend(baseImprest(), voucher(2_000_00), "now") // cash 8_000_00
	// Replenishing back to the float is fine.
	ok, err := applyReplenish(b, 2_000_00, "now")
	if err != nil || ok.CashPaise != 10_000_00 {
		t.Fatalf("expected replenish to restore the float, cash=%d err=%v", ok.CashPaise, err)
	}
	// Replenishing beyond the sanctioned float is rejected.
	if _, err := applyReplenish(b, 2_000_01, "now"); err == nil {
		t.Fatal("expected a replenishment beyond the sanctioned float to be rejected (imprest ceiling)")
	}
}

func TestImprestSettlementGate(t *testing.T) {
	// Spend then try to settle with unreimbursed cash → rejected.
	spent, _ := applySpend(baseImprest(), voucher(3_000_00), "now") // cash 7_000_00
	if spent.UnreimbursedPaise() != 3_000_00 {
		t.Fatalf("setup: expected 3_000_00 unreimbursed, got %d", spent.UnreimbursedPaise())
	}
	if _, err := applySettle(spent, "now"); err == nil {
		t.Fatal("expected settlement to be rejected while cash < sanctioned (unreimbursed spend)")
	}
	// Reimburse the spend, then settle → succeeds.
	whole, _ := applyReplenish(spent, 3_000_00, "now")
	out, err := applySettle(whole, "now")
	if err != nil || out.Status != ImprestSettled {
		t.Fatalf("expected settlement to succeed once the float is whole, status=%s err=%v", out.Status, err)
	}
}

func TestImprestNoSpendOrReplenishWhenSettled(t *testing.T) {
	settled, _ := applySettle(baseImprest(), "now") // cash == sanctioned at open, so settles
	if _, err := applySpend(settled, voucher(100_00), "now"); err == nil {
		t.Fatal("expected spending on a settled book to be rejected")
	}
	if _, err := applyReplenish(settled, 100_00, "now"); err == nil {
		t.Fatal("expected replenishing a settled book to be rejected")
	}
}

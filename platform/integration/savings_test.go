package integration

import "testing"

// Unit tests for the School Bank / Student Savings invariants (pure transitions; money in paise).

func baseAccount() SavingsAccount {
	return SavingsAccount{ID: "SAV-T", OrgUnit: "SCH-T", StudentID: "SYN-S-T", Status: AcctActive}
}

func TestSavingsNoNegativeBalance(t *testing.T) {
	a, _ := applyDeposit(baseAccount(), "T1", 500_00, "now")
	if _, err := applySavingsWithdraw(a, "T2", 500_01, "now"); err == nil {
		t.Fatal("expected a withdrawal exceeding the balance to be rejected (no negative balance)")
	}
	out, err := applySavingsWithdraw(a, "T2", 150_00, "now")
	if err != nil || out.BalancePaise != 350_00 {
		t.Fatalf("expected a valid withdrawal to leave 350_00, got %d (err=%v)", out.BalancePaise, err)
	}
}

func TestSavingsNoTxnWhenFrozen(t *testing.T) {
	a, _ := applyDeposit(baseAccount(), "T1", 500_00, "now")
	frozen, _ := applySetFreeze(a, true, "now")
	if _, err := applyDeposit(frozen, "T2", 100_00, "now"); err == nil {
		t.Fatal("expected a deposit on a frozen account to be rejected")
	}
	if _, err := applySavingsWithdraw(frozen, "T2", 100_00, "now"); err == nil {
		t.Fatal("expected a withdrawal on a frozen account to be rejected")
	}
	// Unfreeze restores normal operation.
	thawed, _ := applySetFreeze(frozen, false, "now")
	if _, err := applySavingsWithdraw(thawed, "T2", 100_00, "now"); err != nil {
		t.Fatalf("expected a withdrawal after unfreezing to succeed: %v", err)
	}
}

func TestSavingsNoCloseWithBalance(t *testing.T) {
	a, _ := applyDeposit(baseAccount(), "T1", 500_00, "now")
	if _, err := applyCloseAccount(a, "now"); err == nil {
		t.Fatal("expected closing an account with a balance to be rejected")
	}
	// Withdraw to zero, then close.
	empty, _ := applySavingsWithdraw(a, "T2", 500_00, "now")
	out, err := applyCloseAccount(empty, "now")
	if err != nil || out.Status != AcctClosed {
		t.Fatalf("expected closing a zero-balance account to succeed, status=%s err=%v", out.Status, err)
	}
}

func TestSavingsNoTxnWhenClosed(t *testing.T) {
	closed, _ := applyCloseAccount(baseAccount(), "now") // zero balance at open → closes
	if _, err := applyDeposit(closed, "T1", 100_00, "now"); err == nil {
		t.Fatal("expected a deposit on a closed account to be rejected")
	}
}

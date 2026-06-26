package integration

import "testing"

// Unit tests for the Staff Disciplinary / Vigilance invariants (pure transitions; due process).

func baseCase() DisciplinaryCase {
	return DisciplinaryCase{ID: "DIS-T", OrgUnit: "SCH-T", EmployeeID: "SYN-T-1", Charge: "Misconduct", Stage: DiscCharged}
}

func TestDisciplinaryNoPenaltyWithoutInquiry(t *testing.T) {
	// Deciding a freshly-charged case (no inquiry) is rejected — natural justice.
	if _, err := applyDecide(baseCase(), "censure", "now"); err == nil {
		t.Fatal("expected a decision without an inquiry to be rejected")
	}
	// After an inquiry, a decision is allowed.
	inq, err := applyInquiry(baseCase(), "Charge proved", "now")
	if err != nil {
		t.Fatalf("inquiry should succeed: %v", err)
	}
	out, err := applyDecide(inq, "censure", "now")
	if err != nil || out.Stage != DiscDecided {
		t.Fatalf("expected a decision after inquiry to succeed, stage=%s err=%v", out.Stage, err)
	}
}

func TestDisciplinaryValidPenalty(t *testing.T) {
	inq, _ := applyInquiry(baseCase(), "Charge proved", "now")
	if _, err := applyDecide(inq, "fine_1000", "now"); err == nil {
		t.Fatal("expected an unsanctioned penalty to be rejected")
	}
}

func TestDisciplinaryAppealOnlyAfterDecision(t *testing.T) {
	// Cannot appeal a charge-only case.
	if _, err := applyAppeal(baseCase(), "grounds", "now"); err == nil {
		t.Fatal("expected an appeal before a decision to be rejected")
	}
	// Decided case can be appealed.
	inq, _ := applyInquiry(baseCase(), "Charge proved", "now")
	dec, _ := applyDecide(inq, "withhold_increment", "now")
	out, err := applyAppeal(dec, "Penalty disproportionate", "now")
	if err != nil || !out.Appealed {
		t.Fatalf("expected an appeal on a decided case to succeed, appealed=%v err=%v", out.Appealed, err)
	}
}

func TestDisciplinaryStageOrdering(t *testing.T) {
	// Inquiry can only be held at charge_issued.
	inq, _ := applyInquiry(baseCase(), "Charge proved", "now")
	if _, err := applyInquiry(inq, "again", "now"); err == nil {
		t.Fatal("expected a second inquiry to be rejected")
	}
	// Close only from decided.
	if _, err := applyCloseCase(inq, "now"); err == nil {
		t.Fatal("expected closing a non-decided case to be rejected")
	}
	dec, _ := applyDecide(inq, "censure", "now")
	closed, err := applyCloseCase(dec, "now")
	if err != nil || closed.Stage != DiscClosed {
		t.Fatalf("expected closing a decided case to succeed, stage=%s err=%v", closed.Stage, err)
	}
}

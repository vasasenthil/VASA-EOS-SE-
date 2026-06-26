package integration

import "testing"

// Unit tests for the Textbook / Uniform Indent invariants (pure transitions).

func baseIndent() TextbookIndent {
	return TextbookIndent{ID: "IND-T", OrgUnit: "SCH-T", Item: "textbook_set", EntitledQty: 320, IndentedQty: 300, Status: IndentRaised}
}

func TestIndentNoOverIndent(t *testing.T) {
	over := baseIndent()
	over.IndentedQty = 321 // > entitlement 320
	if err := over.Validate(); err == nil {
		t.Fatal("expected indenting beyond the entitlement to be rejected")
	}
	if baseIndent().Validate() != nil {
		t.Fatal("expected a within-entitlement indent to validate")
	}
}

func TestIndentApprovalCap(t *testing.T) {
	if _, err := applyApproveIndent(baseIndent(), 301, "now"); err == nil {
		t.Fatal("expected approving more than the indented quantity to be rejected (approval cap)")
	}
	out, err := applyApproveIndent(baseIndent(), 280, "now")
	if err != nil || out.Status != IndentApproved || out.ApprovedQty != 280 {
		t.Fatalf("expected approval of 280 to succeed, status=%s approved=%d err=%v", out.Status, out.ApprovedQty, err)
	}
}

func TestIndentNoOverSupply(t *testing.T) {
	approved, _ := applyApproveIndent(baseIndent(), 280, "now")
	if _, err := applySupplyIndent(approved, 281, "now"); err == nil {
		t.Fatal("expected supplying more than approved to be rejected (no over-supply)")
	}
	// Partial supply keeps the indent approved; completing it marks it supplied.
	part, err := applySupplyIndent(approved, 200, "now")
	if err != nil || part.Status != IndentApproved || part.SuppliedQty != 200 {
		t.Fatalf("expected a partial supply to leave status approved at 200, status=%s supplied=%d err=%v", part.Status, part.SuppliedQty, err)
	}
	if _, err := applySupplyIndent(part, 81, "now"); err == nil {
		t.Fatal("expected the cumulative over-supply (200+81 > 280) to be rejected")
	}
	full, err := applySupplyIndent(part, 80, "now")
	if err != nil || full.Status != IndentSupplied {
		t.Fatalf("expected completing the supply to mark it supplied, status=%s err=%v", full.Status, err)
	}
}

func TestIndentStageGuards(t *testing.T) {
	// Cannot supply before approval.
	if _, err := applySupplyIndent(baseIndent(), 10, "now"); err == nil {
		t.Fatal("expected supply before approval to be rejected")
	}
	// Cannot approve twice.
	approved, _ := applyApproveIndent(baseIndent(), 100, "now")
	if _, err := applyApproveIndent(approved, 100, "now"); err == nil {
		t.Fatal("expected re-approval to be rejected")
	}
	// Reject only from raised.
	if _, err := applyRejectIndent(approved, "now"); err == nil {
		t.Fatal("expected rejecting an already-approved indent to be rejected")
	}
}

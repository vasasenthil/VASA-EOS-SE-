package integration

import "testing"

// Unit tests for the Government Order lifecycle invariants: linear stage progression, gazette-number-on-issue
// with cross-order uniqueness, and terminal withdrawal — the pure transitions plus the Platform-level
// duplicate-number guard exercised through a real Platform.

func baseGO() GovernmentOrder {
	return GovernmentOrder{ID: "GO-T", OrgUnit: "SCH-T", Department: "School Education (SE1)", Category: "scheme", Subject: "Test order", Status: GODrafted}
}

func TestGOLinearProgression(t *testing.T) {
	o := baseGO()
	// Cannot approve a draft (must be vetted first).
	if _, err := applyApproveGO(o, "SYN-SEC-01", "now"); err == nil {
		t.Fatal("expected approving an un-vetted draft to be rejected")
	}
	// Cannot issue a draft.
	if _, err := applyIssueGO(o, "G.O.No.1", "now"); err == nil {
		t.Fatal("expected issuing an un-approved order to be rejected")
	}
	o, err := applyVetGO(o, "SYN-LAW-01", "now")
	if err != nil || o.Status != GOVetted {
		t.Fatalf("vet should succeed: status=%s err=%v", o.Status, err)
	}
	o, err = applyApproveGO(o, "SYN-SEC-01", "now")
	if err != nil || o.Status != GOApproved {
		t.Fatalf("approve should succeed: status=%s err=%v", o.Status, err)
	}
	// Cannot publish before issue.
	if _, err := applyPublishGO(o, "now"); err == nil {
		t.Fatal("expected publishing an un-issued order to be rejected")
	}
}

func TestGOIssueRequiresNumber(t *testing.T) {
	o, _ := applyVetGO(baseGO(), "SYN-LAW-01", "now")
	o, _ = applyApproveGO(o, "SYN-SEC-01", "now")
	if _, err := applyIssueGO(o, "", "now"); err == nil {
		t.Fatal("expected issuing without a gazette number to be rejected")
	}
	o, err := applyIssueGO(o, "G.O.(Ms)No.42/SE/2026", "now")
	if err != nil || o.Status != GOIssued || o.Number == "" {
		t.Fatalf("issue with a number should succeed: status=%s number=%q err=%v", o.Status, o.Number, err)
	}
	pub, err := applyPublishGO(o, "now")
	if err != nil || pub.Status != GOPublished {
		t.Fatalf("publish should succeed: status=%s err=%v", pub.Status, err)
	}
}

func TestGOWithdrawalIsTerminal(t *testing.T) {
	if _, err := applyWithdrawGO(baseGO(), "", "now"); err == nil {
		t.Fatal("expected withdrawal without a reason to be rejected")
	}
	w, err := applyWithdrawGO(baseGO(), "superseded by a later order", "now")
	if err != nil || w.Status != GOWithdrawn {
		t.Fatalf("withdraw should succeed: status=%s err=%v", w.Status, err)
	}
	if _, err := applyWithdrawGO(w, "again", "now"); err == nil {
		t.Fatal("expected withdrawing an already-withdrawn order to be rejected")
	}
	if _, err := applyVetGO(w, "SYN-LAW-01", "now"); err == nil {
		t.Fatal("expected a withdrawn order to be non-advanceable")
	}
}

func TestGONumberUniqueness(t *testing.T) {
	p := newPlatform(t)
	mk := func(id string) string {
		if _, err := p.DraftGO(GovernmentOrder{ID: id, OrgUnit: "TN", Department: "SE1", Category: "policy", Subject: "S"}); err != nil {
			t.Fatalf("draft %s: %v", id, err)
		}
		if _, err := p.VetGO(id, "SYN-LAW-01"); err != nil {
			t.Fatalf("vet %s: %v", id, err)
		}
		if _, err := p.ApproveGO(id, "SYN-SEC-01"); err != nil {
			t.Fatalf("approve %s: %v", id, err)
		}
		return id
	}
	a := mk("GO-UT-A")
	b := mk("GO-UT-B")
	if _, err := p.IssueGO(a, "G.O.(Ms)No.777/SE/2026"); err != nil {
		t.Fatalf("first issue should succeed: %v", err)
	}
	// Same gazette number on a different order → duplicate rejected.
	if _, err := p.IssueGO(b, "G.O.(Ms)No.777/SE/2026"); err == nil {
		t.Fatal("expected a duplicate gazette number to be rejected")
	}
	// A distinct number issues fine.
	if _, err := p.IssueGO(b, "G.O.(Ms)No.778/SE/2026"); err != nil {
		t.Fatalf("distinct number should issue: %v", err)
	}
}
